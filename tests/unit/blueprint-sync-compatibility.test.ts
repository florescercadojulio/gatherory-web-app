import { Effect } from 'effect'
import { expect, test } from 'vitest'

import {
  BLUEPRINT_GUIDES_CAPABILITY,
  BLUEPRINT_UPGRADE_REQUIRED_CODE,
  TODOS_CAPABILITY,
  TODOS_UPGRADE_REQUIRED_CODE,
  blueprintUpgradeRequired,
  hasBlueprintGuidesCapability,
  hasTodosCapability,
  todoUpgradeRequired,
} from '@/server/sync/native-sync-compatibility'
import { buildScopedEventArchive } from '@/server/sync/services/scoped-event-projection'
import { runServerResponse } from '@/server/effect-utils'

const rootID = '00000000-0000-4000-8000-000000000001'
const childID = '00000000-0000-4000-8000-000000000002'
const siblingID = '00000000-0000-4000-8000-000000000003'

test('recognizes the blueprint guide capability in a comma-separated request header', () => {
  expect(
    hasBlueprintGuidesCapability(
      new Headers({ 'X-Gatherory-Capabilities': `other-v2, ${BLUEPRINT_GUIDES_CAPABILITY}` })
    )
  ).toBe(true)
  expect(hasBlueprintGuidesCapability(new Headers())).toBe(false)
  expect(
    hasBlueprintGuidesCapability(
      new Headers({ 'X-Gatherory-Capabilities': 'blueprint-guides-v10' })
    )
  ).toBe(false)
})

test('upgrade errors identify a recoverable client upgrade and affected scopes', () => {
  const error = blueprintUpgradeRequired([childID, childID])
  expect(error.code).toBe(BLUEPRINT_UPGRADE_REQUIRED_CODE)
  expect(error.httpStatus).toBe(426)
  expect(error.messageParams).toEqual({
    requiredCapabilities: BLUEPRINT_GUIDES_CAPABILITY,
    recoverable: 'true',
    scopeIDs: childID,
  })
})

test('upgrade errors remain structured at the native sync HTTP boundary', async () => {
  const response = await runServerResponse(Effect.fail(blueprintUpgradeRequired([childID])), {
    successEnvelope: false,
    legacyErrorCode: true,
  })
  const body = await response.json()
  expect(response.status).toBe(426)
  expect(body).toMatchObject({
    error: BLUEPRINT_UPGRADE_REQUIRED_CODE,
    messageParams: {
      requiredCapabilities: BLUEPRINT_GUIDES_CAPABILITY,
      recoverable: 'true',
      scopeIDs: childID,
    },
  })
})

test('recognizes the shared to-do capability without accepting partial names', () => {
  expect(TODOS_CAPABILITY).toBe('event-todos-v2')
  expect(
    hasTodosCapability(new Headers({ 'X-Gatherory-Capabilities': `other-v2, ${TODOS_CAPABILITY}` }))
  ).toBe(true)
  expect(hasTodosCapability(new Headers())).toBe(false)
  expect(hasTodosCapability(new Headers({ 'X-Gatherory-Capabilities': 'event-todos-v10' }))).toBe(
    false
  )
  expect(hasTodosCapability(new Headers({ 'X-Gatherory-Capabilities': 'event-todos-v1' }))).toBe(
    false
  )
})

test('to-do upgrade response remains a recoverable 426 with affected exact scopes', async () => {
  const error = todoUpgradeRequired([childID, childID, siblingID])
  expect(error.code).toBe(TODOS_UPGRADE_REQUIRED_CODE)
  expect(error.httpStatus).toBe(426)
  expect(error.messageParams).toEqual({
    requiredCapabilities: TODOS_CAPABILITY,
    recoverable: 'true',
    scopeIDs: `${childID},${siblingID}`,
  })

  const response = await runServerResponse(Effect.fail(todoUpgradeRequired([childID])), {
    successEnvelope: false,
    legacyErrorCode: true,
  })
  expect(response.status).toBe(426)
  expect(await response.json()).toMatchObject({
    error: TODOS_UPGRADE_REQUIRED_CODE,
    messageParams: {
      requiredCapabilities: TODOS_CAPABILITY,
      recoverable: 'true',
      scopeIDs: childID,
    },
  })
})

test('a child archive receives only that event’s canonical guides and configuration', () => {
  const rootArchive = {
    mainEventID: rootID,
    title: 'Root',
    timeline: [],
    guides: [{ id: 'forged', eventID: childID, title: 'Client value' }],
    experienceConfiguration: { experienceType: 'tampered', categoryOrder: ['other'] },
  }
  const payload = buildScopedEventArchive({
    snapshotPayload: Buffer.from(JSON.stringify(rootArchive)).toString('base64'),
    entities: [],
    eventId: childID,
    childEvent: { id: childID, parentEventID: rootID, title: 'Child', scheduledAt: 0 },
    guides: [
      {
        id: 'guide-root',
        eventID: rootID,
        key: 'root',
        title: 'Root guide',
        body: 'Root only',
        sortOrder: 0,
        visibility: 'planning_only',
      },
      {
        id: 'guide-child',
        eventID: childID,
        key: 'child',
        title: 'Child guide',
        body: 'Child only',
        sortOrder: 1,
        visibility: 'event_participants',
      },
      {
        id: 'guide-sibling',
        eventID: siblingID,
        key: 'sibling',
        title: 'Sibling guide',
        body: 'Sibling only',
        sortOrder: 2,
        visibility: 'event_participants',
      },
    ],
    experienceConfiguration: {
      eventID: rootID,
      experienceType: 'wedding',
      categoryOrder: ['ceremony', 'reception'],
    },
  })

  if (!payload) throw new Error('Expected a scoped event archive')
  const archive = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
  expect(archive.guides).toEqual([
    {
      id: 'guide-child',
      eventID: childID,
      key: 'child',
      title: 'Child guide',
      body: 'Child only',
      sortOrder: 1,
      visibility: 'event_participants',
    },
  ])
  expect(archive.experienceConfiguration).toEqual({
    experienceType: 'wedding',
    categoryOrder: ['ceremony', 'reception'],
  })
})
