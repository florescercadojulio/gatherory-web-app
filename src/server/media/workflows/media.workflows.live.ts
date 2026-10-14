import { Effect } from 'effect'

import { MediaDomainLive } from '../media.layers.live'
import { finalizeEventMediaUploadWorkflow as programFinalizeEventMediaUpload } from './finalize-event-media-upload.workflow'
import { finalizeNativeMediaUploadWorkflow as programFinalizeNativeMediaUpload } from './finalize-native-media-upload.workflow'
import { getEventMediaUrlWorkflow as programGetEventMediaUrl } from './get-event-media-url.workflow'
import { getNativeMediaUrlWorkflow as programGetNativeMediaUrl } from './get-native-media-url.workflow'
import { prepareEventMediaUploadWorkflow as programPrepareEventMediaUpload } from './prepare-event-media-upload.workflow'
import { prepareNativeMediaUploadWorkflow as programPrepareNativeMediaUpload } from './prepare-native-media-upload.workflow'

export const prepareEventMediaUploadWorkflow = (
  ...args: Parameters<typeof programPrepareEventMediaUpload>
) => programPrepareEventMediaUpload(...args).pipe(Effect.provide(MediaDomainLive))

export const finalizeEventMediaUploadWorkflow = (
  ...args: Parameters<typeof programFinalizeEventMediaUpload>
) => programFinalizeEventMediaUpload(...args).pipe(Effect.provide(MediaDomainLive))

export const getEventMediaUrlWorkflow = (...args: Parameters<typeof programGetEventMediaUrl>) =>
  programGetEventMediaUrl(...args).pipe(Effect.provide(MediaDomainLive))

export const prepareNativeMediaUploadWorkflow = (
  ...args: Parameters<typeof programPrepareNativeMediaUpload>
) => programPrepareNativeMediaUpload(...args).pipe(Effect.provide(MediaDomainLive))

export const finalizeNativeMediaUploadWorkflow = (
  ...args: Parameters<typeof programFinalizeNativeMediaUpload>
) => programFinalizeNativeMediaUpload(...args).pipe(Effect.provide(MediaDomainLive))

export const getNativeMediaUrlWorkflow = (...args: Parameters<typeof programGetNativeMediaUrl>) =>
  programGetNativeMediaUrl(...args).pipe(Effect.provide(MediaDomainLive))
