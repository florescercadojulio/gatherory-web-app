import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  BLUEPRINT_PERSONAL_LIKE_POLICY_FINGERPRINT,
  BLUEPRINT_PERSONAL_LIKE_POLICY_VERSION,
} from '../../src/server/blueprints/services/blueprint-like-affinity'
import { BLUEPRINT_PERSONAL_LIKE_POLICY_FINGERPRINT as INITIAL_V2_FINGERPRINT } from '../fixtures/blueprint-like-affinity-v2-initial'
import {
  PERSONAL_LIKE_DEVELOPMENT_LOCK,
  PERSONAL_LIKE_DEVELOPMENT_PAIRS,
  PERSONAL_LIKE_DEVELOPMENT_PLANS,
  PERSONAL_LIKE_DEVELOPMENT_SEEDS,
} from '../fixtures/blueprint-personal-like-development'
import {
  PERSONAL_LIKE_HELDOUT_LOCK,
  PERSONAL_LIKE_HELDOUT_PAIRS,
  PERSONAL_LIKE_HELDOUT_PLANS,
} from '../fixtures/blueprint-personal-like-heldout'
import {
  PERSONAL_LIKE_CHALLENGE_LOCK,
  PERSONAL_LIKE_CHALLENGE_PAIRS,
  PERSONAL_LIKE_CHALLENGE_PLANS,
} from '../fixtures/blueprint-personal-like-challenge'

const FROZEN_DEVELOPMENT_LOCK = '31309b41556e52ddb5a6a1121b1150780eb012aadd5787192bc048b4bc74ca7b'

describe('personal-like tuning development fixture', () => {
  it('locks the initial comparator and final v2 formula independently of fixture labels', () => {
    expect(BLUEPRINT_PERSONAL_LIKE_POLICY_VERSION).toBe('blueprint-personal-likes-v2')
    expect(INITIAL_V2_FINGERPRINT).toBe(
      'a466c320b2efd0181951cdd615d091132945d5b289d1566e91ab406235ca2e1d'
    )
    expect(BLUEPRINT_PERSONAL_LIKE_POLICY_FINGERPRINT).toBe(
      'c7f7218e57aa1717dbf840a6e61cc23e2ee50ee60ba7a645512bb4e221ae4204'
    )
  })

  it('distinguishes frozen initial-v2 snapshot bytes from the original source hash', async () => {
    const source = await readFile(
      new URL('../fixtures/blueprint-like-affinity-v2-initial.ts', import.meta.url),
      'utf8'
    )
    expect(createHash('sha256').update(source).digest('hex')).toBe(
      'c1a8507033bf7e13d30c80d0f89b029576cb68de44569d897b085680f171e050'
    )
    expect(source).toContain(
      '// Original source SHA-256: 18666aa462b0dac5f50860a8afd226db60e53c5d2d383912d4edf2ed1dd912d9'
    )
  })

  it('keeps the predeclared fictional plans and judgments frozen', () => {
    expect(PERSONAL_LIKE_DEVELOPMENT_LOCK).toBe(FROZEN_DEVELOPMENT_LOCK)
    expect(PERSONAL_LIKE_DEVELOPMENT_PLANS).toHaveLength(49)
    expect(Object.keys(PERSONAL_LIKE_DEVELOPMENT_SEEDS)).toHaveLength(6)
    expect(PERSONAL_LIKE_DEVELOPMENT_PAIRS).toHaveLength(288)
    expect(
      Object.fromEntries(
        (['relevant', 'ambiguous', 'unrelated'] as const).map((judgment) => [
          judgment,
          PERSONAL_LIKE_DEVELOPMENT_PAIRS.filter((pair) => pair.judgment === judgment).length,
        ])
      )
    ).toEqual({ relevant: 43, ambiguous: 65, unrelated: 180 })
  })

  it('keeps evaluator-only metadata outside the public lexical roles', () => {
    for (const plan of PERSONAL_LIKE_DEVELOPMENT_PLANS) {
      expect(plan).toHaveProperty('creatorKey')
      expect(plan).toHaveProperty('firstPublishedAt')
      expect(plan).toHaveProperty('language')
      expect(plan).toHaveProperty('intentFamily')
      expect(plan).not.toHaveProperty('publicText')
    }
  })

  it('keeps the predeclared heldout plans and judgments frozen after policy lock', () => {
    expect(PERSONAL_LIKE_HELDOUT_LOCK).toBe(
      'b8bab4bb4f69e6ceacb12cca33e44ae2f5a1cbaa95f5ddf0e35a7f07bc5493cc'
    )
    expect(PERSONAL_LIKE_HELDOUT_PLANS).toHaveLength(24)
    expect(PERSONAL_LIKE_HELDOUT_PAIRS).toHaveLength(69)
    expect(
      Object.fromEntries(
        (['relevant', 'ambiguous', 'unrelated'] as const).map((judgment) => [
          judgment,
          PERSONAL_LIKE_HELDOUT_PAIRS.filter((pair) => pair.judgment === judgment).length,
        ])
      )
    ).toEqual({ relevant: 21, ambiguous: 16, unrelated: 32 })
  })

  it('freezes a separate new-family multilingual challenge set before the next policy lock', () => {
    expect(PERSONAL_LIKE_CHALLENGE_LOCK).toBe(
      '9c446f787b1e8dc773cf4c5930ad9d56b876d4eb8e4ebe25e28bbb10700291c1'
    )
    expect(PERSONAL_LIKE_CHALLENGE_PLANS).toHaveLength(28)
    expect(PERSONAL_LIKE_CHALLENGE_PAIRS).toHaveLength(108)
    expect(
      Object.fromEntries(
        (['relevant', 'ambiguous', 'unrelated'] as const).map((judgment) => [
          judgment,
          PERSONAL_LIKE_CHALLENGE_PAIRS.filter((pair) => pair.judgment === judgment).length,
        ])
      )
    ).toEqual({ relevant: 16, ambiguous: 32, unrelated: 60 })
    expect(
      Object.values({
        book: 'challenge-book_circle-01',
        games: 'challenge-tabletop_games-01',
        music: 'challenge-live_music-01',
        plants: 'challenge-plant_exchange-01',
      }).map(
        (key) => PERSONAL_LIKE_CHALLENGE_PLANS.find((plan) => plan.catalogKey === key)?.language
      )
    ).toEqual(['es', 'es', 'en', 'es'])
  })
})
