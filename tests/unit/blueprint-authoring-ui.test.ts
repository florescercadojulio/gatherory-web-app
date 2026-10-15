import { describe, expect, it } from 'vitest'

import {
  dependentsForChild,
  emptyBlueprintContent,
  makeStableKey,
  matchesCreateAttempt,
  reorder,
  targetForValue,
  targetValue,
} from '@/components/blueprints/blueprint-authoring.utils'

describe('blueprint authoring UI helpers', () => {
  it('starts with a neutral empty template instead of experience-specific content', () => {
    expect(emptyBlueprintContent()).toEqual({
      name: '',
      description: '',
      experienceType: 'custom',
      children: [],
      ideas: [],
      instructions: [],
    })
  })

  it('reorders items by one keyboard-operable step and preserves edge positions', () => {
    expect(reorder(['first', 'second', 'third'], 1, -1)).toEqual(['second', 'first', 'third'])
    expect(reorder(['first', 'second'], 0, -1)).toEqual(['first', 'second'])
    expect(reorder(['first', 'second'], 1, 1)).toEqual(['first', 'second'])
  })

  it('tracks content that must be retargeted before removing an activity', () => {
    const content = emptyBlueprintContent()
    content.children.push({
      key: 'venue_visit',
      title: 'Visit the venue',
      purpose: 'planning_scouting',
      category: 'venue',
    })
    content.ideas.push({
      key: 'compare_catering',
      title: 'Compare catering',
      category: 'food',
      target: { kind: 'child', key: 'venue_visit' },
      configuration: { version: 1 },
    })
    content.instructions.push({
      key: 'venue_access',
      title: 'Venue access',
      body: 'Confirm access with the venue.',
      audience: 'planning_only',
      target: { kind: 'child', key: 'venue_visit' },
    })

    expect(dependentsForChild(content, 'venue_visit')).toEqual({
      ideas: [content.ideas[0]],
      instructions: [content.instructions[0]],
    })
    expect(dependentsForChild(content, 'other_activity')).toEqual({ ideas: [], instructions: [] })
  })

  it('creates stable portable keys and converts target controls to contract values', () => {
    expect(makeStableKey('idea', 'Café & venue visit', [])).toBe('idea_cafe_venue_visit')
    expect(makeStableKey('idea', 'Café & venue visit', ['idea_cafe_venue_visit'])).toBe(
      'idea_cafe_venue_visit_2'
    )
    expect(targetForValue('main')).toEqual({ kind: 'main' })
    expect(targetValue({ kind: 'child', key: 'venue_visit' })).toBe('venue_visit')
  })

  it('reuses a create request only while its organization, content, and source stay identical', () => {
    const payload = {
      organizationId: 'workspace-1',
      content: { ...emptyBlueprintContent(), name: 'Family gathering' },
      source: { catalogKey: 'family_gathering', revision: 2 },
    }
    const attempt = { ...payload, requestId: '1f6b6bb2-177a-41f2-aea6-777fd222e39e' }

    expect(matchesCreateAttempt(attempt, payload)).toBe(true)
    expect(matchesCreateAttempt(attempt, { ...payload, organizationId: 'workspace-2' })).toBe(false)
    expect(
      matchesCreateAttempt(attempt, {
        ...payload,
        content: { ...payload.content, name: 'Changed' },
      })
    ).toBe(false)
    expect(
      matchesCreateAttempt(attempt, {
        organizationId: payload.organizationId,
        content: payload.content,
      })
    ).toBe(false)
  })
})
