import { Effect, Layer } from 'effect'
import { ModerationSessionConnectorLive } from '../connectors/moderation-session.con.live'
import { ModerationServerLive } from '../moderation.layers.live'
import { moderatorAccessWorkflow as moderatorAccessProgram } from './moderator-access.workflow'

const ModeratorAccessLive = Layer.mergeAll(ModerationSessionConnectorLive, ModerationServerLive)

export const moderatorAccessWorkflow = (...args: Parameters<typeof moderatorAccessProgram>) =>
  moderatorAccessProgram(...args).pipe(Effect.provide(ModeratorAccessLive))
