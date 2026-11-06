export function isSameOriginEventUpdateRequest(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    if (origin !== new URL(request.url).origin || origin !== new URL(origin).origin) return false
  } catch {
    return false
  }
  const fetchSite = request.headers.get('sec-fetch-site')
  return fetchSite == null || fetchSite === 'same-origin'
}
