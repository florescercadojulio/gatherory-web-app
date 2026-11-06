/** Invitation paths contain bearer links; guest response screens contain attendee identity. */
export function isPrivateInvitationPath(pathname: string) {
  return /^\/(?:join(?:\/|$)|invited(?:\/|$))/.test(pathname)
}

/** Also scrub referral URLs when the visitor later navigates to an ordinary page. */
export function redactInvitationCredentials<T>(payload: T): T {
  if (payload === undefined || payload === null) return payload
  return JSON.parse(
    JSON.stringify(payload)
      .replace(/\/join\/[0-9a-f-]{36}/gi, '/join/[redacted]')
      .replace(/%2fjoin%2f[0-9a-f-]{36}/gi, '%2Fjoin%2F[redacted]')
  )
}
