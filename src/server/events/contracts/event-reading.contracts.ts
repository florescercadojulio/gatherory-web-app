import { z } from 'zod'

export const EventReadingInputSchema = z
  .object({
    eventId: z.uuid().transform((id) => id.toLowerCase()),
  })
  .strict()

export const EVENT_READING_LIMIT = 50

export type EventReadingData = {
  event: {
    id: string
    title: string
    description: string | null
    startsAt: string | null
    endsAt: string | null
    timeZone: string
    isAllDay: boolean
    locationName: string | null
    version: number
  }
  attendance: {
    value: 'pending' | 'going' | 'not_sure' | 'not_going'
    canRespond: boolean
  }
  people: Array<{
    id: string
    name: string
    role: 'host' | 'collaborator' | 'guest'
    attendance: EventReadingData['attendance']['value']
  }>
  schedule: Array<{
    id: string
    title: string
    startsAt: string | null
    timeZone: string
    purpose: 'planning_scouting' | 'part_of_event' | null
    locationName: string | null
  }>
  tasks: Array<{ id: string; title: string; isCompleted: boolean; version: number }>
  notes: Array<{ id: string; text: string; createdAt: string; authorName: string | null }>
  permissions: {
    canRespond: boolean
    canCompleteTasks: boolean
    canCreateNotes: boolean
    canEditDetails: boolean
    canReadTasks: boolean
    canReadNotes: boolean
    canReadPeople: boolean
    canReadSchedule: boolean
  }
  isReadOnly: boolean
  truncated: { people: boolean; schedule: boolean; tasks: boolean; notes: boolean }
}
