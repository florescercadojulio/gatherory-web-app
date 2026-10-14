import assert from 'node:assert/strict'
import { test } from 'vitest'
import { and, eq } from 'drizzle-orm'

test(
  "workspace saves preserve the editor's role, RSVP, organization access and canonical participation ID",
  {
    skip: process.env.RUN_INVITATION_DB_TESTS !== '1',
  },
  async () => {
    assert.ok(
      ['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env.DATABASE_URL!).hostname)
    )
    const { db } = await import('@/db')
    const { user, member, event, workspacePerson, eventParticipant } = await import('@/db/schema')
    const { materializeNativeMutation } = await import('@/server/sync/native-materializer')
    const rollback = Symbol('identity-fixture-rollback')
    try {
      await db.transaction(async (transaction) => {
        const scopeID = crypto.randomUUID(),
          hostId = `host-${scopeID}`,
          editorId = `editor-${scopeID}`
        const personId = crypto.randomUUID(),
          participationId = crypto.randomUUID(),
          editorPersonId = crypto.randomUUID()
        await transaction
          .insert(user)
          .values(
            [hostId, editorId].map((id) => ({
              id,
              name: id,
              email: `${id}@example.com`,
              emailVerified: true,
            }))
          )
        const payload = {
          mainEventID: scopeID.toUpperCase(),
          title: 'Identity fixture',
          mainEventStartsAt: 820000000,
          defaultCollaboratorPermission: 'contribute',
          mainEventResponse: 'going',
          members: [
            { id: personId.toUpperCase(), userID: hostId, name: 'Host', participantRole: 'host' },
          ],
          eventParticipations: [
            {
              id: participationId.toUpperCase(),
              eventID: scopeID.toUpperCase(),
              memberID: personId.toUpperCase(),
              attendance: 'going',
            },
          ],
        }
        const mutation = {
          id: crypto.randomUUID(),
          scopeID,
          entityType: 'workspace' as const,
          entityID: scopeID,
          operation: 'update' as const,
          payloadSchemaVersion: 1 as const,
          createdAt: new Date().toISOString(),
          attemptCount: 0,
          payload: Buffer.from(JSON.stringify(payload)).toString('base64'),
        }
        await materializeNativeMutation(transaction, { userId: hostId, mutation })
        assert.equal(
          (
            await transaction
              .select()
              .from(eventParticipant)
              .where(eq(eventParticipant.personId, personId))
          )[0].id,
          participationId,
          'Uppercase Foundation UUIDs must not trigger the person-ID fallback'
        )
        await transaction
          .insert(workspacePerson)
          .values({
            id: editorPersonId,
            organizationId: scopeID,
            userId: editorId,
            displayName: 'Editor',
          })
        await transaction
          .insert(eventParticipant)
          .values({
            eventId: scopeID,
            personId: editorPersonId,
            role: 'collaborator',
            planningPermission: 'manage',
            attendanceStatus: 'not_sure',
          })
        await transaction
          .update(eventParticipant)
          .set({ attendanceStatus: 'not_going' })
          .where(eq(eventParticipant.personId, personId))
        await materializeNativeMutation(transaction, { userId: editorId, mutation })
        await materializeNativeMutation(transaction, { userId: hostId, mutation })
        const [editor] = await transaction
          .select()
          .from(eventParticipant)
          .where(eq(eventParticipant.personId, editorPersonId))
        assert.equal(editor.role, 'collaborator')
        assert.equal(editor.attendanceStatus, 'not_sure')
        assert.equal(
          (
            await transaction
              .select()
              .from(member)
              .where(and(eq(member.organizationId, scopeID), eq(member.userId, editorId)))
          ).length,
          0
        )
        assert.equal(
          (
            await transaction.select().from(workspacePerson).where(eq(workspacePerson.id, personId))
          )[0].userId,
          hostId
        )
        assert.equal(
          (
            await transaction
              .select()
              .from(eventParticipant)
              .where(eq(eventParticipant.personId, personId))
          )[0].attendanceStatus,
          'not_going'
        )
        assert.equal(
          (await transaction.select().from(event).where(eq(event.id, scopeID)))[0].createdByUserId,
          hostId
        )
        // Repair the old person-ID fallback when the canonical entity next materializes.
        await transaction
          .update(eventParticipant)
          .set({ id: personId })
          .where(eq(eventParticipant.personId, personId))
        await materializeNativeMutation(transaction, {
          userId: hostId,
          organizationId: scopeID,
          mutation: {
            ...mutation,
            entityType: 'event_participation',
            entityID: participationId,
            payload: Buffer.from(
              JSON.stringify({
                ...payload.eventParticipations[0],
                role: 'host',
                planningPermission: 'manage',
                attendance: 'declined',
              })
            ).toString('base64'),
          },
        })
        assert.equal(
          (
            await transaction
              .select()
              .from(eventParticipant)
              .where(eq(eventParticipant.personId, personId))
          )[0].id,
          participationId
        )
        await transaction
          .update(eventParticipant)
          .set({ planningPermission: 'contribute' })
          .where(eq(eventParticipant.personId, editorPersonId))
        await assert.rejects(
          materializeNativeMutation(transaction, {
            userId: editorId,
            mutation: {
              ...mutation,
              payload: Buffer.from(
                JSON.stringify({ ...payload, requiresCollaboratorApproval: false })
              ).toString('base64'),
            },
          }),
          (error) =>
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'EVENT_PERMISSION_REQUIRED'
        )
        throw rollback
      })
    } catch (error) {
      if (error !== rollback) throw error
    }
  }
)
