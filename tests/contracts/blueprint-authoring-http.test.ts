import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import {
  BlueprintCreateDraftSchema,
  BlueprintDraftContentSchema,
  BlueprintDraftIdSchema,
  BlueprintPreviewDraftSchema,
  BlueprintPublishDraftSchema,
  BlueprintSaveDraftSchema,
  BlueprintStarterInputSchema,
} from '@/contracts/blueprint-authoring.contracts'
import { cottageDraftContent } from '@/db/seeds/cottage-template'

const handlerPath = fileURLToPath(
  new URL('../../src/server/blueprints/handlers/blueprint-authoring.functions.ts', import.meta.url)
)
const handlerSource = readFileSync(handlerPath, 'utf8')

describe('private blueprint authoring HTTP boundary', () => {
  test('authoring inputs accept portable content and reject authority fields', () => {
    expect(BlueprintDraftContentSchema.parse(cottageDraftContent)).toEqual(cottageDraftContent)
    expect(
      BlueprintCreateDraftSchema.safeParse({
        requestId: crypto.randomUUID(),
        organizationId: 'owner-workspace',
        content: cottageDraftContent,
        ownerId: 'attacker',
        visibility: 'public',
      }).success
    ).toBe(false)
  })

  test('revision, draft, and version inputs are strictly validated', () => {
    expect(
      BlueprintStarterInputSchema.safeParse({ catalogKey: 'wedding', revision: 1 }).success
    ).toBe(true)
    expect(
      BlueprintStarterInputSchema.safeParse({ catalogKey: 'wedding', revision: 0 }).success
    ).toBe(false)
    expect(
      BlueprintDraftIdSchema.safeParse({ id: crypto.randomUUID(), organizationId: 'forged' })
        .success
    ).toBe(false)
    expect(
      BlueprintPreviewDraftSchema.safeParse({ id: crypto.randomUUID(), expectedVersion: 1 }).success
    ).toBe(true)
    expect(
      BlueprintPublishDraftSchema.safeParse({ id: crypto.randomUUID(), expectedVersion: 1 }).success
    ).toBe(true)
    expect(
      BlueprintSaveDraftSchema.safeParse({
        id: crypto.randomUUID(),
        expectedVersion: 1,
        content: cottageDraftContent,
      }).success
    ).toBe(true)
  })

  test('every authoring server function requires a session and disables shared caching', () => {
    const exports = [
      'getBlueprintAuthoringContext',
      'listBlueprintTemplates',
      'getBlueprintDraft',
      'getBlueprintStarter',
      'createBlueprintDraft',
      'saveBlueprintDraft',
      'publishBlueprintDraft',
      'retireBlueprintTemplate',
      'deleteBlueprintDraft',
      'previewBlueprintDraft',
      'createBlueprintAuthoringWorkspace',
    ]
    for (const name of exports) {
      const start = handlerSource.indexOf(`export const ${name} = createServerFn`)
      expect(start, `${name} must be exported as a server function`).toBeGreaterThanOrEqual(0)
      const nextExport = handlerSource.indexOf('\nexport const ', start + 1)
      const declaration = handlerSource.slice(start, nextExport === -1 ? undefined : nextExport)
      expect(declaration).toContain('.middleware([requireSessionMiddleware])')
      expect(declaration).toContain("setResponseHeader('Cache-Control', 'private, no-store')")
      expect(declaration).toContain(
        name === 'createBlueprintAuthoringWorkspace' ? 'context.user' : 'context.user.id'
      )
    }
  })
})
