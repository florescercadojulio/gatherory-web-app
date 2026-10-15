import { expect, test } from 'vitest'

import { blueprintCaptureSaveRecovery } from '@/components/blueprints/blueprint-capture.utils'

test('known capture source and draft conflicts release the immutable save attempt', () => {
  expect(blueprintCaptureSaveRecovery('BLUEPRINT_CAPTURE_SOURCE_MISMATCH')).toBe('unlock')
  expect(blueprintCaptureSaveRecovery('BLUEPRINT_CAPTURE_SOURCE_CHANGED')).toBe(
    'refresh-source-and-preview'
  )
  expect(blueprintCaptureSaveRecovery('BLUEPRINT_DRAFT_VERSION_CONFLICT')).toBe(
    'refresh-source-and-preview'
  )
})

test('ambiguous failures keep the same request locked for retry', () => {
  expect(blueprintCaptureSaveRecovery('INTERNAL_ERROR')).toBe('retry-same-request')
  expect(blueprintCaptureSaveRecovery('BLUEPRINT_CAPTURE_REQUEST_CONFLICT')).toBe(
    'retry-same-request'
  )
  expect(blueprintCaptureSaveRecovery(undefined)).toBe('retry-same-request')
})
