import { createHash } from 'node:crypto'

export type PersonalLikeIntentFamily =
  | 'wedding'
  | 'birthday'
  | 'food_dietary'
  | 'camping'
  | 'craft_activity'
  | 'generic_logistics'
  | 'sports_watch'
  | 'weekend_travel'
  | 'community_service'

export type PersonalLikeFixtureSplit = 'development' | 'heldout'
export type PersonalLikeJudgment = 'relevant' | 'ambiguous' | 'unrelated'

export type PersonalLikeLabeledPlan = {
  catalogKey: string
  revision: number
  contentHash: string
  name: string
  summary: string
  eventTitles: string[]
  ideaTitles: string[]
  ideaNotes: string[]
  creatorKey: string
  firstPublishedAt: string
  language: 'en' | 'es' | 'mixed' | 'und'
  intentFamily: PersonalLikeIntentFamily
  split: PersonalLikeFixtureSplit
}

export type PersonalLikeLabeledPair = {
  split: PersonalLikeFixtureSplit
  seedKey: string
  candidateKey: string
  judgment: PersonalLikeJudgment
}

type PersonalLikeHeldoutFamily = Extract<
  PersonalLikeIntentFamily,
  'sports_watch' | 'weekend_travel' | 'community_service'
>

const families: Record<
  PersonalLikeHeldoutFamily,
  {
    split: PersonalLikeFixtureSplit
    candidates: Omit<
      PersonalLikeLabeledPlan,
      'catalogKey' | 'revision' | 'contentHash' | 'intentFamily' | 'split'
    >[]
  }
