import { eq, inArray } from 'drizzle-orm'
import { expect, test } from 'vitest'

const enabled = process.env.RUN_MCP_DB_TESTS === '1'

test(
  'deleting an account cascades its OAuth clients, grants, and tokens without affecting another account',
  { skip: !enabled, timeout: 30_000 },
  async () => {
    const databaseURL = process.env.DATABASE_URL
    if (!databaseURL) throw new Error('DATABASE_URL is required for MCP OAuth database tests')
    if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(databaseURL).hostname)) {
      throw new Error('MCP OAuth database tests only run against localhost')
    }

    const [{ db }, authSchema, oauthSchema] = await Promise.all([
      import('@/db'),
      import('@/db/schema/auth.schema'),
      import('@/db/schema/mcp-oauth.schema'),
    ])
    const suffix = crypto.randomUUID()
    const userIds = [`mcp-oauth-owned-${suffix}`, `mcp-oauth-other-${suffix}`]
    const clientIds = [`mcp-oauth-client-owned-${suffix}`, `mcp-oauth-client-other-${suffix}`]
    const now = new Date()

    try {
      await db
        .insert(authSchema.user)
        .values(
          userIds.map((id) => ({ id, name: id, email: `${id}@example.test`, emailVerified: true }))
        )
      await db.insert(oauthSchema.oauthClient).values(
        clientIds.map((clientId, index) => ({
          id: clientId,
          clientId,
          userId: userIds[index],
          redirectUris: [],
        }))
      )
      await db.insert(oauthSchema.oauthConsent).values(
        clientIds.map((clientId, index) => ({
          id: `consent-${clientId}`,
          clientId,
          userId: userIds[index],
          scopes: ['gatherory:read'],
          createdAt: now,
          updatedAt: now,
        }))
      )
      await db.insert(oauthSchema.oauthRefreshToken).values(
        clientIds.map((clientId, index) => ({
          id: `refresh-${clientId}`,
          token: `refresh-token-${clientId}`,
          clientId,
          userId: userIds[index],
          scopes: ['gatherory:read'],
          expiresAt: new Date(now.getTime() + 60_000),
          createdAt: now,
        }))
      )
      await db.insert(oauthSchema.oauthAccessToken).values(
        clientIds.map((clientId, index) => ({
          id: `access-${clientId}`,
          token: `access-token-${clientId}`,
          clientId,
          userId: userIds[index],
          refreshId: `refresh-${clientId}`,
          scopes: ['gatherory:read'],
          expiresAt: new Date(now.getTime() + 60_000),
          createdAt: now,
        }))
      )

      await db.delete(authSchema.user).where(eq(authSchema.user.id, userIds[0]))

      expect(
        await db
          .select({ id: oauthSchema.oauthClient.id })
          .from(oauthSchema.oauthClient)
          .where(inArray(oauthSchema.oauthClient.clientId, clientIds))
      ).toEqual([{ id: clientIds[1] }])
      expect(
        await db
          .select({ id: oauthSchema.oauthConsent.id })
          .from(oauthSchema.oauthConsent)
          .where(inArray(oauthSchema.oauthConsent.clientId, clientIds))
      ).toEqual([{ id: `consent-${clientIds[1]}` }])
      expect(
        await db
          .select({ id: oauthSchema.oauthRefreshToken.id })
          .from(oauthSchema.oauthRefreshToken)
          .where(inArray(oauthSchema.oauthRefreshToken.clientId, clientIds))
      ).toEqual([{ id: `refresh-${clientIds[1]}` }])
      expect(
        await db
          .select({ id: oauthSchema.oauthAccessToken.id })
          .from(oauthSchema.oauthAccessToken)
          .where(inArray(oauthSchema.oauthAccessToken.clientId, clientIds))
      ).toEqual([{ id: `access-${clientIds[1]}` }])
      expect(
        await db
          .select({ id: authSchema.user.id })
          .from(authSchema.user)
          .where(eq(authSchema.user.id, userIds[1]))
      ).toEqual([{ id: userIds[1] }])
    } finally {
      await db.delete(authSchema.user).where(inArray(authSchema.user.id, userIds))
    }
  }
)
