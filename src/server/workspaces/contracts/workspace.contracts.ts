import { z } from 'zod'

export const CreateWorkspaceSchema = z
  .object({
    eventName: z.string().trim().min(2).max(120),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime().optional(),
    isAllDay: z.boolean().default(false),
    timeZone: z.string().trim().min(1).max(100),
    locationName: z.string().trim().max(160).optional(),
    locationAddress: z.string().trim().max(500).optional(),
    budgetCap: z
      .string()
      .trim()
      .regex(/^\d+(?:\.\d{1,2})?$/)
      .optional(),
  })
  .refine((value) => !value.endsAt || new Date(value.endsAt) >= new Date(value.startsAt), {
    message: 'The event end must be after its start.',
    path: ['endsAt'],
  })

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>

/** Trusted provisioning input for server scripts, not a client RPC contract. */
export type CreateEventWorkspaceInput = {
  name: string
  slug: string
  headers?: Headers
  userId?: string
}

export const ResolveWorkspaceSchema = z.object({
  slug: z.string().trim().min(1).max(160),
})

export type WorkspaceAccess = 'member' | 'participant'
export type WorkspaceSummary = {
  id: string
  name: string
  slug: string
  type: string
  access: WorkspaceAccess
}

export type AuthWorkspace = {
  id: string
  name: string
  slug: string
  workspaceType: string
}

export type PlanningTeam = { id: string; name: string }
export type WorkspaceUser = {
  id: string
  name: string
  email: string
  image?: string | null
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
  hasCompletedOnboarding: boolean
}