> = {
  sports_watch: {
    split: 'heldout',
    candidates: [
      {
        name: 'Watch the final together',
        summary: 'Set up a screen, snacks, and a relaxed soccer viewing night.',
        eventTitles: ['Match watch party'],
        ideaTitles: ['Team-color table'],
        ideaNotes: ['Keep the setup simple and leave a clear view of the screen.'],
        creatorKey: 'author-07',
        firstPublishedAt: '2026-10-07T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Noche de béisbol',
        summary: 'Invite neighbors to watch a game and share stadium-style snacks.',
        eventTitles: ['Juego en casa'],
        ideaTitles: ['Marcador amistoso'],
        ideaNotes: ['Set up a small score board for anyone who wants to play along.'],
        creatorKey: 'author-44',
        firstPublishedAt: '2026-07-09T12:00:00.000Z',
        language: 'es',
      },
      {
        name: 'Basketball playoff evening',
        summary: 'A low-key game night with a projector and an outdoor break at halftime.',
        eventTitles: ['Playoff viewing'],
        ideaTitles: ['Halftime free throws'],
        ideaNotes: ['Bring a soft ball outside for a short shooting game.'],
        creatorKey: 'author-45',
        firstPublishedAt: '2026-09-11T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Fútbol y botanas',
        summary: 'Watch a match with friends and put out clearly labeled snacks.',
        eventTitles: ['Partido y cena'],
        ideaTitles: ['Snacks para todos'],
        ideaNotes: ['Mark ingredients for guests with allergies.'],
        creatorKey: 'author-46',
        firstPublishedAt: '2026-08-13T12:00:00.000Z',
        language: 'mixed',
      },
      {
        name: 'Youth team celebration',
        summary: 'End the season with highlights, medals, and a short team gathering.',
        eventTitles: ['Season recap', 'Team meal'],
        ideaTitles: ['Photo slideshow'],
        ideaNotes: ['Ask families to share a few favorite moments.'],
        creatorKey: 'author-47',
        firstPublishedAt: '2026-10-21T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Ver el partido afuera',
        summary: 'A backyard screen and folding chairs for a summer match.',
        eventTitles: ['Partido al aire libre'],
        ideaTitles: ['Descanso activo'],
        ideaNotes: ['Take a stretch break between halves.'],
        creatorKey: 'author-48',
        firstPublishedAt: '2026-06-17T12:00:00.000Z',
        language: 'es',
      },
      {
        name: 'Sports night logistics',
        summary: 'Budget, schedule, seating, food, guest list, and location for viewing together.',
        eventTitles: ['Set up the screen'],
        ideaTitles: ['Food labels'],
        ideaNotes: ['Keep the walkway clear and mark allergy-safe snacks.'],
        creatorKey: 'author-49',
        firstPublishedAt: '2026-10-22T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Carrera en equipo',
        summary: 'A morning fun run followed by an outdoor team breakfast.',
        eventTitles: ['Community 5K', 'Breakfast outside'],
        ideaTitles: ['Water station'],
        ideaNotes: ['Place water at the start and finish.'],
        creatorKey: 'author-50',
        firstPublishedAt: '2026-05-21T12:00:00.000Z',
        language: 'es',
      },
    ],
  },
  weekend_travel: {
    split: 'heldout',
    candidates: [
      {
        name: 'Two days in Santa Fe',
        summary: 'A weekend with a museum visit, a walk, and a relaxed local dinner.',
        eventTitles: ['Museum morning', 'Old town walk'],
        ideaTitles: ['Art market stop'],
        ideaNotes: ['Check opening hours and leave time to browse.'],
        creatorKey: 'author-08',
        firstPublishedAt: '2026-10-08T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Escapada a la costa',
        summary: 'Un viaje corto con paseo por la playa y una visita al mercado local.',
        eventTitles: ['Llegada y paseo', 'Mercado de la mañana'],
        ideaTitles: ['Ruta tranquila'],
        ideaNotes: ['Planear descansos y opciones de transporte.'],
        creatorKey: 'author-51',
        firstPublishedAt: '2026-07-10T12:00:00.000Z',
        language: 'es',
      },
      {
        name: 'Mountain town weekend',
        summary: 'Ride the train, explore a small town, and take an easy scenic trail.',
        eventTitles: ['Train arrival', 'Scenic overlook'],
        ideaTitles: ['Pack layers'],
        ideaNotes: ['Check the forecast and bring water for the trail.'],
        creatorKey: 'author-52',
        firstPublishedAt: '2026-09-12T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Fin de semana cultural',
        summary: 'A bilingual city break for galleries, public transit, and neighborhood food.',
        eventTitles: ['Visita al museo', 'Gallery evening'],
        ideaTitles: ['Transit pass'],
        ideaNotes: ['Buy a day pass and save the route offline.'],
        creatorKey: 'author-53',
        firstPublishedAt: '2026-08-14T12:00:00.000Z',
        language: 'mixed',
      },
      {
        name: 'Cabin by the river',
        summary: 'A quiet weekend away with a short walk and time to read.',
        eventTitles: ['River path'],
        ideaTitles: ['Book exchange'],
        ideaNotes: ['Each person brings a book to trade.'],
        creatorKey: 'author-54',
        firstPublishedAt: '2026-10-23T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Ruta de pueblos',
        summary: 'Visita dos pueblos cercanos con paradas para comer y descansar.',
        eventTitles: ['Pueblo antiguo', 'Comida local'],
        ideaTitles: ['Mapa en papel'],
        ideaNotes: ['Marcar baños, estaciones y lugares para sentarse.'],
        creatorKey: 'author-55',
        firstPublishedAt: '2026-06-18T12:00:00.000Z',
        language: 'es',
      },
      {
        name: 'Trip planning logistics',
        summary: 'Budget, lodging, guest list, transportation, schedule, packing, and meal notes.',
        eventTitles: ['Travel day'],
        ideaTitles: ['Shared itinerary'],
        ideaNotes: ['Add addresses, check-in times, dietary needs, and backup routes.'],
        creatorKey: 'author-56',
        firstPublishedAt: '2026-10-24T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Viaje sin prisa',
        summary: 'Un fin de semana con una caminata corta y tiempo libre.',
        eventTitles: ['Paseo por el centro'],
        ideaTitles: ['Lista de equipaje'],
        ideaNotes: ['Llevar cargador, agua y zapatos cómodos.'],
        creatorKey: 'author-57',
        firstPublishedAt: '2026-05-22T12:00:00.000Z',
        language: 'es',
      },
    ],
  },
  community_service: {
    split: 'heldout',
    candidates: [
      {
        name: 'Neighborhood park cleanup',
        summary: 'A morning to collect litter, sort supplies, and care for a shared space.',
        eventTitles: ['Meet at the garden gate', 'Cleanup walk'],
        ideaTitles: ['Borrowed gloves'],
        ideaNotes: ['Bring reusable gloves and separate recycling from trash.'],
        creatorKey: 'author-09',
        firstPublishedAt: '2026-10-09T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Jornada del río',
        summary: 'Vecinos limpian la orilla y registran los residuos encontrados.',
        eventTitles: ['Limpieza del río'],
        ideaTitles: ['Materiales compartidos'],
        ideaNotes: ['Llevar bolsas reutilizables, guantes y agua.'],
        creatorKey: 'author-58',
        firstPublishedAt: '2026-07-11T12:00:00.000Z',
        language: 'es',
      },
      {
        name: 'Community garden workday',
        summary: 'Prepare beds, label seedlings, and share tasks in the neighborhood garden.',
        eventTitles: ['Garden work morning'],
        ideaTitles: ['Seedling labels'],
        ideaNotes: ['Use weatherproof labels and record plant names.'],
        creatorKey: 'author-59',
        firstPublishedAt: '2026-09-13T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Día de servicio mixto',
        summary: 'A bilingual volunteer morning to repaint a community room.',
        eventTitles: ['Pintar el centro'],
        ideaTitles: ['Color plan'],
        ideaNotes: ['Choose low-odor paint and cover the floor.'],
        creatorKey: 'author-60',
        firstPublishedAt: '2026-08-15T12:00:00.000Z',
        language: 'mixed',
      },
      {
        name: 'Coastal restoration morning',
        summary: 'Remove invasive plants and learn how dunes protect the shore.',
        eventTitles: ['Dune restoration'],
        ideaTitles: ['Native plant guide'],
        ideaNotes: ['Share a guide to local plants before the workday.'],
        creatorKey: 'author-61',
        firstPublishedAt: '2026-10-25T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Reparar bicicletas juntas',
        summary: 'A volunteer repair clinic helps neighbors tune up donated bikes.',
        eventTitles: ['Bike repair clinic'],
        ideaTitles: ['Tool check'],
        ideaNotes: ['Sort wrenches, pumps, spare tubes, and safety lights.'],
        creatorKey: 'author-62',
        firstPublishedAt: '2026-06-19T12:00:00.000Z',
        language: 'es',
      },
      {
        name: 'Volunteer day logistics',
        summary: 'Budget, site access, shift schedule, guest list, supplies, and cleanup plan.',
        eventTitles: ['Volunteer check-in'],
        ideaTitles: ['Safety briefing'],
        ideaNotes: ['Review tools, water, first aid, and the emergency contact.'],
        creatorKey: 'author-63',
        firstPublishedAt: '2026-10-26T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'みんなの秋の日',
        summary: '町の公園をきれいにして、植物を育てる日。',
        eventTitles: ['公園の清掃'],
        ideaTitles: ['道具を分ける'],
        ideaNotes: ['手袋と袋を用意します。'],
        creatorKey: 'author-64',
        firstPublishedAt: '2026-05-23T12:00:00.000Z',
        language: 'und',
      },
    ],
  },
}

