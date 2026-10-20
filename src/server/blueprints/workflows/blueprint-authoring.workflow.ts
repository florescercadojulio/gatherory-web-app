import { Effect } from 'effect'
import {
  BlueprintAuthoringPageInputSchema,
  BlueprintCreateDraftSchema,
  BlueprintDraftIdSchema,
  BlueprintPublishDraftSchema,
  BlueprintSaveDraftSchema,
  BlueprintPreviewDraftSchema,
  BlueprintDraftContentSchema,
  draftDefinition,
  BlueprintStarterInputSchema,
} from '@/contracts/blueprint-authoring.contracts'
import {
  BlueprintExperienceTreeModuleSchema,
  BlueprintIdeasModuleSchema,
  BlueprintInstructionsModuleSchema,
  BlueprintTodosModuleSchema,
} from '@/contracts/blueprint-install.contracts'
import { ConflictError, InvalidInputError } from '@/lib/domain-errors'
import { validateInput } from '@/server/validation'
import { BlueprintAuthoringRepo } from '../repos/blueprint-authoring.repo'
import { BlueprintRepo } from '../contracts/blueprint-runtime.contracts'
import { BetterAuthWorkspaceCon } from '@/server/workspaces/connectors/better-auth.con'
import { blueprintHash } from '../planning/blueprint-hash'
import {
  BLUEPRINT_SERVER_CAPABILITIES,
  expandBlueprintInstallation,
} from '../planning/plan-blueprint-installation'

export const getBlueprintAuthoringContextWorkflow = (actorId: string) =>
  Effect.gen(function* () {
    return yield* (yield* BlueprintAuthoringRepo).context(actorId)
  })
export const listBlueprintTemplatesWorkflow = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    return yield* (yield* BlueprintAuthoringRepo).list(
      actorId,
      yield* validateInput(BlueprintAuthoringPageInputSchema, input)
    )
  })
export const getBlueprintDraftWorkflow = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    return yield* (yield* BlueprintAuthoringRepo).get(
      actorId,
      (yield* validateInput(BlueprintDraftIdSchema, input)).id
    )
  })
export const getBlueprintStarterWorkflow = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    const request = yield* validateInput(BlueprintStarterInputSchema, input)
    const revision = yield* (yield* BlueprintRepo).revision(
      request.catalogKey,
      request.revision,
      actorId
    )
    const document = revision.definition
    const tree = document.modules
      .map((module) => BlueprintExperienceTreeModuleSchema.safeParse(module))
      .find((item) => item.success)
    const ideas = document.modules
      .map((module) => BlueprintIdeasModuleSchema.safeParse(module))
      .find((item) => item.success)
    const instructions = document.modules
      .map((module) => BlueprintInstructionsModuleSchema.safeParse(module))
      .find((item) => item.success)
    const todos = document.modules
      .map((module) => BlueprintTodosModuleSchema.safeParse(module))
      .find((item) => item.success)
    return yield* validateInput(BlueprintDraftContentSchema, {
      name: document.blueprint.name,
      description: revision.description ?? '',
      experienceType: document.experienceDefaults.type,
      children: tree?.data?.config.children ?? [],
      ideas: ideas?.data?.config.ideas ?? [],
      instructions: instructions?.data?.config.sections ?? [],
      todos: todos?.data?.config.todos ?? [],
    })
  })
export const createBlueprintDraftWorkflow = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    const request = yield* validateInput(BlueprintCreateDraftSchema, input)
    // Attribution is checked against a real accessible revision, never trusted client metadata.
    if (request.source)
      yield* (yield* BlueprintRepo).revision(
        request.source.catalogKey,
        request.source.revision,
        actorId
      )
    return yield* (yield* BlueprintAuthoringRepo).create(actorId, request)
  })
export const saveBlueprintDraftWorkflow = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    return yield* (yield* BlueprintAuthoringRepo).save(
      actorId,
      yield* validateInput(BlueprintSaveDraftSchema, input)
    )
  })
export const publishBlueprintDraftWorkflow = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    return yield* (yield* BlueprintAuthoringRepo).publish(
      actorId,
      yield* validateInput(BlueprintPublishDraftSchema, input)
    )
  })
export const retireBlueprintTemplateWorkflow = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    return yield* (yield* BlueprintAuthoringRepo).retire(
      actorId,
      (yield* validateInput(BlueprintDraftIdSchema, input)).id
    )
  })
export const deleteBlueprintDraftWorkflow = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    return yield* (yield* BlueprintAuthoringRepo).delete(
      actorId,
      (yield* validateInput(BlueprintDraftIdSchema, input)).id
    )
  })

/** Illustrative dates only. Preview uses the actual installer but makes no writes. */
export const previewBlueprintDraftWorkflow = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    const request = yield* validateInput(BlueprintPreviewDraftSchema, input)
    const draft = yield* (yield* BlueprintAuthoringRepo).get(actorId, request.id)
    if (request.expectedVersion !== draft.draftVersion)
      return yield* Effect.fail(
        new ConflictError({
          category: 'conflict',
          code: 'BLUEPRINT_DRAFT_VERSION_CONFLICT',
          userMessageKey: 'serverErrors.CONFLICT',
        })
      )
    const definition = draftDefinition(
      draft.content,
      draft.catalogKey,
      (draft.publishedRevision ?? 0) + 1
    )
    const contentHash = blueprintHash(definition)
    const plan = yield* Effect.try({
      try: () =>
        expandBlueprintInstallation(
          {
            requestId: '00000000-0000-4000-8000-000000000001',
            catalogKey: draft.catalogKey,
            revision: definition.blueprint.revision,
            contentHash,
            mainEvent: {
              name: draft.content.name,
              startsAt: '2030-06-01T12:00:00Z',
              timeZone: 'Etc/UTC',
            },
            selectedChildren: draft.content.children.map((child) => ({
              key: child.key,
              startsAt: '2030-06-01T12:00:00Z',
            })),
            selectedIdeaKeys: draft.content.ideas.map((idea) => idea.key),
            capabilities: [...BLUEPRINT_SERVER_CAPABILITIES],
          },
          {
            catalogKey: draft.catalogKey,
            revision: definition.blueprint.revision,
            contentHash,
            definition,
          }
        ),
      catch: (cause) =>
        new InvalidInputError({
          category: 'validation',
          code: 'INVALID_BLUEPRINT_PLAN',
          userMessageKey: 'serverErrors.VALIDATION',
          cause,
        }),
    })
    return { plan, contentHash, previewOnly: true as const }
  })

/** Explicit, recoverable owner-workspace creation. Never called by a read and never switches sessions. */
export const createBlueprintAuthoringWorkspaceWorkflow = (actor: { id: string; name: string }) =>
  Effect.gen(function* () {
    const repo = yield* BlueprintAuthoringRepo
    const existing = yield* repo.context(actor.id)
    if (existing.workspaces.length) return existing
    const auth = yield* BetterAuthWorkspaceCon
    yield* auth
      .createOrganization({
        userId: actor.id,
        name: `${actor.name}'s Workspace`,
        slug: `personal-${actor.id.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`,
      })
      .pipe(
        Effect.catch((cause) =>
          repo
            .context(actor.id)
            .pipe(
              Effect.flatMap((context) =>
                context.workspaces.length ? Effect.void : Effect.fail(cause)
              )
            )
        )
      )
    return yield* repo.context(actor.id)
  })
