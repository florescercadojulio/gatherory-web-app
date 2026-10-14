import { Layer } from 'effect'
import { AppleAuthConLive } from './connectors/apple-auth.con.live'
import { AppleTokenRepoLive } from './repos/apple-token.repo.live'
import { AppleTokenServiceLive } from './services/apple-token.service.live'

const AppleTokenDependenciesLive = Layer.mergeAll(AppleAuthConLive, AppleTokenRepoLive)

export const AppleTokenLive = AppleTokenServiceLive.pipe(Layer.provide(AppleTokenDependenciesLive))
