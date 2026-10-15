import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'
import { MoneySchema } from '../src/contracts/content-primitives'
import { BlueprintCatalogResponseSchema } from '../src/contracts/blueprint-discovery.contracts'
import {
  BlueprintDraftContentSchema,
  BlueprintCreateDraftSchema,
  BlueprintSaveDraftSchema,
  BlueprintPublishDraftSchema,
} from '../src/contracts/blueprint-authoring.contracts'
import {
  BlueprintScheduleInputSchema,
  BlueprintScheduleResponseSchema,
} from '../src/contracts/blueprint-schedule.contracts'
import {
  BlueprintCatalogDefinitionSchema,
  BlueprintInstallInputSchema,
  BlueprintExpandedPlanSchema,
} from '../src/contracts/blueprint-install.contracts'

import {
  ContributionVisibilitySchema,
  ExperienceBlueprintSchema,
  ServicePackageSchema,
} from '../src/contracts/experience.contracts'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const checkOnly = process.argv.includes('--check')

const contracts = [
  {
    file: 'blueprint-draft.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-draft/v1.json',
    title: 'Gatherory Private Blueprint Draft Content v1',
    schema: BlueprintDraftContentSchema,
  },
  {
    file: 'blueprint-create-draft.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-create-draft/v1.json',
    title: 'Gatherory Private Blueprint Create Draft v1',
    schema: BlueprintCreateDraftSchema,
  },
  {
    file: 'blueprint-save-draft.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-save-draft/v1.json',
    title: 'Gatherory Private Blueprint Save Draft v1',
    schema: BlueprintSaveDraftSchema,
  },
  {
    file: 'blueprint-publish.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-publish/v1.json',
    title: 'Gatherory Private Blueprint Publish v1',
    schema: BlueprintPublishDraftSchema,
  },
  {
    file: 'blueprint-schedule-input.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-schedule-input/v1.json',
    title: 'Gatherory Blueprint Schedule Request v1',
    schema: BlueprintScheduleInputSchema,
  },
  {
    file: 'blueprint-schedule.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-schedule/v1.json',
    title: 'Gatherory Blueprint Schedule Suggestions v1',
    schema: BlueprintScheduleResponseSchema,
  },
  {
    file: 'money.v1.schema.json',
    id: 'https://schemas.gatherory.com/money/v1.json',
    title: 'Gatherory Money v1 (Integer Minor Units)',
    schema: MoneySchema,
  },
  {
    file: 'blueprint-catalog.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-catalog/v1.json',
    title: 'Gatherory Blueprint Discovery Catalog v1',
    schema: BlueprintCatalogResponseSchema,
  },
  {
    file: 'blueprint-starter.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-starter/v1.json',
    title: 'Gatherory Executable Starter v1',
    schema: BlueprintCatalogDefinitionSchema,
  },
  {
    file: 'blueprint-install.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-install/v1.json',
    title: 'Gatherory Blueprint Install v1',
    schema: BlueprintInstallInputSchema,
  },
  {
    file: 'blueprint-plan.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-plan/v1.json',
    title: 'Gatherory Blueprint Plan v1',
    schema: BlueprintExpandedPlanSchema,
  },
  {
    file: 'experience-blueprint.v1.schema.json',
    id: 'https://schemas.gatherory.com/experience-blueprint/v1.json',
    title: 'Gatherory Experience Blueprint v1',
    schema: ExperienceBlueprintSchema,
  },
  {
    file: 'contribution-visibility.v1.schema.json',
    id: 'https://schemas.gatherory.com/contribution-visibility/v1.json',
    title: 'Gatherory Contribution Visibility v1',
    schema: ContributionVisibilitySchema,
  },
  {
    file: 'service-package.v1.schema.json',
    id: 'https://schemas.gatherory.com/service-package/v1.json',
    title: 'Gatherory Service Package v1',
    schema: ServicePackageSchema,
  },
]

let mismatch = false

for (const contract of contracts) {
  const generated = z.toJSONSchema(contract.schema)
  const document = {
    ...generated,
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: contract.id,
    title: contract.title,
  }
  const contents = `${JSON.stringify(document, null, 2)}\n`
  const target = resolve(repositoryRoot, 'contracts/schemas', contract.file)

  if (checkOnly) {
    const current = await readFile(target, 'utf8').catch(() => '')
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
