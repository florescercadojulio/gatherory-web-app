import { readFile, mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { z } from "zod"

import {
  ContributionVisibilitySchema,
  ExperienceBlueprintSchema,
  ServicePackageSchema,
} from "../src/contracts/experience.contracts"

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const checkOnly = process.argv.includes("--check")

const contracts = [
  {
    file: "experience-blueprint.v1.schema.json",
    id: "https://schemas.gatherory.com/experience-blueprint/v1.json",
    title: "Gatherory Experience Blueprint v1",
    schema: ExperienceBlueprintSchema,
  },
  {
    file: "contribution-visibility.v1.schema.json",
    id: "https://schemas.gatherory.com/contribution-visibility/v1.json",
    title: "Gatherory Contribution Visibility v1",
    schema: ContributionVisibilitySchema,
  },
  {
    file: "service-package.v1.schema.json",
    id: "https://schemas.gatherory.com/service-package/v1.json",
    title: "Gatherory Service Package v1",
    schema: ServicePackageSchema,
  },
]

let mismatch = false

for (const contract of contracts) {
  const generated = z.toJSONSchema(contract.schema)
  const document = {
    ...generated,
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: contract.id,
    title: contract.title,
  }
  const contents = `${JSON.stringify(document, null, 2)}\n`
  const target = resolve(repositoryRoot, "contracts/schemas", contract.file)

  if (checkOnly) {
    const current = await readFile(target, "utf8").catch(() => "")
    if (current !== contents) {
      mismatch = true
      console.error(`${contract.file} is not current. Run pnpm contracts:generate.`)
    }
    continue
  }

  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, contents)
  console.log(`Generated ${contract.file}`)
}

if (mismatch) process.exitCode = 1
