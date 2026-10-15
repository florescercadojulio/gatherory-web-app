import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { buildCottageInstallationFixtures } from '../helpers/cottage-installation-fixtures'

describe('two-copy cottage installation fixtures', () => {
  test('matches the portable contract example and stays deterministic', () => {
    const fixtures = buildCottageInstallationFixtures()
    const example = JSON.parse(
      readFileSync('contracts/examples/cottage-installations.v1.json', 'utf8')
    )

    expect(fixtures).toEqual(example)
    expect(buildCottageInstallationFixtures()).toEqual(fixtures)
  })

  test('pins both copies to one revision while giving each independent IDs and content', () => {
    const { catalogKey, revision, contentHash, installations } = buildCottageInstallationFixtures()
    const [first, second] = installations
    expect(first).toBeDefined()
    expect(second).toBeDefined()
    expect([first.input.catalogKey, second.input.catalogKey]).toEqual([catalogKey, catalogKey])
    expect([first.input.revision, second.input.revision]).toEqual([revision, revision])
    expect([first.input.contentHash, second.input.contentHash]).toEqual([contentHash, contentHash])
    expect(new Set(installations.map(({ requestID }) => requestID)).size).toBe(2)
    expect(new Set(installations.map(({ organizationID }) => organizationID)).size).toBe(2)

    const firstIDs = [
      ...Object.values(first.manifest.events),
      ...Object.values(first.manifest.ideas),
      ...Object.values(first.manifest.guides),
      first.manifest.personID,
      ...Object.values(first.manifest.participations),
    ]
    const secondIDs = [
      ...Object.values(second.manifest.events),
      ...Object.values(second.manifest.ideas),
      ...Object.values(second.manifest.guides),
      second.manifest.personID,
      ...Object.values(second.manifest.participations),
    ]
    expect(new Set([...firstIDs, ...secondIDs]).size).toBe(firstIDs.length + secondIDs.length)
    expect(first.archive.mainEventID).not.toBe(second.archive.mainEventID)
    expect(first.archive.title).not.toBe(second.archive.title)

    first.archive.ideas[0]!.title = 'Edited only in copy one'
    expect(second.archive.ideas[0]!.title).not.toBe('Edited only in copy one')
  })
})
