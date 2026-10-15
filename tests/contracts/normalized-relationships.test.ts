import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { expect, test } from 'vitest'

import { eventParticipant, workspacePerson } from '@/db/schema/event.schema'

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(?:ts|tsx)$/.test(entry) ? [path] : []
  })
}

test('event participants resolve accounts through workspace people', () => {
  expect('personId' in eventParticipant).toBeTruthy()
  expect('userId' in eventParticipant).toBe(false)
  expect('userId' in workspacePerson).toBeTruthy()
  expect('organizationId' in workspacePerson).toBeTruthy()
})

test('application queries do not use removed participant-account columns', () => {
  const sourceRoot = join(process.cwd(), 'src')
  const violations = sourceFiles(sourceRoot).flatMap((path) => {
    const source = readFileSync(path, 'utf8')
    const reasons = [
      /eventParticipant\s*\.\s*userId/.test(source) ? 'eventParticipant.userId' : null,
      usesRemovedParticipantAccountColumn(source) ? 'event_participant.user_id' : null,
    ].filter((reason): reason is string => reason !== null)

    return reasons.map((reason) => `${relative(process.cwd(), path)}: ${reason}`)
  })

  expect(violations).toEqual([])
})

function usesRemovedParticipantAccountColumn(source: string) {
  const aliases = [
    ...source.matchAll(/\b(?:from|join)\s+event_participant\s+(?:as\s+)?([a-z_]\w*)/gi),
  ]
    .map((match) => match[1]!)
    .filter(
      (alias) =>
        !['where', 'join', 'on', 'left', 'inner', 'order', 'for'].includes(alias.toLowerCase())
    )
  return (
    ['event_participant', ...aliases].some((alias) =>
      new RegExp(`\\b${alias}\\s*\\.\\s*user_id\\b`, 'i').test(source)
    ) ||
    /\bselect\s+user_id\s+from\s+event_participant\b/i.test(source) ||
    /\bfrom\s+event_participant\s+where\s+user_id\b/i.test(source)
  )
}

test('relationship check distinguishes person account joins from removed participant fields', () => {
  expect(
    usesRemovedParticipantAccountColumn(
      'FROM event e JOIN event_participant ep ON ep.event_id = e.id JOIN workspace_person p ON p.id = ep.person_id WHERE p.user_id = actor'
    )
  ).toBe(false)
  expect(
    usesRemovedParticipantAccountColumn('FROM event_participant ep WHERE ep.user_id = actor')
  ).toBe(true)
  expect(
    usesRemovedParticipantAccountColumn(
      'FROM event_participant WHERE event_participant.user_id = actor'
    )
  ).toBe(true)
  expect(usesRemovedParticipantAccountColumn('SELECT user_id FROM event_participant')).toBe(true)
  expect(usesRemovedParticipantAccountColumn('FROM event_participant WHERE user_id = actor')).toBe(
    true
  )
})
