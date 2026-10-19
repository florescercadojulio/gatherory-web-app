import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'
import { MoneySchema } from '../src/contracts/content-primitives'
import {
  BlueprintNativeCreationRequestSchema,
  BlueprintNativeCreationResponseSchema,
} from '../src/contracts/blueprint-native-creation.contracts'
import {
  BlueprintLinkManagementInputSchema,
  BlueprintLinkManagementResponseSchema,
} from '../src/contracts/blueprint-link-management.contracts'
import { BlueprintCatalogResponseSchema } from '../src/contracts/blueprint-discovery.contracts'
import { blueprintStarters } from '../src/server/blueprints/catalog/starters'
import { buildBlueprintCatalog } from '../src/server/blueprints/services/blueprint-discovery'
import {
  BlueprintShareCreateInputSchema,
  BlueprintShareRevokeInputSchema,
  BlueprintShareResolveInputSchema,
} from '../src/contracts/blueprint-sharing.contracts'
import {
  BlueprintCapturePreviewInputSchema,
  BlueprintCaptureSaveInputSchema,
  BlueprintEventCaptureSourceSchema,
} from '../src/contracts/blueprint-capture.contracts'
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
import { BlueprintLibraryResponseSchema } from '../src/contracts/blueprint-library.contracts'

import {
  ContributionVisibilitySchema,
  ExperienceBlueprintSchema,
  ServicePackageSchema,
} from '../src/contracts/experience.contracts'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const checkOnly = process.argv.includes('--check')

const contracts = [
  {
    file: 'blueprint-native-creation-input.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-native-creation-input/v1.json',
    title: 'Gatherory Native Create and Share Template Request v1',
    schema: BlueprintNativeCreationRequestSchema,
    io: 'input' as const,
  },
  {
    file: 'blueprint-native-creation-response.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-native-creation-response/v1.json',
    title: 'Gatherory Native Create and Share Template Response v1',
    schema: BlueprintNativeCreationResponseSchema,
  },
  {
    file: 'blueprint-link-management-input.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-link-management-input/v1.json',
    title: 'Gatherory Native Template Link Management Request v1',
    schema: BlueprintLinkManagementInputSchema,
  },
  {
    file: 'blueprint-link-management-response.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-link-management-response/v1.json',
    title: 'Gatherory Native Template Link Management Response v1',
    schema: BlueprintLinkManagementResponseSchema,
  },
  {
    file: 'blueprint-share-create.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-share-create/v1.json',
    title: 'Gatherory Create Unlisted Template Link v1',
    schema: BlueprintShareCreateInputSchema,
  },
  {
    file: 'blueprint-share-revoke.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-share-revoke/v1.json',
    title: 'Gatherory Revoke Unlisted Template Link v1',
    schema: BlueprintShareRevokeInputSchema,
  },
  {
    file: 'blueprint-share-resolve.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-share-resolve/v1.json',
    title: 'Gatherory Resolve Unlisted Template Link v1',
    schema: BlueprintShareResolveInputSchema,
  },
  {
    file: 'blueprint-capture-source.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-capture-source/v1.json',
    title: 'Gatherory Authorized Event Capture Source v1',
    schema: BlueprintEventCaptureSourceSchema,
  },
  {
    file: 'blueprint-capture-preview.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-capture-preview/v1.json',
    title: 'Gatherory Event Capture Preview v1',
    schema: BlueprintCapturePreviewInputSchema,
  },
  {
    file: 'blueprint-capture-save.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-capture-save/v1.json',
    title: 'Gatherory Event Capture Save v1',
    schema: BlueprintCaptureSaveInputSchema,
  },
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
    file: 'blueprint-library.v1.schema.json',
    id: 'https://schemas.gatherory.com/blueprint-library/v1.json',
    title: 'Gatherory Used Blueprint Library Response v1',
    schema: BlueprintLibraryResponseSchema,
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
  const generated = z.toJSONSchema(contract.schema, { io: contract.io ?? 'output' })
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

const exploreFixture = `${JSON.stringify(BlueprintCatalogResponseSchema.parse(buildBlueprintCatalog(blueprintStarters)), null, 2)}\n`
const exploreFixturePath = resolve(repositoryRoot, 'contracts/examples/explore-catalog.v1.json')
if (checkOnly) {
  if ((await readFile(exploreFixturePath, 'utf8').catch(() => '')) !== exploreFixture) {
    mismatch = true
    console.error('explore-catalog.v1.json is not current. Run pnpm contracts:generate.')
  }
} else {
  await mkdir(dirname(exploreFixturePath), { recursive: true })
  await writeFile(exploreFixturePath, exploreFixture)
}

if (mismatch) process.exitCode = 1
