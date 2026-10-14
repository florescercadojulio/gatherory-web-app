import { Effect } from 'effect'
import { AppleTokenLive } from '../apple-token.layers.live'
import { saveAppleTokenWorkflow as program } from './save-apple-token.workflow'

export const saveAppleTokenWorkflow = (...args: Parameters<typeof program>) =>
  program(...args).pipe(Effect.provide(AppleTokenLive))
