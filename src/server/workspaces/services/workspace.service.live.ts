import { Effect, Layer } from 'effect'
import { BetterAuthWorkspaceCon } from '../connectors/better-auth.con'
import { WorkspaceRepo } from '../repos/workspace.repo'
import { WorkspaceService, type WorkspaceServiceShape } from './workspace.service'

function personalSlug(userId: string) {
  return `personal-${userId.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`
}

export const WorkspaceServiceLive = Layer.effect(
  WorkspaceService,
  Effect.gen(function* () {
    const repo = yield* WorkspaceRepo
    const auth = yield* BetterAuthWorkspaceCon

    const ensurePlanningTeam = (headers: Headers, organizationId: string, userId: string) =>
      Effect.gen(function* () {
        const teams = yield* auth.listTeams(headers, organizationId)
        const currentTeam = teams.find((item) => item.name === 'Planning')
        const team = currentTeam ?? (yield* auth.createTeam(headers, organizationId))
        if (!(yield* repo.hasTeamMembership(team.id, userId))) {
          yield* auth.addTeamMember(headers, organizationId, team.id, userId)
        }
        yield* auth.setActiveTeam(headers, team.id)
        return team
      })

    const createEventWorkspace = (input: { headers: Headers; name: string; slug: string }) =>
      Effect.gen(function* () {
        const workspace = yield* auth.createOrganization(input)
        yield* repo.normalizeOrganizationType(workspace.id)
        return { ...workspace, workspaceType: 'event' }
      })

    const listAccessible = (input: {
      userId: string
      memberWorkspaces: Parameters<typeof repo.listAccessible>[0]['memberWorkspaces']
    }) => repo.listAccessible(input)

    return {
      listAccessible,

      provisionPersonal: (input) =>
        Effect.gen(function* () {
          let members = yield* auth.listOrganizations(input.headers)
          let workspace =
            members.find((candidate) => candidate.id === input.activeOrganizationId) ??
            members.find((candidate) => candidate.workspaceType === 'event') ??
            members[0]
          if (!workspace) {
            const slug = personalSlug(input.userId)
            workspace = yield* createEventWorkspace({
              headers: input.headers,
              name: `${input.userName}'s Workspace`,
              slug,
            }).pipe(
              Effect.catch((failure) =>
                Effect.gen(function* () {
                  members = yield* auth.listOrganizations(input.headers)
                  const recovered = members.find((candidate) => candidate.slug === slug)
                  if (recovered) return recovered
                  return yield* Effect.fail(failure)
                })
              )
            )
          }
          if (workspace.id !== input.activeOrganizationId)
            yield* auth.setActiveOrganization(input.headers, workspace.id)
          const planningTeam = yield* ensurePlanningTeam(input.headers, workspace.id, input.userId)
          yield* repo.ensurePlanningSettings(workspace.id)
          members = yield* auth.listOrganizations(input.headers)
          return { workspace, planningTeam, memberWorkspaces: members }
        }),

      create: (input) =>
        Effect.gen(function* () {
          const reusable = yield* repo.findReusableActiveWorkspace({
            organizationId: input.activeOrganizationId,
            userId: input.userId,
          })
          let workspace = reusable
          let disposableWorkspaceId: string | undefined
          let previousName: { id: string; name: string } | undefined
          if (workspace) {
            previousName = { id: workspace.id, name: workspace.name }
            yield* repo.rename({ organizationId: workspace.id, name: input.data.eventName })
            workspace = { ...workspace, name: input.data.eventName }
          } else {
            const slug = yield* repo.findAvailableSlug(input.data.eventName)
            workspace = yield* createEventWorkspace({
              headers: input.headers,
              name: input.data.eventName,
              slug,
            })
            disposableWorkspaceId = workspace.id
          }
          const target = workspace
          const operation = Effect.gen(function* () {
            yield* auth.setActiveOrganization(input.headers, target.id)
            yield* ensurePlanningTeam(input.headers, target.id, input.userId)
            yield* repo.createMainEvent({
              organizationId: target.id,
              userId: input.userId,
              userName: input.userName,
              email: input.email,
              image: input.image ?? null,
              data: input.data,
            })
            return { slug: target.slug }
          })
          return yield* operation.pipe(
            Effect.catch((failure) =>
              Effect.gen(function* () {
                yield* repo
                  .rollbackWorkspaceCreation({ disposableWorkspaceId, previousName })
                  .pipe(Effect.ignore)
                if (disposableWorkspaceId)
                  yield* auth
                    .setActiveOrganization(input.headers, input.activeOrganizationId ?? null)
                    .pipe(Effect.ignore)
                return yield* Effect.fail(failure)
              })
            )
          )
        }),

      resolve: (input) =>
        Effect.gen(function* () {
          const memberWorkspaces = yield* auth.listOrganizations(input.headers)
          const workspaces = yield* listAccessible({ userId: input.userId, memberWorkspaces })
          const workspace = workspaces.find((candidate) => candidate.slug === input.slug)
          if (!workspace) return null
          let planningTeam = null
          if (workspace.access === 'member') {
            if (workspace.id !== input.activeOrganizationId)
              yield* auth.setActiveOrganization(input.headers, workspace.id)
            planningTeam = yield* ensurePlanningTeam(input.headers, workspace.id, input.userId)
          }
          return { workspace, workspaces, planningTeam }
        }),
    } satisfies WorkspaceServiceShape
  })
)
