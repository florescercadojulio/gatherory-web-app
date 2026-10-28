# Android Sign in with Apple

Android uses Apple's website OAuth flow in a system browser. Better Auth receives
the Apple authorization code at its existing `/api/auth/callback/apple` endpoint,
validates OAuth state, and stores encrypted provider tokens on the linked account
for the existing Apple revocation-on-delete workflow.

The Android bridge is deliberately disabled unless
`ANDROID_APPLE_SIGN_IN_ENABLED=true` is set on the server. Android builds also
require the build property `gatheroryAppleSignInEnabledDebug=true` or
`gatheroryAppleSignInEnabledRelease=true`; both default to false. Keep production
server and release-build flags off until the Android custom-scheme integration
has been reviewed and tested with the production Apple Services ID.

The Apple Developer account must have Sign in with Apple enabled for the app,
and a **Services ID** configured for web authentication. For development, use
an isolated HTTPS development origin and configure that origin plus its
`/api/auth/callback/apple` return URL on the development Services ID. Set
`BETTER_AUTH_URL` to that same development origin. Never point development
builds at the production Apple return origin. For production, configure the
production Services ID separately and match its domain and return URL to the
production Better Auth origin. Supply the existing server values
`APPLE_CLIENT_ID` (the environment's Services ID), `APPLE_TEAM_ID`,
`APPLE_KEY_ID`, and `APPLE_PRIVATE_KEY`. Keep `APPLE_APP_BUNDLE_IDENTIFIER`
equal to the iOS bundle identifier; it supports native Apple identity tokens
and does not replace the Services ID for Android's browser flow. Apple requires
an HTTPS domain and return URL.

The native return is the fixed custom URI
`gatherory://auth/apple/callback?code=…&state=…`. The code is a random, short-lived
one-time handoff, not an Apple code or bearer. The Android app must keep the PKCE
verifier in encrypted device storage, validate the exact URI and state, then
POST `{ "code", "verifier", "state" }` to
`/api/auth/android/apple/exchange`. The server atomically consumes the handoff,
checks the PKCE proof in constant time, and revalidates the associated live
session before returning `{ "token", "user" }` in the response body. The
authorization code, bearer token, and PKCE verifier are never put in a URL.

The bridge uses short-lived records in Better Auth's existing verification
table and adds no database schema. Its start, complete, and exchange routes are
all gated by the server flag and return `Cache-Control: no-store` responses.

External setup references:

- [Apple: Configure Sign in with Apple for the web](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple)
- [Better Auth: Apple provider](https://better-auth.com/docs/authentication/apple)
