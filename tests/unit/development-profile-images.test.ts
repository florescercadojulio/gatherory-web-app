import { describe, expect, test } from 'vitest'
import {
  assertLocalDevelopmentProfileTarget,
  developmentGuestProfiles,
  developmentProfileImage,
  developmentProfileImages,
  fillDevelopmentPortrait,
} from '@/db/seeds/development-profile-images'
import { createReviewWorkspaceArchive } from '@/db/review-workspace-fixture'
import { reviewWorkspaceOrganizationNames } from '@/db/review-workspace-fixture'
import { developmentUsers } from '../../scripts/seed/development-users'

describe('development sample portraits', () => {
  test('allows only the current and exact legacy review workspace labels', () => {
    expect(Object.values(reviewWorkspaceOrganizationNames)).toEqual([
      "Alex & Jordan's Gatherory",
      "Alex & Jordan's Wedding",
    ])
    expect(Object.values(reviewWorkspaceOrganizationNames)).not.toContain(
      "Alex & Jordan's Wedding Reception"
    )
  })

  test('rejects remote, production, wrong-protocol and nonfixture database targets', () => {
    expect(() =>
      assertLocalDevelopmentProfileTarget('postgresql://localhost:5438/gatherory')
    ).not.toThrow()
    for (const url of [
      'postgresql://example.com/gatherory',
      'postgresql://localhost/production',
      'https://localhost/gatherory',
    ]) {
      expect(() => assertLocalDevelopmentProfileTarget(url)).toThrow()
    }
    expect(() =>
      assertLocalDevelopmentProfileTarget('postgresql://localhost/gatherory', 'production')
    ).toThrow()
  })

  test('fills only exact linked fixture identities while retaining custom portraits', () => {
    const image = developmentProfileImage('planner@gatherory.test')!
    const profiles = new Map([
      ['alex', { id: 'stable-alex', email: 'planner@gatherory.test', name: 'Alex Morgan', image }],
    ])
    const noGuests = new Map()
    const person = {
      id: 'stable-alex',
      userID: 'alex',
      name: 'Alex Morgan',
      email: 'planner@gatherory.test',
      profileImageURL: null as string | null,
    }
    expect(fillDevelopmentPortrait(person, profiles, noGuests)).toBe(true)
    expect(person.profileImageURL).toBe(image)
    expect(fillDevelopmentPortrait(person, profiles, noGuests)).toBe(false)
    expect(
      fillDevelopmentPortrait(
        { ...person, email: 'other@example.com', profileImageURL: null },
        profiles,
        noGuests
      )
    ).toBe(false)
    expect(
      fillDevelopmentPortrait(
        { ...person, userID: 'other', profileImageURL: null },
        profiles,
        noGuests
      )
    ).toBe(false)
    expect(
      fillDevelopmentPortrait(
        { ...person, id: 'different-person', profileImageURL: null },
        profiles,
        noGuests
      )
    ).toBe(false)
    expect(
      fillDevelopmentPortrait(
        { ...person, profileImageURL: 'https://example.com/custom.jpg' },
        profiles,
        noGuests
      )
    ).toBe(false)
    expect(developmentProfileImage('customer@example.com')).toBeNull()
  })

  test('gives every seeded person a distinct portrait while retaining guest and RSVP access', () => {
    const accounts = developmentUsers.map((account, index) => ({
      ...account,
      id: `fixture-${index}`,
    }))
    const archive = createReviewWorkspaceArchive({
      users: [accounts[0], accounts[1], accounts[2], accounts[3], accounts[4]],
      receptionPlanner: accounts[5],
    })
    const contacts = archive.members.filter((person) => !person.userID)

    expect(developmentProfileImages).toHaveLength(8)
    expect(developmentGuestProfiles).toHaveLength(3)
    expect(
      new Set([...developmentProfileImages, ...developmentGuestProfiles].map((p) => p.image)).size
    ).toBe(11)
    expect(contacts.map((person) => [person.name, person.attendance])).toEqual([
      ['Invited Family', 'invited'],
      ['Jamie Park', 'going'],
      ['Drew Ellis', 'declined'],
    ])
    for (const contact of contacts) {
      expect(contact.profileImageURL).toBe(developmentProfileImage(contact.email))
      expect(contact.participantRole).toBe('guest')
      expect(contact.planningPermission).toBe('viewOnly')
      expect(contact.userID).toBeNull()
    }
    expect(
      archive.eventParticipations
        .filter((participation) =>
          contacts.some((contact) => contact.id === participation.memberID)
        )
        .map((participation) => [participation.eventID, participation.attendance])
    ).toHaveLength(9)
  })

  test('incrementally fills a contact portrait by stable ID, email, and name, once only', () => {
    const guest = developmentGuestProfiles[0]
    const guestProfiles = new Map([[guest.id, guest]])
    const accountProfiles = new Map()
    const contact = {
      id: guest.id,
      userID: null,
      name: guest.name,
      email: guest.email,
      profileImageURL: null as string | null,
    }

    expect(fillDevelopmentPortrait(contact, accountProfiles, guestProfiles)).toBe(true)
    expect(contact.profileImageURL).toBe(guest.image)
    expect(fillDevelopmentPortrait(contact, accountProfiles, guestProfiles)).toBe(false)
    const unlinkedPayload = {
      id: guest.id,
      name: guest.name,
      email: guest.email,
      profileImageURL: null,
    }
    expect(fillDevelopmentPortrait(unlinkedPayload, accountProfiles, guestProfiles)).toBe(true)
    expect(unlinkedPayload.profileImageURL).toBe(guest.image)
    expect(
      fillDevelopmentPortrait(
        { ...contact, profileImageURL: null, id: developmentGuestProfiles[1].id },
        accountProfiles,
        guestProfiles
      )
    ).toBe(false)
    expect(
      fillDevelopmentPortrait(
        { ...contact, profileImageURL: null, name: 'Somebody else' },
        accountProfiles,
        guestProfiles
      )
    ).toBe(false)
    expect(
      fillDevelopmentPortrait(
        { ...contact, profileImageURL: null, userID: 'different-account' },
        accountProfiles,
        guestProfiles
      )
    ).toBe(false)
    expect(
      fillDevelopmentPortrait(
        { ...contact, profileImageURL: null, userID: false },
        accountProfiles,
        guestProfiles
      )
    ).toBe(false)
  })

  test('keeps fresh native account portraits aligned with the development catalog', () => {
    const accounts = developmentUsers.map((account, index) => ({
      ...account,
      id: `fixture-${index}`,
    }))
    const archive = createReviewWorkspaceArchive({
      users: [accounts[0], accounts[1], accounts[2], accounts[3], accounts[4]],
      receptionPlanner: accounts[5],
    })
    expect(developmentProfileImages).toHaveLength(developmentUsers.length)
    for (const person of archive.members.filter((member) => member.userID)) {
      expect(person.profileImageURL).toBe(developmentProfileImage(person.email))
    }
    expect(
      archive.members
        .filter((member) => !member.userID)
        .every((member) => member.profileImageURL === developmentProfileImage(member.email))
    ).toBe(true)
  })
})
