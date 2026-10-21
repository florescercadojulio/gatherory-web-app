import { readFile } from 'node:fs/promises'
import { expect, it } from '@effect/vitest'
import { Effect } from 'effect'
import { Client } from 'pg'

it.live(
  'public-link migration preserves tokens without reviving expired or revoked invitations',
  () =>
    Effect.tryPromise(async () => {
      const url = new URL(process.env.DATABASE_URL!)
      expect(['localhost', '127.0.0.1', '[::1]']).toContain(url.hostname)
      const client = new Client({ connectionString: url.toString() })
      await client.connect()
      try {
        await client.query('BEGIN')
        // A temporary table shadows the real table. Exercise the checked-in SQL
        // without altering the target database's schema or application records.
        await client.query(`
          CREATE TEMP TABLE event_share_link (
            event_id uuid PRIMARY KEY,
            token uuid NOT NULL UNIQUE,
            role text NOT NULL,
            expires_at timestamptz NOT NULL,
            revoked_at timestamptz
          ) ON COMMIT DROP;
          INSERT INTO event_share_link VALUES
            ('00000000-0000-4000-8000-000000000001',
             '10000000-0000-4000-8000-000000000001', 'guest', now() + interval '1 day', NULL),
            ('00000000-0000-4000-8000-000000000002',
             '10000000-0000-4000-8000-000000000002', 'guest', now() - interval '1 day', NULL),
            ('00000000-0000-4000-8000-000000000003',
             '10000000-0000-4000-8000-000000000003', 'guest', now() + interval '1 day', now());
        `)
        const migration = await readFile(
          new URL('../../drizzle/20261021144822_happy_glorian/migration.sql', import.meta.url),
          'utf8'
        )
        await client.query(migration)
        const { rows } = await client.query(
          'SELECT token, expires_at, revoked_at FROM pg_temp.event_share_link ORDER BY event_id'
        )
        expect(rows.map((row) => row.token)).toEqual([
          '10000000-0000-4000-8000-000000000001',
          '10000000-0000-4000-8000-000000000002',
          '10000000-0000-4000-8000-000000000003',
        ])
        expect(rows[0].expires_at).toBeNull()
        expect(rows[1].expires_at).toBeInstanceOf(Date)
        expect(rows[1].expires_at.getTime()).toBeLessThan(Date.now())
        expect(rows[2].expires_at).toBeInstanceOf(Date)
        expect(rows[2].revoked_at).toBeInstanceOf(Date)
        await client.query(`
          INSERT INTO pg_temp.event_share_link VALUES
            ('00000000-0000-4000-8000-000000000001',
             '20000000-0000-4000-8000-000000000001', 'collaborator', NULL, NULL)
        `)
        const count = await client.query(
          'SELECT count(*)::int AS count FROM pg_temp.event_share_link'
        )
        expect(count.rows[0].count).toBe(4)
      } finally {
        await client.query('ROLLBACK')
        await client.end()
      }
    }),
  { skip: process.env.RUN_INVITATION_DB_TESTS !== '1' }
)
