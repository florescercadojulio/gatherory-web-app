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
