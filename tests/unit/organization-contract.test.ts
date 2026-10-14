import { expect, test } from 'vitest'

import { organizationType } from '@/db/schema/auth.schema'
import {
  defaultOrganizationType,
  organizationTypes,
  prepareOrganizationForCreation,
} from '@/lib/organization-contract'

test('the Better Auth default is accepted by the PostgreSQL enum', () => {
  expect(defaultOrganizationType).toBe('event')
  expect(organizationType.enumValues).toEqual(organizationTypes)
  expect(organizationType.enumValues.includes(defaultOrganizationType)).toBeTruthy()
  expect(organizationType.enumValues.includes('personal')).toBeTruthy()
})

test('organization creation replaces a legacy personal type', () => {
  const organization = prepareOrganizationForCreation({
    id: 'organization-id',
    name: "Julio Flores's Workspace",
    slug: '  Personal-ABC123  ',
    workspaceType: 'personal',
  })

  expect(organization.workspaceType).toBe('event')
  expect(organization.slug).toBe('personal-abc123')
  expect(organization.id).toBe('organization-id')
  expect(organization.name).toBe("Julio Flores's Workspace")
})
