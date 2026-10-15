import { expect, test } from 'vitest'
import {
  BlueprintDraftContentSchema,
  draftDefinition,
} from '@/contracts/blueprint-authoring.contracts'
import { BlueprintCatalogDefinitionSchema } from '@/contracts/blueprint-install.contracts'
import { cottageDraftContent } from '@/db/seeds/cottage-template'

test('private content uses code-point limits and executable module validation', () => {
  const content = { ...cottageDraftContent, name: '🌿'.repeat(120) }
  expect(BlueprintDraftContentSchema.safeParse(content).success).toBe(true)
  expect(
    BlueprintDraftContentSchema.safeParse({ ...content, name: `${content.name}x` }).success
  ).toBe(false)
  expect(
    BlueprintDraftContentSchema.safeParse({ ...content, description: 'x'.repeat(2_001) }).success
  ).toBe(false)
  expect(
    BlueprintDraftContentSchema.safeParse({ ...content, ownerUserId: 'spoofed' }).success
  ).toBe(false)
})

test('a child cannot alias the installed main event or leave dependent content orphaned', () => {
  const content = structuredClone(cottageDraftContent)
  content.children[0]!.key = 'main'
  expect(BlueprintDraftContentSchema.safeParse(content).success).toBe(false)
  expect(
    BlueprintCatalogDefinitionSchema.safeParse(draftDefinition(content, 'private_test', 1)).success
  ).toBe(false)
  const missingTarget = structuredClone(cottageDraftContent)
  missingTarget.children = []
  expect(BlueprintDraftContentSchema.safeParse(missingTarget).success).toBe(false)
})
