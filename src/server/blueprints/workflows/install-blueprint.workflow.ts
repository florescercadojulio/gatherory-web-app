import { Effect } from 'effect'
import { ConflictError, EntityNotFoundError, InvalidInputError } from '@/lib/domain-errors'
import { BlueprintInstallInputSchema } from '@/contracts/blueprint-install.contracts'
import { BlueprintRepo, type BlueprintActor } from '../contracts/blueprint-runtime.contracts'
import { BetterAuthWorkspaceCon } from '@/server/workspaces/connectors/better-auth.con'
import { validateInput } from '@/server/validation'
import { expandBlueprintInstallation } from '../planning/plan-blueprint-installation'
import { blueprintHash } from '../planning/blueprint-hash'

export const previewBlueprintWorkflow = (input: unknown, actorId: string) =>
  Effect.gen(function* () {
    const request = yield* validateInput(BlueprintInstallInputSchema, input)
    const repo = yield* BlueprintRepo
    const revision = yield* repo.revision(request.catalogKey, request.revision, actorId)
    if (revision.contentHash !== request.contentHash)
      return yield* Effect.fail(
        new ConflictError({
          category: 'conflict',
          code: 'BLUEPRINT_REVISION_CHANGED',
          userMessageKey: 'serverErrors.CONFLICT',
        })
      )
    const { id: _id, ...published } = revision
    const plan = yield* Effect.try({
      try: () => expandBlueprintInstallation(request, published),
      catch: (cause) =>
        new InvalidInputError({
          category: 'validation',
          code: 'INVALID_BLUEPRINT_PLAN',
          userMessageKey: 'serverErrors.VALIDATION',
          cause,
        }),
    })
    return { plan, contentHash: revision.contentHash }
  })

export const installBlueprintWorkflow = (actor: BlueprintActor, input: unknown) =>
  Effect.gen(function* () {
    const request = yield* validateInput(BlueprintInstallInputSchema, input)
    const hash = blueprintHash({
      ...request,
      requestId: request.requestId.toLowerCase(),
      selectedIdeaKeys: [...request.selectedIdeaKeys].sort(),
      selectedChildren: [...request.selectedChildren].sort((a, b) => a.key.localeCompare(b.key)),
      capabilities: [...request.capabilities].sort(),
    })
    const repo = yield* BlueprintRepo
    const auth = yield* BetterAuthWorkspaceCon
    const previous = yield* repo.status(actor.id, request.requestId)
    const token = crypto.randomUUID()
    let receipt
    if (previous) {
      receipt = yield* repo.acquire(actor.id, request.requestId, hash, token)
    } else {
      const revision = yield* repo.revision(request.catalogKey, request.revision, actor.id)
      const { plan } = yield* previewBlueprintWorkflow(request, actor.id)
      receipt = yield* repo.claim({ actor, request, hash, plan, revision, token })
    }
    if (receipt.result) return receipt.result
    return yield* Effect.gen(function* () {
      let organizationId = yield* repo.recoverWorkspace(actor.id, receipt.id)
      if (!organizationId) {
        // Slug was persisted before the external call. A lost provider response
        // is recovered by slug + owner membership, never by provisioning again.
        const created = yield* auth
          .createOrganization({
            name: receipt.plan.main.name,
            slug: receipt.provisioningSlug,
            userId: actor.id,
          })
          .pipe(
            Effect.catch((cause) =>
              repo
                .recoverWorkspace(actor.id, receipt.id)
                .pipe(
                  Effect.flatMap((recovered) =>
                    recovered ? Effect.succeed({ id: recovered }) : Effect.fail(cause)
                  )
                )
            )
          )
        organizationId = created.id
      }
      yield* repo.provisioned(actor.id, receipt.id, token, organizationId)
      return yield* repo.complete(actor, receipt.id, token)
    }).pipe(Effect.onError(() => repo.release(actor.id, receipt.id, token).pipe(Effect.ignore)))
  })

export const blueprintStatusWorkflow = (actorId: string, requestId: string) =>
  Effect.gen(function* () {
    const repo = yield* BlueprintRepo
    const receipt = yield* repo.status(actorId, requestId)
    if (!receipt)
      return yield* Effect.fail(
        new EntityNotFoundError({
          category: 'not_found',
          code: 'BLUEPRINT_INSTALLATION_NOT_FOUND',
          userMessageKey: 'serverErrors.NOT_FOUND',
        })
      )
    return { state: receipt.state, result: receipt.result }
  })
