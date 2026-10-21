import { z } from 'zod'

export const NotificationInstallationInputSchema = z.object({
  installationId: z.uuid(),
  installationSecret: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  revision: z.number().int().positive().max(2_147_483_647),
  token: z.string().min(1).max(4096),
  platform: z.enum(['ios', 'android']),
  locale: z.enum(['en', 'es']).default('en'),
  enabled: z.boolean(),
})

export const NotificationInstallationDetachSchema = z.object({
  installationId: z.uuid(),
  installationSecret: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  revision: z.number().int().positive().max(2_147_483_647),
})

export type NotificationInstallationInput = z.infer<typeof NotificationInstallationInputSchema>
export type NotificationIdentity = { kind: 'user' | 'device_guest'; id: string }
export type NotificationType = 'assignment_changed' | 'event_changed' | 'event_announcement'
export type NativeNotificationPayload = {
  type: NotificationType
  eventId: string
  entityId: string
  recipientKind: NotificationIdentity['kind']
  recipientId: string
  title: 'Gatherory'
  body:
    | 'A task was assigned to you.'
    | 'Se te asignó una tarea.'
    | 'Event details changed.'
    | 'Se actualizaron los detalles del evento.'
    | 'There’s a new event update.'
    | 'Hay una nueva actualización del evento.'
}

export type EnqueueNativeNotificationInput = {
  eventId: string
  entityId: string
  recipient: NotificationIdentity
  mutationId: string
  notificationType: NotificationType
  sourceRevision?: string
}

export type ClaimedNotification = {
  id: string
  eventId: string
  entityId: string
  recipient: NotificationIdentity
  type: NotificationType
  leaseKey: string
  acceptedInstallationIds: string[]
  installations: Array<{
    id: string
    generation: number
    revision: number
    tokenHash: string
    locale: 'en' | 'es'
    token: string
  }>
}
