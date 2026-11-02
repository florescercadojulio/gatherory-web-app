import { Effect, Layer } from 'effect'
import * as program from './blueprint-native-creation.workflow'
import { BlueprintAuthoringRepoLive } from '../repos/blueprint-authoring.repo.live'
import { BlueprintCaptureRepoLive } from '../repos/blueprint-capture.repo.live'
import { BlueprintNativeCreationRepoLive } from '../repos/blueprint-native-creation.repo.live'
import { BetterAuthWorkspaceConLive } from '@/server/workspaces/connectors/better-auth.con.live'
import { BlueprintNativeCreationTransactionLive } from './blueprint-native-creation-transaction.live'
import { BlueprintCoverDomainLive } from '@/server/blueprint-media/blueprint-media.layers.live'

const AuthoringLive = BlueprintAuthoringRepoLive
const CaptureLive = BlueprintCaptureRepoLive.pipe(Layer.provide(AuthoringLive))
const NativeCreationRepoLive = BlueprintNativeCreationRepoLive.pipe(
  Layer.provide(Layer.mergeAll(AuthoringLive, CaptureLive))
)
const NativeCreationLive = Layer.mergeAll(
  AuthoringLive,
  CaptureLive,
  NativeCreationRepoLive,
  BlueprintNativeCreationTransactionLive,
  BetterAuthWorkspaceConLive,
  BlueprintCoverDomainLive
)

export const blueprintNativeCreation = (
  ...args: Parameters<typeof program.blueprintNativeCreationWorkflow>
) => program.blueprintNativeCreationWorkflow(...args).pipe(Effect.provide(NativeCreationLive))
