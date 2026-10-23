import { developmentEventImages, type DevelopmentEventImage } from './development-event-images'

export const developmentSharedAlbumContributors = {
  alex: {
    email: 'planner@gatherory.test',
    name: 'Alex Morgan',
    role: 'host',
    planningPermission: 'manage',
  },
  jordan: {
    email: 'jordan@gatherory.test',
    name: 'Jordan Lee',
    role: 'host',
    planningPermission: 'manage',
  },
  maya: {
    email: 'coordinator@gatherory.test',
    name: 'Maya Chen',
    role: 'collaborator',
    planningPermission: 'contribute',
  },
} as const

export type DevelopmentSharedAlbumContributor = keyof typeof developmentSharedAlbumContributors

const sourceImages = new Map(developmentEventImages.map((image) => [image.key, image]))

function sourceImage(key: DevelopmentEventImage['key']) {
  const image = sourceImages.get(key)
  if (!image) throw new Error(`Missing source image metadata for ${key}.`)
  return image
}

function sharedAlbumImage(input: {
  id: string
  title: string
  file: string
  sourceKey: DevelopmentEventImage['key']
  minute: number
  contributor: DevelopmentSharedAlbumContributor
}) {
  const source = sourceImage(input.sourceKey)
  return {
    id: input.id,
    title: input.title,
    file: input.file,
    sourceURL: source.sourceURL,
    photographer: source.photographer,
    photoID: source.photoID,
    altText: source.altText,
    contributor: input.contributor,
    // Foundation reference-date seconds, fixed for deterministic inserts.
    addedAt: 813_499_200 + input.minute * 60,
  }
}

/**
 * Bundled gallery photos for the seeded garden wedding's shared album.
 * Source credits and alt text are reused from the cover catalog so they stay
 * consistent with the already documented fixture assets.
 */
export const developmentSharedAlbumImages = [
  sharedAlbumImage({
    id: '83000000-0000-4000-8000-000000000001',
    title: 'Garden ceremony vows',
    file: 'scripts/seed/assets/ceremony-couple.jpg',
    sourceKey: 'review-ceremony-event',
    minute: 0,
    contributor: 'alex',
  }),
  sharedAlbumImage({
    id: '83000000-0000-4000-8000-000000000002',
    title: 'A garden wedding moment',
    file: 'scripts/seed/assets/garden-ceremony.jpg',
    sourceKey: 'review-weekend-guide-idea',
    minute: 1,
    contributor: 'jordan',
  }),
  sharedAlbumImage({
    id: '83000000-0000-4000-8000-000000000003',
    title: 'Reception tables',
    file: 'scripts/seed/assets/reception-tables.jpg',
    sourceKey: 'review-reception-event',
    minute: 2,
    contributor: 'maya',
  }),
  sharedAlbumImage({
    id: '83000000-0000-4000-8000-000000000004',
    title: 'Garden venue',
    file: 'scripts/seed/assets/venue-garden.jpg',
    sourceKey: 'review-venue-idea',
    minute: 3,
    contributor: 'alex',
  }),
  sharedAlbumImage({
    id: '83000000-0000-4000-8000-000000000005',
    title: 'Reception decor',
    file: 'scripts/seed/assets/reception-decor.jpg',
    sourceKey: 'review-rehearsal-dinner-event',
    minute: 4,
    contributor: 'jordan',
  }),
  sharedAlbumImage({
    id: '83000000-0000-4000-8000-000000000006',
    title: 'Welcome drinks',
    file: 'scripts/seed/assets/welcome-drinks.jpg',
    sourceKey: 'review-welcome-drinks-idea',
    minute: 5,
    contributor: 'maya',
  }),
] as const

export type DevelopmentSharedAlbumImage = (typeof developmentSharedAlbumImages)[number]
