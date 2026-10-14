/** Compatibility exports for existing Better Auth integrations and tests. */
export {
  exchangeAppleAuthorizationCode,
  generateAppleClientSecret,
  revokeAppleAccountsBeforeDeletion,
  revokeAppleToken,
  saveNativeAppleRevocationToken,
} from './handlers/apple-tokens.adapter'
