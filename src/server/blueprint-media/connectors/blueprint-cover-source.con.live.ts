import { Effect, Layer } from 'effect'

import { ExternalServiceError } from '@/lib/domain-errors'
import { BlueprintCoverSource } from './blueprint-cover-source.con'

export const BlueprintCoverSourceLive = Layer.succeed(BlueprintCoverSource, {
  download: (input) =>
    Effect.tryPromise({
      try: async () => {
        const response = await fetch(input.url, {
          redirect: 'error',
          signal: AbortSignal.timeout(30_000),
        })
        if (!response.body) throw new Error('Cover source response had no body.')
        const reader = response.body.getReader()
        const chunks: Uint8Array[] = []
        let byteSize = 0
        try {
          while (true) {
            const part = await reader.read()
            if (part.done) break
            byteSize += part.value.byteLength
            if (byteSize > input.maxBytes) throw new Error('Cover source exceeded its byte limit.')
            chunks.push(part.value)
          }
        } finally {
          await reader.cancel().catch(() => undefined)
        }
        if (!response.ok) throw new Error('Cover source returned a non-success status.')
        if (!byteSize) throw new Error('Cover source was empty.')
        const bytes = Buffer.concat(
          chunks.map((chunk) => Buffer.from(chunk)),
          byteSize
        )
        return { bytes, contentType: response.headers.get('content-type') }
      },
      catch: (cause) =>
        new ExternalServiceError({
          category: 'external',
          code: 'BLUEPRINT_CURATED_COVER_IMPORT_FAILED',
          userMessageKey: 'serverErrors.MEDIA_OPERATION_FAILED',
          cause,
        }),
    }),
})
