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
      /event_participant[\s\S]{0,160}\buser_id\b/i.test(source)
        ? 'event_participant.user_id'
        : null,
    ].filter((reason): reason is string => reason !== null)

    return reasons.map((reason) => `${relative(process.cwd(), path)}: ${reason}`)
  })

  expect(violations).toEqual([])
})