const ambiguousFamilyPairs = new Set(['community_service|weekend_travel'])

function familyPair(left: PersonalLikeIntentFamily, right: PersonalLikeIntentFamily): string {
  return [left, right].sort().join('|')
}

function judgmentFor(
  seed: PersonalLikeIntentFamily,
  candidate: PersonalLikeIntentFamily
): PersonalLikeJudgment {
  if (seed === candidate) return 'relevant'
  return ambiguousFamilyPairs.has(familyPair(seed, candidate)) ? 'ambiguous' : 'unrelated'
}

const plans = Object.entries(families).flatMap(([family, value]) =>
  value.candidates.map((candidate, index) => {
    const intentFamily = family as PersonalLikeIntentFamily
    const catalogKey = `synthetic-${intentFamily}-${String(index + 1).padStart(2, '0')}`
    return {
      ...candidate,
      catalogKey,
      revision: 1,
      contentHash: createHash('sha256').update(`${catalogKey}:v1`).digest('hex'),
      intentFamily,
      split: value.split,
    }
  })
)

export const PERSONAL_LIKE_HELDOUT_PLANS: readonly PersonalLikeLabeledPlan[] = Object.freeze(plans)

export const PERSONAL_LIKE_HELDOUT_SEEDS: Readonly<Record<PersonalLikeHeldoutFamily, string>> =
  Object.freeze(
    Object.fromEntries(
      Object.keys(families).map((family) => [family, `synthetic-${family}-01`])
    ) as Record<PersonalLikeHeldoutFamily, string>
  )

export const PERSONAL_LIKE_HELDOUT_PAIRS: readonly PersonalLikeLabeledPair[] = Object.freeze(
  PERSONAL_LIKE_HELDOUT_PLANS.flatMap((seed) => {
    if (
      PERSONAL_LIKE_HELDOUT_SEEDS[seed.intentFamily as PersonalLikeHeldoutFamily] !==
      seed.catalogKey
    )
      return []
    return PERSONAL_LIKE_HELDOUT_PLANS.filter(
      (candidate) => candidate.split === seed.split && candidate.catalogKey !== seed.catalogKey
    ).map((candidate) => ({
      split: seed.split,
      seedKey: seed.catalogKey,
      candidateKey: candidate.catalogKey,
      judgment: judgmentFor(seed.intentFamily, candidate.intentFamily),
    }))
  })
)

export function personalLikeFixtureCanonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(personalLikeFixtureCanonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${personalLikeFixtureCanonicalJson(record[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

export const PERSONAL_LIKE_HELDOUT_LOCK = createHash('sha256')
  .update(
    personalLikeFixtureCanonicalJson({
      plans: PERSONAL_LIKE_HELDOUT_PLANS,
      pairs: PERSONAL_LIKE_HELDOUT_PAIRS,
    })
  )
  .digest('hex')
