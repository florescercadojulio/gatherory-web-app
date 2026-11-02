import { Context, Effect } from 'effect'

export type BlueprintCoverSourceShape = {
  readonly download: (input: {
    url: string
    maxBytes: number
  }) => Effect.Effect<{ bytes: Uint8Array; contentType: string | null }, unknown>
}

/** External source download port for checked-in public cover manifests. */
export class BlueprintCoverSource extends Context.Service<
  BlueprintCoverSource,
  BlueprintCoverSourceShape
>()('BlueprintCoverSource') {}
