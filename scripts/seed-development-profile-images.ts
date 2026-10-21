import { Pool } from 'pg'
import {
  assertLocalDevelopmentProfileTarget,
  developmentGuestProfiles,
  developmentProfileImages,
  fillDevelopmentPortrait,
} from '../src/db/seeds/development-profile-images'
import {
  reviewWorkspaceIds,
  reviewWorkspaceOrganizationNames,
} from '../src/db/review-workspace-fixture'

// Deliberately independent of auth, media configuration and the reset seed.
// No account creation, access changes, uploads or notification delivery.
async function main() {
  const args = process.argv.slice(2)
  if (args.some((arg) => arg !== '--apply')) throw new Error('Only --apply is supported.')
  const databaseUrl = process.env.DATABASE_URL ?? ''
  assertLocalDevelopmentProfileTarget(databaseUrl, process.env.NODE_ENV)
  const apply = args.includes('--apply')
  const pool = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 5000 })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query("SET LOCAL statement_timeout = '10s'")
    const accounts = await client.query<{
      id: string
      name: string
      email: string
      image: string | null
    }>('SELECT id, name, email, image FROM "user" WHERE email = ANY($1::text[]) FOR UPDATE', [
      developmentProfileImages.map((profile) => profile.email),
    ])
    const fixtureAccountPersonIDs = new Map([
      ['planner@gatherory.test', reviewWorkspaceIds.people.alex],
      ['jordan@gatherory.test', reviewWorkspaceIds.people.jordan],
      ['coordinator@gatherory.test', reviewWorkspaceIds.people.maya],
      ['guest@gatherory.test', reviewWorkspaceIds.people.sam],
      ['appreview@gatherory.test', reviewWorkspaceIds.people.appReview],
      ['reception-planner@gatherory.test', reviewWorkspaceIds.people.receptionPlanner],
    ])
    const profiles = new Map<string, { id: string; email: string; name: string; image: string }>()
    const guestProfiles = new Map(
      developmentGuestProfiles.map((profile) => [profile.id, profile] as const)
    )
    const counts = {
      accounts: 0,
      people: 0,
      guests: 0,
      snapshots: 0,
      syncEntities: 0,
    }
    for (const account of accounts.rows) {
      const fixture = developmentProfileImages.find((profile) => profile.email === account.email)!
      if (account.name !== fixture.name)
        throw new Error('Fixture account name differs; refusing portrait update.')
      // Existing custom pictures survive this incremental update.
      const image = account.image?.trim() ? account.image : fixture.image
      const personID = fixtureAccountPersonIDs.get(account.email)
      if (personID)
        profiles.set(account.id, { id: personID, email: account.email, name: fixture.name, image })
      const updated = await client.query(
        'UPDATE "user" SET image = $1, updated_at = now() WHERE id = $2 AND email = $3 AND name = $4 AND (image IS NULL OR btrim(image) = \'\')',
        [image, account.id, account.email, fixture.name]
      )
      counts.accounts += updated.rowCount ?? 0
    }

    const owner = accounts.rows.find((account) => account.email === 'planner@gatherory.test')
    const snapshots = owner
      ? await client.query<{
          scope_id: string
          organization_id: string
          payload: string
        }>(
          `SELECT snapshot.scope_id, snapshot.organization_id, snapshot.payload
           FROM native_workspace_snapshot AS snapshot
           INNER JOIN organization ON organization.id = snapshot.organization_id
           WHERE snapshot.scope_id = $1
             AND snapshot.owner_user_id = $2
             AND snapshot.is_deleted = false
             AND organization.name = ANY($3::text[])
             AND organization.workspace_type = 'event'
           FOR UPDATE OF snapshot`,
          [
            reviewWorkspaceIds.events.main,
            owner.id,
            Object.values(reviewWorkspaceOrganizationNames),
          ]
        )
      : { rows: [] }

    const fixtureSnapshot = snapshots.rows[0]
    if (fixtureSnapshot) {
      for (const [userID, profile] of profiles) {
        const person = await client.query(
          `UPDATE workspace_person
           SET avatar_url = $1, updated_at = now()
           WHERE organization_id = $2 AND id = $3 AND user_id = $4
             AND email = $5 AND display_name = $6
             AND (avatar_url IS NULL OR btrim(avatar_url) = '')`,
          [
            profile.image,
            fixtureSnapshot.organization_id,
            profile.id,
            userID,
            profile.email,
            profile.name,
          ]
        )
        counts.people += person.rowCount ?? 0
      }
      for (const guest of developmentGuestProfiles) {
        const person = await client.query(
          `UPDATE workspace_person
           SET avatar_url = $1, updated_at = now()
           WHERE organization_id = $2 AND id = $3 AND user_id IS NULL
             AND email = $4 AND display_name = $5
             AND (avatar_url IS NULL OR btrim(avatar_url) = '')`,
          [guest.image, fixtureSnapshot.organization_id, guest.id, guest.email, guest.name]
        )
        counts.guests += person.rowCount ?? 0
      }
    }

    // Keep bootstrap and subsequent pulls aligned with normalized fixture rows.
    // The owner, scope and organization must all match the exact reset fixture.
    function patch(payload: string, kind: string): string | null {
      const value = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
      const people =
        kind === 'participant' ? [value] : Array.isArray(value.members) ? value.members : []
      let changed = false
      for (const person of people)
        changed = fillDevelopmentPortrait(person, profiles, guestProfiles) || changed
      return changed ? Buffer.from(JSON.stringify(value)).toString('base64') : null
    }
    if (fixtureSnapshot) {
      const payload = patch(fixtureSnapshot.payload, 'workspace')
      if (payload) {
        await client.query(
          `UPDATE native_workspace_snapshot
           SET payload = $1, server_version = server_version + 1, updated_at = now()
           WHERE scope_id = $2 AND organization_id = $3 AND owner_user_id = $4 AND is_deleted = false`,
          [payload, fixtureSnapshot.scope_id, fixtureSnapshot.organization_id, owner!.id]
        )
        counts.snapshots++
      }
      const entities = await client.query<{
        entity_type: string
        entity_id: string
        owner_user_id: string
        payload: string
        server_version: number
      }>(
        `SELECT entity_type, entity_id, owner_user_id, payload, server_version
         FROM native_sync_entity
         WHERE scope_id = $1 AND owner_user_id = ANY($2::text[])
           AND entity_type IN ('workspace', 'participant') AND is_deleted = false
         FOR UPDATE`,
        [fixtureSnapshot.scope_id, [...profiles.keys()]]
      )
      for (const entity of entities.rows) {
        const updatedPayload = patch(entity.payload, entity.entity_type)
        if (!updatedPayload) continue
        const version = entity.server_version + 1
        await client.query(
          `UPDATE native_sync_entity SET payload = $1, server_version = $2, updated_at = now()
           WHERE scope_id = $3 AND entity_type = $4 AND entity_id = $5 AND owner_user_id = $6`,
          [
            updatedPayload,
            version,
            fixtureSnapshot.scope_id,
            entity.entity_type,
            entity.entity_id,
            entity.owner_user_id,
          ]
        )
        await client.query(
          "INSERT INTO native_sync_change (owner_user_id, scope_id, entity_type, entity_id, operation, payload, server_version) VALUES ($1, $2, $3, $4, 'update', $5, $6)",
          [
            entity.owner_user_id,
            fixtureSnapshot.scope_id,
            entity.entity_type,
            entity.entity_id,
            updatedPayload,
            version,
          ]
        )
        counts.syncEntities++
      }
    }
    await client.query(apply ? 'COMMIT' : 'ROLLBACK')
    console.log(
      JSON.stringify({
        mode: apply ? 'applied' : 'dry-run',
        fixtureAccountsFound: accounts.rowCount,
        ...counts,
      })
    )
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(() => {
  // Never echo database URLs, SQL parameters or local credentials.
  console.error(
    'Development portrait update failed. Check the local target, fixture identities and schema; no transaction was committed.'
  )
  process.exitCode = 1
})
