import { readFileSync, writeFileSync } from 'node:fs'
import { expect, test } from 'vitest'

const enabled = process.env.RUN_MCP_DEV_ACCEPTANCE === '1'

test(
  'exports the dev conference through the same native bootstrap used by iOS',
  { skip: !enabled },
  async () => {
    const databaseURL = new URL(process.env.DATABASE_URL ?? '')
    expect(['localhost', '127.0.0.1', '[::1]']).toContain(databaseURL.hostname)
    const rootId = process.env.MCP_DEV_ROOT_ID
    expect(rootId).toMatch(/^[0-9a-f-]{36}$/)
    const output = process.env.MCP_DEV_BOOTSTRAP_EXPORT
    expect(output?.startsWith('/tmp/')).toBe(true)
    const { db } = await import('@/db')
    const { user } = await import('@/db/schema/auth.schema')
    const { eq } = await import('drizzle-orm')
    const { listNativeWorkspaceSnapshots } =
      await import('@/server/sync/repos/native-sync-legacy.persistence')
    const [actor] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, 'appreview@gatherory.test'))
    expect(actor).toBeDefined()
    const response = await listNativeWorkspaceSnapshots({
      userId: actor!.id,
      supportsBlueprintGuides: true,
      supportsTodos: true,
    })
    const target = {
      ...response,
      snapshots: response.snapshots.filter((item) => item.scopeID === rootId),
      entities: response.entities.filter((item) => item.scopeID === rootId),
    }
    expect(target.snapshots).toHaveLength(1)
    expect(target.entities.some((item) => item.entityType === 'event')).toBe(true)
    expect(target.entities.some((item) => item.entityType === 'idea')).toBe(true)
    expect(target.entities.some((item) => item.entityType === 'note')).toBe(true)
    expect(target.entities.some((item) => item.entityType === 'todo')).toBe(true)
    if (process.env.MCP_DEV_SOURCE_PATH) {
      const source = readFileSync(process.env.MCP_DEV_SOURCE_PATH, 'utf8')
      const excerpts = target.entities
        .filter((item) => item.entityType === 'note')
        .map((item) => {
          const value = JSON.parse(Buffer.from(item.payload, 'base64').toString()) as {
            body: string
          }
          return {
            body: value.body,
            header: value.body.match(/^User-supplied source excerpt (\d+)\/40\n/),
          }
        })
        .filter((item) => item.header)
        .sort((a, b) => Number(a.header![1]) - Number(b.header![1]))
      expect(excerpts).toHaveLength(40)
      const reconstructed = excerpts
        .map((item) => item.body.replace(/^User-supplied source excerpt \d+\/40\n/, ''))
        .join('')
      const normalizeWhitespace = (text: string) => text.replace(/\s/gu, '')
      expect(normalizeWhitespace(reconstructed)).toBe(normalizeWhitespace(source))
    }
    writeFileSync(output!, JSON.stringify(target), { mode: 0o600 })
  }
)
