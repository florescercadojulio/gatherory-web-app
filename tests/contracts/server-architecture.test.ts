import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { expect, test } from 'vitest'

const root = process.cwd()
const domains = ['events', 'media', 'moderation', 'workspaces', 'sync', 'auth']

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
  const workflows = files.filter((file) => file.endsWith('.workflow.ts'))
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
