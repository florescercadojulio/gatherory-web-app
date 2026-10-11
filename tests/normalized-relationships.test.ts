import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { test } from "node:test"

import {
  eventParticipant,
  workspacePerson,
} from "../src/db/schema/event.schema"

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(?:ts|tsx)$/.test(entry) ? [path] : []
  })
}

test("event participants resolve accounts through workspace people", () => {
  assert.ok("personId" in eventParticipant)
  assert.equal("userId" in eventParticipant, false)
  assert.ok("userId" in workspacePerson)
  assert.ok("organizationId" in workspacePerson)
})

test("application queries do not use removed participant-account columns", () => {
  const sourceRoot = join(process.cwd(), "src")
  const violations = sourceFiles(sourceRoot).flatMap((path) => {
    const source = readFileSync(path, "utf8")
    const reasons = [
      /eventParticipant\s*\.\s*userId/.test(source)
        ? "eventParticipant.userId"
        : null,
      /event_participant[\s\S]{0,160}\buser_id\b/i.test(source)
        ? "event_participant.user_id"
        : null,
    ].filter((reason): reason is string => reason !== null)

    return reasons.map(
      (reason) => `${relative(process.cwd(), path)}: ${reason}`,
    )
  })

  assert.deepEqual(violations, [])
})
