import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { BlueprintDraftContentSchema } from '@/contracts/blueprint-authoring.contracts'
import {
  BlueprintEventCaptureSourceSchema,
  type BlueprintCaptureMetadata,
  type BlueprintEventCaptureSource,
} from '@/contracts/blueprint-capture.contracts'
import {
  ConflictError,
  ForbiddenError,
  InvalidInputError,
  serverOperationError,
} from '@/lib/domain-errors'
import { BlueprintCaptureRepo } from './blueprint-capture.repo'
import { BlueprintAuthoringRepo } from './blueprint-authoring.repo'
import { blueprintHash, legacyCompatibleCaptureSelection } from '../planning/blueprint-hash'
import {
  captureEventBlueprint,
  mergeCapturedBlueprint,
} from '../planning/capture-event-blueprint.server'

const forbidden = () =>
  new ForbiddenError({
    category: 'authorization',
    code: 'BLUEPRINT_CAPTURE_FORBIDDEN',
    userMessageKey: 'serverErrors.AUTHORIZATION',
  })
const conflict = (code: string) =>
  new ConflictError({ category: 'conflict', code, userMessageKey: 'serverErrors.CONFLICT' })
const invalid = (cause?: unknown) =>
  new InvalidInputError({
    category: 'validation',
    code: 'INVALID_BLUEPRINT_CAPTURE',
    userMessageKey: 'serverErrors.VALIDATION',
    cause,
  })

