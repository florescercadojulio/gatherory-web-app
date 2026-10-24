/** The public iPhone beta invite maintained by the landing site. */
export const TESTFLIGHT_BETA_URL = 'https://testflight.apple.com/join/rUDD4MCY'
const PUBLIC_SITE_URL = 'https://gatherory.com'

const publicSiteDestinations = new Map([
  ['/privacy', `${PUBLIC_SITE_URL}/privacy`],
  ['/terms', `${PUBLIC_SITE_URL}/terms`],
  ['/legal', `${PUBLIC_SITE_URL}/terms`],
  ['/support', `${PUBLIC_SITE_URL}/support`],
])

function normalizedPathname(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/'
}

/** Public legal and support pages live on the landing site. */
export function publicBrowserDestination(pathname: string) {
  return publicSiteDestinations.get(normalizedPathname(pathname)) ?? null
}

/**
 * Public browser destinations that remain useful without the web planning app.
 * API and app-association routes stay available for native clients and links.
 */
export function shouldGateBrowserPath(pathname: string) {
  const path = normalizedPathname(pathname)
  return !(
    path === '/join' ||
    path.startsWith('/join/') ||
    path === '/templates/shared' ||
    path.startsWith('/templates/shared/') ||
    path === '/auth/reset-password' ||
    path === '/api' ||
    path.startsWith('/api/') ||
    path === '/.well-known' ||
    path.startsWith('/.well-known/')
  )
}
