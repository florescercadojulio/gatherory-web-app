import { expect, test } from 'vitest'
import { isTemplateAuthoringPath } from '@/lib/protected-route-mode'

test.each(['/blueprints', '/blueprints/', '/blueprints/new', '/blueprints/abc'])(
  '%s uses session-only account context',
  (path) => {
    expect(isTemplateAuthoringPath(path)).toBe(true)
  }
)
test.each(['/workspaces', '/blueprints-other', '/account', '/'])(
  '%s retains existing workspace behavior',
  (path) => {
    expect(isTemplateAuthoringPath(path)).toBe(false)
  }
)
