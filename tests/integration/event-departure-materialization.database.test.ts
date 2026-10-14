import { readFile } from 'node:fs/promises'
import { expect, test } from 'vitest'
import { eq, sql } from 'drizzle-orm'

test(
  'stale native participation cannot undo a guest departure',
  { skip: process.env.RUN_EVENT_LIFECYCLE_DB_TESTS !== '1' },
  async () => {
    expect(
      ['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env.DATABASE_URL!).hostname)
    ).toBeTruthy()
    const { db } = await import('@/db')
    const { user, organization, event, workspacePerson, eventParticipant, eventDeparture } =
      await import('@/db/schema')
    const { materializeNativeMutation } = await import('@/server/sync/native-materializer')
    const rollback = Symbol('departure-fixture-rollback')
    try {
      await db.transaction(async (transaction) => {
        const installed = await transaction.execute<{ name: string | null }>(
          sql`select to_regclass('public.event_departure')::text as name`
        )
        if (!installed.rows[0].name) {
          const migration = await readFile(
            new URL('../../drizzle/20261013161335_new_human_torch/migration.sql', import.meta.url),
            'utf8'
          )
          for (const statement of migration
            .split('--> statement-breakpoint')
            .filter((value) => value.trim()))
            await transaction.execute(sql.raw(statement))
        }
        const suffix = crypto.randomUUID(),
          userId = `departure-${suffix}`,
          organizationId = `departure-org-${suffix}`
        const scopeID = crypto.randomUUID(),
          personId = crypto.randomUUID(),
          participationId = crypto.randomUUID()
        await transaction.insert(user).values({
          id: userId,
          name: 'Guest fixture',
          email: `${userId}@example.com`,
          emailVerified: true,
        })
        await transaction.insert(organization).values({
          id: organizationId,
          name: 'Departure fixture',
          slug: organizationId,
          createdAt: new Date(),
        })
        await transaction.insert(event).values({
          id: scopeID,
          organizationId,
          title: 'Departure fixture',
          status: 'draft',
          startsAt: new Date(),
          timeZone: 'America/Detroit',
        })
        await transaction
          .insert(workspacePerson)
          .values({ id: personId, organizationId, userId, displayName: 'Guest fixture' })
        await transaction.insert(eventDeparture).values({ eventId: scopeID, userId })
        const mutation = {
          id: crypto.randomUUID(),
          scopeID,
          entityType: 'event_participation' as const,
          entityID: participationId,
          operation: 'update' as const,
          payloadSchemaVersion: 1 as const,
          createdAt: new Date().toISOString(),
          attemptCount: 0,
          payload: Buffer.from(
            JSON.stringify({
              id: participationId,
              eventID: scopeID,
              memberID: personId,
              role: 'guest',
              planningPermission: 'viewOnly',
              attendance: 'going',
            })
          ).toString('base64'),
        }
        await materializeNativeMutation(transaction, { userId, organizationId, mutation })
        expect(
          (
            await transaction
              .select()
              .from(eventParticipant)
              .where(eq(eventParticipant.eventId, scopeID))
          ).length
        ).toBe(0)
        // A fresh validated invitation clears the marker before materialization.
        await transaction.delete(eventDeparture).where(eq(eventDeparture.eventId, scopeID))
        await materializeNativeMutation(transaction, { userId, organizationId, mutation })
        expect(
          (
            await transaction
              .select()
              .from(eventParticipant)
              .where(eq(eventParticipant.eventId, scopeID))
          ).length
        ).toBe(1)
        throw rollback
      })
      throw new Error('Fixture transaction must roll back')
    } catch (error) {
      if (error !== rollback) throw error
    }
  }
)
