import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { expect, test } from 'vitest'

const root = process.cwd()
const domains = ['events', 'media', 'moderation', 'workspaces', 'sync', 'auth', 'email']

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? sourceFiles(path) : /\.tsx?$/.test(entry.name) ? [path] : []
  })
}

const files = domains.flatMap((domain) => sourceFiles(join(root, 'src/server', domain)))

// Match import declarations, including multiline imports, without following
// type-only dependencies into server implementations.
function runtimeImports(source: string) {
  return [...source.matchAll(/^import\s+(?!type\b)([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/gm)]
    .filter((match) => !/^\{\s*(?:type\s+\w+\s*,?\s*)+\}$/.test(match[1].trim()))
    .map((match) => ({ bindings: match[1], path: match[2] }))
}

test('use-case handlers keep SQL and provider implementations behind injected services', () => {
  const handlers = files.filter((file) => /(?:\.handlers?|[.-]api)\.ts$/.test(file))
  expect(handlers.length).toBeGreaterThan(0)
  for (const file of handlers) {
    const name = relative(root, file)
    const source = readFileSync(file, 'utf8')
    for (const dependency of runtimeImports(source)) {
      expect(dependency.path, name).not.toMatch(
        /drizzle-orm|@aws-sdk|^pg$|\/db\/schema|\/lib\/auth$|\/env$/
      )
      if (dependency.path === '@/db') {
        expect(dependency.bindings, name).not.toMatch(/\b(?:db|DB|pool)\b/)
      }
    }
    expect(source, name).not.toMatch(
      /\bauth\.api\.|\b(?:db|transaction)\.(?:select|insert|update|delete)\(/
    )
  }
})

test('use-case workflows stay Effect programs with substitutable dependencies', () => {
  const workflows = files.filter((file) => /\.workflow\.tsx?$/.test(file))
  expect(workflows.length).toBeGreaterThan(0)
  for (const file of workflows) {
    const name = relative(root, file)
    const source = readFileSync(file, 'utf8')
    expect(source, name).not.toMatch(/Effect\.(?:run\w+|tryPromise|promise)\s*\(/)
    expect(source, name).not.toMatch(/\btryServerOperation\s*\(/)
    for (const dependency of runtimeImports(source)) {
      expect(dependency.path, name).not.toMatch(
        /\.live(?:\.ts)?$|\.persistence(?:\.ts)?$|drizzle-orm|@aws-sdk|\/lib\/auth$|\/env$/
      )
    }
  }
})

test('repository implementations do not sign media or import external provider connectors', () => {
  const repositories = files.filter(
    (file) => file.includes('/repos/') && /(?:\.live|\.persistence|\.drizzle)\.ts$/.test(file)
  )
  for (const file of repositories) {
    const name = relative(root, file)
    const source = readFileSync(file, 'utf8')
    for (const dependency of runtimeImports(source)) {
      expect(dependency.path, name).not.toMatch(/@aws-sdk|\/connectors\/|\/lib\/auth$/)
    }
    expect(source, name).not.toMatch(/import\(['"][^'"]*\/connectors\//)
    expect(source, name).not.toMatch(/\b(?:createMediaReadUrl|createMediaUploadUrl)\s*\(/)
  }
})

test('retained legacy entry points are thin compatibility exports', () => {
  const facades = [
    'auth/account-deletion.ts',
    'auth/account-deletion-payload.ts',
    'auth/apple-profile.ts',
    'auth/apple-tokens.ts',
    'email/auth-email.tsx',
    'events/invitation-api.ts',
    'events/invitation-consumption-api.ts',
    'events/repos/guest-invitation.repo.ts',
    'moderation/moderation.api.ts',
    'moderation/moderation.repo.ts',
    'moderation/media-visibility.ts',
    'sync/idea-response.ts',
    'sync/native-identity-access.ts',
    'sync/native-sync-auth.ts',
    'sync/native-sync-ordering.ts',
    'sync/native-tombstones.ts',
    'workspaces/create-event-workspace.ts',
  ]
  for (const facade of facades) {
    const source = readFileSync(join(root, 'src/server', facade), 'utf8')
    expect(source, facade).not.toMatch(
      /^(?:import\b|(?:export\s+)?(?:async\s+)?(?:function|const|let|class)\b)/m
    )
    expect(source, facade).toMatch(/^export\s/m)
  }
})

test('domain service implementations depend on ports rather than infrastructure', () => {
  const services = files.filter((file) => file.endsWith('.service.live.ts'))
  expect(services.length).toBeGreaterThan(0)
  for (const file of services) {
    const name = relative(root, file)
    const source = readFileSync(file, 'utf8')
    expect(source, name).not.toMatch(/Effect\.(?:run\w+|tryPromise|promise)\s*\(/)
    for (const dependency of runtimeImports(source)) {
      expect(dependency.path, name).not.toMatch(
        /^@\/db(?:\/|$)|\/env$|\/lib\/auth$|drizzle-orm|@aws-sdk|\.persistence(?:\.ts)?$|\.live(?:\.ts)?$/
      )
    }
  }
})

test('production workflow bindings compose layers without creating a database runtime', () => {
  const bindings = files.filter((file) => file.endsWith('.workflows.live.ts'))
  expect(bindings.length).toBeGreaterThan(0)
  for (const file of bindings) {
    const name = relative(root, file)
    const source = readFileSync(file, 'utf8')
    expect(source, name).toMatch(/Effect\.provide\(/)
    expect(source, name).not.toMatch(/PgClientLive|Effect\.(?:run\w+|tryPromise|promise)\s*\(/)
    for (const dependency of runtimeImports(source)) {
      expect(dependency.path, name).not.toMatch(/^@\/db$|\.persistence$|drizzle-orm|@aws-sdk/)
    }
  }
})

test('use-case handlers consume composed workflows instead of wiring domain implementations', () => {
  const handlers = files.filter((file) => /(?:\.handlers?|[.-]api)\.ts$/.test(file))
  for (const file of handlers) {
    const name = relative(root, file)
    const source = readFileSync(file, 'utf8')
    expect(source, name).not.toMatch(/Layer\.(?:provide|merge)|provide(?:Event|Media)Layers/)
    for (const dependency of runtimeImports(source)) {
      // Identity lookup is a Promise transport adapter, not domain layer wiring.
      if (dependency.path === '@/server/auth/connectors/session-user.con.live') continue
      expect(dependency.path, name).not.toMatch(
        /\/(?:repos|services|connectors)\/.*\.live$|\.layers(?:\.live)?$|\.workflow$/
      )
    }
  }
})
