import { describe, expect, it } from 'vitest'

import { ideaResponseID as canonicalIdeaResponseID } from '@/server/sync/contracts/idea-response'
import { deletedAccountTombstone as canonicalTombstone } from '@/server/sync/contracts/native-tombstones'
import { nativeIdentityWriteAllowed as canonicalIdentityWriteAllowed } from '@/server/sync/services/native-identity-access'
import { compareNativeMutationOrder as canonicalMutationOrder } from '@/server/sync/workflows/native-sync-ordering'
import { ideaResponseID } from '@/server/sync/idea-response'
import { deletedAccountTombstone } from '@/server/sync/native-tombstones'
import { nativeIdentityWriteAllowed } from '@/server/sync/native-identity-access'
import { compareNativeMutationOrder } from '@/server/sync/native-sync-ordering'
import { nativePullOperation as legacyPullOperation } from '@/server/sync/native-sync-contracts'
import { nativePullOperation } from '@/server/sync/contracts/native-sync.contracts'

describe('native sync module compatibility', () => {
  it('keeps legacy helper imports delegated to canonical modules', () => {
    expect(ideaResponseID).toBe(canonicalIdeaResponseID)
    expect(deletedAccountTombstone).toBe(canonicalTombstone)
    expect(nativeIdentityWriteAllowed).toBe(canonicalIdentityWriteAllowed)
    expect(compareNativeMutationOrder).toBe(canonicalMutationOrder)
    expect(legacyPullOperation).toBe(nativePullOperation)
  })
})
