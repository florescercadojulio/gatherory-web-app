import { cottageDraftContent } from '@/db/seeds/cottage-template'
import { draftDefinition } from '@/contracts/blueprint-authoring.contracts'
import { BlueprintIdeasModuleSchema } from '@/contracts/blueprint-install.contracts'
import { blueprintHash } from '@/server/blueprints/planning/blueprint-hash'
import {
  BLUEPRINT_SERVER_CAPABILITIES,
  expandBlueprintInstallation,
} from '@/server/blueprints/planning/plan-blueprint-installation'
import { buildBlueprintNativeProjection } from '@/server/blueprints/services/blueprint-native-projection'

const catalogKey = 'private_0123456789abcdef0123456789abcdef'
const revision = 1
const definition = draftDefinition(cottageDraftContent, catalogKey, revision)
const contentHash = blueprintHash(definition)
const actor = {
  id: 'cottage-proof-owner',
  name: 'Riley Example',
  email: 'riley@example.test',
}

const copies = [
  {
    requestID: '90000000-0000-4000-8000-000000000001',
    installationID: '91000000-0000-4000-8000-000000000001',
    organizationID: 'org_private_cottage_copy_1',
    mainEvent: {
      name: 'Lake Cottage Weekend',
      startsAt: '2027-07-08T16:00:00.000Z',
      timeZone: 'America/Detroit',
    },
    childStartsAt: [
      '2027-07-08T20:00:00.000Z',
      '2027-07-09T14:00:00.000Z',
      '2027-07-11T14:00:00.000Z',
    ],
  },
  {
    requestID: '90000000-0000-4000-8000-000000000002',
    installationID: '91000000-0000-4000-8000-000000000002',
    organizationID: 'org_private_cottage_copy_2',
    mainEvent: {
      name: 'Autumn Cottage Weekend',
      startsAt: '2027-10-13T16:00:00.000Z',
      timeZone: 'America/Detroit',
    },
    childStartsAt: [
      '2027-10-13T20:00:00.000Z',
      '2027-10-14T14:00:00.000Z',
      '2027-10-16T14:00:00.000Z',
    ],
  },
] as const

function id(copy: number, kind: number, index: number) {
  return `${copy + 1}0000000-${kind}000-4000-8000-${String(index + 1).padStart(12, '0')}`
}

/** Builds two independent portable installs pinned to the same private revision. */
export function buildCottageInstallationFixtures() {
  const ideas = BlueprintIdeasModuleSchema.parse(
    definition.modules.find((module) => module.type === 'ideas')
  )

  return {
    catalogKey,
    revision,
    contentHash,
    installations: copies.map((copy, copyIndex) => {
      const input = {
        requestId: copy.requestID,
        catalogKey,
        revision,
        contentHash,
        mainEvent: copy.mainEvent,
        selectedChildren: cottageDraftContent.children.map((child, index) => ({
          key: child.key,
          startsAt: copy.childStartsAt[index],
        })),
        selectedIdeaKeys: ideas.config.ideas.map((idea) => idea.key),
        capabilities: [...BLUEPRINT_SERVER_CAPABILITIES],
      }
      const plan = expandBlueprintInstallation(input, {
        catalogKey,
        revision,
        contentHash,
        definition,
      })
      const manifest = {
        events: Object.fromEntries(
          [plan.main, ...plan.children].map((event, index) => [
            event.sourceKey,
            id(copyIndex, 1, index),
          ])
        ),
        ideas: Object.fromEntries(
          plan.ideas.map((idea, index) => [idea.sourceKey, id(copyIndex, 2, index)])
        ),
        guides: Object.fromEntries(
          plan.instructions.map((guide, index) => [guide.sourceKey, id(copyIndex, 3, index)])
        ),
        personID: id(copyIndex, 7, 0),
        participations: Object.fromEntries(
          [plan.main, ...plan.children].map((event, index) => [
            event.sourceKey,
            id(copyIndex, 8, index),
          ])
        ),
      }
      const { archive } = buildBlueprintNativeProjection({
        plan,
        manifest,
        actor,
        createdAt: new Date('2026-10-15T12:00:00.000Z'),
      })

      return {
        requestID: copy.requestID,
        installationID: copy.installationID,
        organizationID: copy.organizationID,
        input,
        manifest,
        archive,
      }
    }),
  }
}
