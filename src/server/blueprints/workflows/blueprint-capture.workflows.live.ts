import { Effect, Layer } from 'effect'
import * as programs from './blueprint-capture.workflow'
import { BlueprintAuthoringRepoLive } from '../repos/blueprint-authoring.repo.live'
import { BlueprintCaptureRepoLive } from '../repos/blueprint-capture.repo.live'

const CaptureAuthoringLive = BlueprintAuthoringRepoLive
const CaptureLive = Layer.mergeAll(
  CaptureAuthoringLive,
  BlueprintCaptureRepoLive.pipe(Layer.provide(CaptureAuthoringLive))
)
export const listBlueprintCaptureEvents = (
  ...args: Parameters<typeof programs.listBlueprintCaptureEventsWorkflow>
) => programs.listBlueprintCaptureEventsWorkflow(...args).pipe(Effect.provide(CaptureLive))
export const getBlueprintCaptureSource = (
  ...args: Parameters<typeof programs.getBlueprintCaptureSourceWorkflow>
) => programs.getBlueprintCaptureSourceWorkflow(...args).pipe(Effect.provide(CaptureLive))
export const previewBlueprintCapture = (
  ...args: Parameters<typeof programs.previewBlueprintCaptureWorkflow>
) => programs.previewBlueprintCaptureWorkflow(...args).pipe(Effect.provide(CaptureLive))
export const saveBlueprintCapture = (
  ...args: Parameters<typeof programs.saveBlueprintCaptureWorkflow>
) => programs.saveBlueprintCaptureWorkflow(...args).pipe(Effect.provide(CaptureLive))
