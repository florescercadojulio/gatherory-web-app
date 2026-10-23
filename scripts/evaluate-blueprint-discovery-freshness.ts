import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  EVALUATION_AS_OF,
  evaluateFixtureBoundaries,
  evaluateRepeatedVisits,
  FETCH_SIZE,
  MEANINGFUL_VISIBLE_COUNT,
  REPEAT_WINDOW_MS,
} from './blueprint-discovery-freshness-evaluation'

const ARTIFACT_PATH = resolve(
  'docs/roadmaps/blueprint-ranking-roadmap/artifacts/repeated-visit-freshness-evaluation.json'
)
const check = process.argv.includes('--check')

function buildArtifact() {
  return {
    formatVersion: 1,
    purpose:
      'Deterministic synthetic policy evaluation. Results describe fixture behavior, not online usefulness or production uplift.',
    asOf: EVALUATION_AS_OF,
    policy: {
      algorithmVersion: 'blueprint-unseen-first-v1',
      baseline: 'Existing baseline_v1 ordering with no discovery session context.',
      candidate:
        'Unseen first, then seen items outside the 24-hour cooldown, then recently seen; equal-ranked browse ties use a deterministic session seed.',
      cooldownMs: REPEAT_WINDOW_MS,
      fetchedPerVisit: FETCH_SIZE,
      meaningfullyVisibleAndRecordedPerVisit: MEANINGFUL_VISIBLE_COUNT,
      onlyMeaningfullyVisibleItemsUpdateSeenHistory: true,
      top10RepeatRateDefinition:
        'Share of the current top ten that were meaningfully exposed during any prior visit.',
    },
    fixtures: {
      repeatedVisitCatalogCount: 120,
      repeatedVisitCount: 5,
      boundaries: evaluateFixtureBoundaries(),
    },
    repeatedVisits: evaluateRepeatedVisits(),
  }
}

async function main() {
  const artifact = `${JSON.stringify(buildArtifact(), null, 2)}\n`
  if (check) {
    const existing = await readFile(ARTIFACT_PATH, 'utf8')
    if (existing !== artifact)
      throw new Error(`${ARTIFACT_PATH} is out of date; rerun without --check`)
    return
  }
  await mkdir(dirname(ARTIFACT_PATH), { recursive: true })
  await writeFile(ARTIFACT_PATH, artifact)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main()
}