export const BlueprintCaptureRepoLive = Layer.effect(
  BlueprintCaptureRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const authoring = yield* BlueprintAuthoringRepo
    const bind = <A, E>(program: Effect.Effect<A, E, PgClient>) =>
      program.pipe(
        Effect.provideService(PgClient, pg),
        Effect.mapError((cause) =>
          serverOperationError(cause, {
            category: 'system',
            code: 'BLUEPRINT_CAPTURE_FAILED',
            userMessageKey: 'serverErrors.SYSTEM',
          })
        )
      )
    const destination = (actorId: string, organizationId: string) =>
      Effect.gen(function* () {
        const access =
          yield* pg`SELECT id FROM member WHERE user_id = ${actorId} AND organization_id = ${organizationId} AND role = 'owner' FOR SHARE`
        if (!access.length) return yield* Effect.fail(forbidden())
      })
    const source = (actorId: string, eventId: string) =>
      Effect.gen(function* () {
        // Check explicit event participation, including personal departure. A child
        // grant cannot resolve its parent or siblings through this query.
        const roots = yield* pg<BlueprintEventCaptureSource['event'] & { organizationId: string }>`
      SELECT e.id, e.organization_id AS "organizationId", e.title,
        to_char(e.starts_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "startsAt",
        e.time_zone AS "timeZone",
        CASE WHEN c.experience_type IN ('wedding','birthday','holiday') THEN c.experience_type ELSE 'custom' END AS "experienceType"
      FROM event e JOIN event_participant ep ON ep.event_id = e.id
      JOIN workspace_person p ON p.id = ep.person_id AND p.organization_id = e.organization_id
      LEFT JOIN event_experience_configuration c ON c.event_id = e.id AND c.organization_id = e.organization_id
      WHERE e.id = ${eventId} AND p.user_id = ${actorId}
        AND (ep.role = 'host' OR (ep.role = 'collaborator' AND ep.planning_permission = 'manage'))
        AND NOT EXISTS (SELECT 1 FROM event_departure d WHERE d.event_id = e.id AND d.user_id = ${actorId})
      FOR SHARE OF e, ep, p`
        const root = roots[0]
        if (!root) return yield* Effect.fail(forbidden())
        const children = yield* pg<BlueprintEventCaptureSource['children'][number]>`
      SELECT e.id, e.title, e.purpose, e.category,
        to_char(e.starts_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "startsAt"
      FROM event e JOIN event_participant ep ON ep.event_id = e.id
      JOIN workspace_person p ON p.id = ep.person_id AND p.organization_id = e.organization_id
      WHERE e.parent_event_id = ${eventId} AND e.organization_id = ${root.organizationId} AND p.user_id = ${actorId}
        AND (ep.role = 'host' OR (ep.role = 'collaborator' AND ep.planning_permission = 'manage'))
        AND NOT EXISTS (SELECT 1 FROM event_departure d WHERE d.event_id = e.id AND d.user_id = ${actorId})
      ORDER BY e.created_at, e.id FOR SHARE OF e, ep, p`
        const eventIds = `{${[eventId, ...children.map((child) => child.id)].join(',')}}`
        const ideas = yield* pg<BlueprintEventCaptureSource['ideas'][number]>`
      SELECT i.id, i.event_id AS "eventId", i.title, i.category, i.note AS notes FROM idea i
      WHERE i.organization_id = ${root.organizationId} AND i.event_id = ANY(${eventIds}::uuid[])
        AND i.category <> 'music' AND i.title IS NOT NULL AND length(trim(i.title)) > 0
        AND i.status <> 'archived'
      ORDER BY i.created_at, i.id FOR SHARE`
        const instructions = yield* pg<BlueprintEventCaptureSource['instructions'][number]>`
      SELECT g.id, g.event_id AS "eventId", g.title, g.body, g.visibility AS audience FROM event_guide_section g
      WHERE g.organization_id = ${root.organizationId} AND g.event_id = ANY(${eventIds}::uuid[])
      ORDER BY g.sort_order, g.id FOR SHARE`
        const todos = yield* pg<BlueprintEventCaptureSource['todos'][number]>`
      SELECT t.id, t.event_id AS "eventId", t.title, t.website_url AS "websiteURL"
      FROM event_todo t
      WHERE t.organization_id = ${root.organizationId} AND t.event_id = ANY(${eventIds}::uuid[])
      ORDER BY t.created_at, t.id FOR SHARE`
        const { organizationId: _, ...event } = root
        const captured = yield* Effect.try({
          try: () =>
            BlueprintEventCaptureSourceSchema.parse({
              event,
              children,
              ideas,
              instructions,
              todos,
            }),
          catch: invalid,
        })
        return { source: captured, sourceHash: blueprintHash(captured) }
      })
    return {
      listEvents: (actorId) =>
        bind(
          Effect.gen(function* () {
            const events = yield* pg<{ id: string; title: string }>`
        SELECT e.id, e.title FROM event e JOIN event_participant ep ON ep.event_id = e.id
        JOIN workspace_person p ON p.id = ep.person_id AND p.organization_id = e.organization_id
        WHERE p.user_id = ${actorId}
          AND (ep.role = 'host' OR (ep.role = 'collaborator' AND ep.planning_permission = 'manage'))
          AND NOT EXISTS (SELECT 1 FROM event_departure d WHERE d.event_id = e.id AND d.user_id = ${actorId})
        ORDER BY e.created_at DESC, e.id LIMIT 100`
            return { events: [...events] }
          })
        ),
      source: (actorId, eventId) => bind(pg.withTransaction(source(actorId, eventId))),
      save: (actorId, input) =>
        bind(
          pg.withTransaction(
            Effect.gen(function* () {
              yield* destination(actorId, input.organizationId)
              const requestHash = blueprintHash({
                ...input,
                requestId: input.requestId.toLowerCase(),
                selection: legacyCompatibleCaptureSelection(input.selection),
              })
              const current = input.templateId
                ? yield* authoring.get(actorId, input.templateId)
                : undefined
              if (current) {
                if (
                  current.organizationId !== input.organizationId ||
                  !current.source ||
                  !('eventId' in current.source) ||
                  current.source.eventId !== input.eventId
                )
                  return yield* Effect.fail(forbidden())
                if (current.source.requestId === input.requestId) {
                  if (current.source.requestHash !== requestHash)
                    return yield* Effect.fail(conflict('BLUEPRINT_CAPTURE_REQUEST_CONFLICT'))
                  return current
                }
                if (current.retired || current.draftVersion !== input.expectedVersion)
                  return yield* Effect.fail(conflict('BLUEPRINT_DRAFT_VERSION_CONFLICT'))
              }
              // Serialize/replay creation before rereading a potentially changed event.
              // The same reviewed request can recover after a lost response.
              if (!input.templateId) {
                yield* pg`SELECT pg_advisory_xact_lock(hashtextextended(${`blueprint-create:${actorId}:${input.requestId.toLowerCase()}`}, 0))`
                const existing = yield* pg<{
                  id: string
                  hash: string
                }>`SELECT id, create_request_hash AS hash FROM blueprint_template WHERE created_by_user_id = ${actorId} AND create_request_id = ${input.requestId}`
                if (existing[0]) {
                  if (existing[0].hash !== requestHash)
                    return yield* Effect.fail(conflict('BLUEPRINT_CREATE_REQUEST_CONFLICT'))
                  return yield* authoring.get(actorId, existing[0].id)
                }
              }
              const captured = yield* source(actorId, input.eventId)
              if (captured.sourceHash !== input.expectedSourceHash)
                return yield* Effect.fail(conflict('BLUEPRINT_CAPTURE_SOURCE_CHANGED'))
              const capturedContent = yield* Effect.try({
                try: () => captureEventBlueprint(captured.source, input.selection, input.name),
                catch: invalid,
              })
              const metadata: BlueprintCaptureMetadata = {
                kind: 'event',
                eventId: input.eventId,
                selection: input.selection,
                capturedContent,
                requestId: input.requestId,
                requestHash,
                ...(current?.source &&
                'eventId' in current.source &&
                current.source.nativeCreationRequestHash
                  ? { nativeCreationRequestHash: current.source.nativeCreationRequestHash }
                  : {}),
              }
              if (current && input.templateId && current.source && 'eventId' in current.source) {
                const baseline = current.source.capturedContent
                const merged = yield* Effect.try({
                  try: () =>
                    BlueprintDraftContentSchema.parse(
                      mergeCapturedBlueprint(baseline, capturedContent, current.content).content
                    ),
                  catch: invalid,
                })
                yield* pg`UPDATE blueprint_template SET content = ${JSON.stringify(merged)}::jsonb, source = ${JSON.stringify(metadata)}::jsonb,
          draft_version = draft_version + 1, updated_at = now() WHERE id = ${input.templateId}`
                return yield* authoring.get(actorId, input.templateId)
              }
              const id = crypto.randomUUID()
              const catalogKey = `private_${id.replaceAll('-', '')}`
              yield* pg`INSERT INTO blueprint_template (id, catalog_key, organization_id, created_by_user_id, create_request_id, create_request_hash, content, source)
        VALUES (${id}, ${catalogKey}, ${input.organizationId}, ${actorId}, ${input.requestId}, ${requestHash}, ${JSON.stringify(capturedContent)}::jsonb, ${JSON.stringify(metadata)}::jsonb)`
              return yield* authoring.get(actorId, id)
            })
          )
        ),
    }
  })
)
