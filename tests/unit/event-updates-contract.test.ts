import { describe, expect, it } from 'vitest'
import {
  CreateEventNoteInputSchema,
  UpdateEventDetailsInputSchema,
} from '@/server/events/contracts/event-updates.contracts'

const eventId = '753c2e6c-d6cc-495b-9649-df5ed968a98f'
const idempotencyKey = 'b529b57c-cdd8-4f11-adcf-dc7853da951c'

describe('event update input contracts', () => {
  it('measures note and event text limits in Unicode code points', () => {
    const emoji = '🪻'
    expect(
      CreateEventNoteInputSchema.safeParse({
        eventId,
        idempotencyKey,
        body: emoji.repeat(750),
      }).success
    ).toBe(true)
    expect(
      CreateEventNoteInputSchema.safeParse({
        eventId,
        idempotencyKey,
        body: emoji.repeat(751),
      }).success
    ).toBe(false)
    expect(
      UpdateEventDetailsInputSchema.safeParse({
        eventId,
        expectedVersion: 1,
        changes: { title: emoji.repeat(120) },
      }).success
    ).toBe(true)
  })

  it('requires a version and at least one explicitly scoped detail field', () => {
    expect(
      UpdateEventDetailsInputSchema.safeParse({
        eventId,
        changes: { title: 'Dinner' },
      }).success
    ).toBe(false)
    expect(
      UpdateEventDetailsInputSchema.safeParse({
        eventId,
        expectedVersion: 1,
        changes: {},
      }).success
    ).toBe(false)
    expect(
      UpdateEventDetailsInputSchema.safeParse({
        eventId,
        expectedVersion: 1,
        changes: { status: 'cancelled' },
      }).success
    ).toBe(false)
  })
})
