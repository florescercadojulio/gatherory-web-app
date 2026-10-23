import { createHash } from 'node:crypto'

export type PersonalLikeChallengeFamily =
  'book_circle' | 'tabletop_games' | 'live_music' | 'plant_exchange'

export type PersonalLikeChallengeJudgment = 'relevant' | 'ambiguous' | 'unrelated'
export type PersonalLikeChallengeLanguage = 'en' | 'es' | 'mixed' | 'und'

export type PersonalLikeChallengePlan = {
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
  language: PersonalLikeChallengeLanguage
  intentFamily: PersonalLikeChallengeFamily
  split: 'challenge'
}

export type PersonalLikeChallengePair = {
  seedKey: string
  candidateKey: string
  judgment: PersonalLikeChallengeJudgment
  rationale: string
}

type RawPlan = Omit<
  PersonalLikeChallengePlan,
  'catalogKey' | 'revision' | 'contentHash' | 'intentFamily' | 'split'
>

const familyPlans: Record<PersonalLikeChallengeFamily, RawPlan[]> = {
  book_circle: [
    {
      name: 'Círculo de lectura de misterio',
      summary: 'Una reunión pequeña para conversar sobre una novela detectivesca y sus pistas.',
      eventTitles: ['Elegir la novela', 'Conversación del último capítulo'],
      ideaTitles: ['Tarjetas de personajes'],
      ideaNotes: ['Cada persona comparte una sospecha antes de revelar el final.'],
      creatorKey: 'challenge-author-01',
      firstPublishedAt: '2026-10-03T12:00:00.000Z',
      language: 'es',
    },
    {
      name: 'Cozy whodunit book circle',
      summary: 'A few neighbors compare clues from a detective novel over tea.',
      eventTitles: ['Pick the next mystery', 'Chapter discussion'],
      ideaTitles: ['Character clue cards'],
      ideaNotes: ['Let everyone make one prediction before discussing the ending.'],
      creatorKey: 'challenge-author-02',
      firstPublishedAt: '2026-07-04T12:00:00.000Z',
      language: 'en',
    },
    {
      name: 'Lectura compartida de poesía',
      summary: 'Leer poemas breves y hablar de imágenes que cada persona recuerda.',
      eventTitles: ['Lectura en voz alta', 'Elegir poemas favoritos'],
      ideaTitles: ['Marcapáginas hechos a mano'],
      ideaNotes: ['Dejar unos minutos para que cada quien elija un verso.'],
      creatorKey: 'challenge-author-03',
      firstPublishedAt: '2026-09-05T12:00:00.000Z',
      language: 'es',
    },
    {
      name: 'Stories around the table',
      summary: 'A calm reading meetup with short fiction and conversation.',
      eventTitles: ['Bring a favorite story', 'Read and reflect'],
      ideaTitles: ['Passage bookmarks'],
      ideaNotes: ['Invite each person to explain why one passage stayed with them.'],
      creatorKey: 'challenge-author-04',
      firstPublishedAt: '2026-08-06T12:00:00.000Z',
      language: 'en',
    },
    {
      name: 'La novela del jueves',
      summary:
        'Una tarde tranquila para terminar una historia y escuchar distintas interpretaciones.',
      eventTitles: ['Comentar el desenlace'],
      ideaTitles: ['Preguntas para conversar'],
      ideaNotes: ['No hace falta terminar el libro para participar.'],
      creatorKey: 'challenge-author-05',
      firstPublishedAt: '2026-10-12T12:00:00.000Z',
      language: 'es',
    },
    {
      name: 'A gathering checklist',
      summary: 'A general meeting plan with a venue, budget, timing, and task list.',
      eventTitles: ['Room setup'],
      ideaTitles: ['Reminder note'],
      ideaNotes: ['A short novel can be an optional conversation topic.'],
      creatorKey: 'challenge-author-06',
      firstPublishedAt: '2026-06-07T12:00:00.000Z',
      language: 'en',
    },
    {
      name: 'Plan de una feria de ciencias',
      summary: 'Organizar mesas, horarios y materiales para mostrar experimentos escolares.',
      eventTitles: ['Preparar carteles'],
      ideaTitles: ['Rincón de demostraciones'],
      ideaNotes: ['Revisar tomas eléctricas y materiales de seguridad.'],
      creatorKey: 'challenge-author-07',
      firstPublishedAt: '2026-05-08T12:00:00.000Z',
      language: 'es',
    },
  ],
  tabletop_games: [
    {
      name: 'Noche de juegos de mesa',
      summary: 'Una velada para aprender un juego de estrategia y compartir botanas.',
      eventTitles: ['Explicar las reglas', 'Partida abierta'],
      ideaTitles: ['Mesa para principiantes'],
      ideaNotes: ['Tener una versión corta para quienes llegan tarde.'],
      creatorKey: 'challenge-author-08',
      firstPublishedAt: '2026-10-04T12:00:00.000Z',
      language: 'es',
    },
    {
      name: 'Strategy board game café',
      summary: 'Teach one tabletop game, then let groups choose a second round.',
      eventTitles: ['Learn the rules', 'Open play'],
      ideaTitles: ['Beginner table'],
      ideaNotes: ['Use a quick reference card so new players can join.'],
      creatorKey: 'challenge-author-09',
      firstPublishedAt: '2026-07-09T12:00:00.000Z',
      language: 'en',
    },
    {
      name: 'Tarde de estrategia y dados',
      summary: 'Probar juegos de tablero cooperativos con partidas breves.',
      eventTitles: ['Aprender el juego', 'Ronda cooperativa'],
      ideaTitles: ['Marcadores de turno'],
      ideaNotes: ['Preparar una hoja de ayuda con los pasos principales.'],
      creatorKey: 'challenge-author-10',
      firstPublishedAt: '2026-09-10T12:00:00.000Z',
      language: 'es',
    },
    {
      name: 'A new tabletop challenge',
      summary: 'Bring a favorite boxed game and invite people to try a new one.',
      eventTitles: ['Choose a game'],
      ideaTitles: ['Team play option'],
      ideaNotes: ['Pair first-time players with someone who knows the rules.'],
      creatorKey: 'challenge-author-11',
      firstPublishedAt: '2026-08-11T12:00:00.000Z',
      language: 'en',
    },
    {
      name: 'Juegos en la biblioteca',
      summary: 'Una reunión para jugar títulos cooperativos y conocer gente nueva.',
      eventTitles: ['Partidas por equipos'],
      ideaTitles: ['Tarjetas de reglas'],
      ideaNotes: ['Dejar espacio para cambiar de mesa entre rondas.'],
      creatorKey: 'challenge-author-12',
      firstPublishedAt: '2026-10-13T12:00:00.000Z',
      language: 'es',
    },
    {
      name: 'Evening meetup planner',
      summary: 'Coordinate a room, budget, schedule, reminders, and cleanup.',
      eventTitles: ['Welcome and check-in'],
      ideaTitles: ['Shared task list'],
      ideaNotes: ['A deck of cards can be an optional icebreaker.'],
      creatorKey: 'challenge-author-13',
      firstPublishedAt: '2026-06-14T12:00:00.000Z',
      language: 'en',
    },
    {
      name: 'Recital de canciones antiguas',
      summary: 'Escuchar interpretaciones acústicas y compartir recuerdos musicales.',
      eventTitles: ['Canciones del barrio'],
      ideaTitles: ['Lista de reproducción'],
      ideaNotes: ['Pedir canciones favoritas antes del encuentro.'],
      creatorKey: 'challenge-author-14',
      firstPublishedAt: '2026-05-15T12:00:00.000Z',
      language: 'es',
    },
  ],
  live_music: [
    {
      name: 'Small-room live music night',
      summary: 'A neighborhood listening session with local performers and a short open set.',
      eventTitles: ['Acoustic set', 'Open mic'],
      ideaTitles: ['Quiet listening corner'],
      ideaNotes: ['Keep the room welcoming for first-time performers.'],
      creatorKey: 'challenge-author-15',
      firstPublishedAt: '2026-10-05T12:00:00.000Z',
      language: 'en',
    },
    {
      name: 'Noche de boleros en vivo',
      summary: 'Un encuentro íntimo para escuchar músicos locales y cantar un estribillo.',
      eventTitles: ['Presentación acústica', 'Micrófono abierto'],
      ideaTitles: ['Rincón para escuchar'],
      ideaNotes: ['Dar la bienvenida a intérpretes que participan por primera vez.'],
      creatorKey: 'challenge-author-16',
      firstPublishedAt: '2026-07-16T12:00:00.000Z',
      language: 'es',
    },
    {
      name: 'Jam session for neighbors',
      summary: 'Musicians rotate through short sets and leave room for a few requests.',
      eventTitles: ['Sound check', 'Shared set'],
      ideaTitles: ['Instrument sign-up'],
      ideaNotes: ['Keep one chair open for someone who wants to join.'],
      creatorKey: 'challenge-author-17',
      firstPublishedAt: '2026-09-17T12:00:00.000Z',
      language: 'en',
    },
    {
      name: 'Concierto acústico del patio',
      summary: 'Escuchar canciones originales en un patio pequeño al atardecer.',
      eventTitles: ['Prueba de sonido', 'Canciones compartidas'],
      ideaTitles: ['Sillas en semicírculo'],
      ideaNotes: ['Dejar un pasillo despejado y bajar el volumen al final.'],
      creatorKey: 'challenge-author-18',
      firstPublishedAt: '2026-08-18T12:00:00.000Z',
      language: 'es',
    },
    {
      name: 'Listening room showcase',
      summary: 'A few short performances with conversation between sets.',
      eventTitles: ['Local songwriter set'],
      ideaTitles: ['Printed set list'],
      ideaNotes: ['Invite performers to share the story behind one song.'],
      creatorKey: 'challenge-author-19',
      firstPublishedAt: '2026-10-19T12:00:00.000Z',
      language: 'en',
    },
    {
      name: 'A simple event run sheet',
      summary: 'Plan a venue, schedule, equipment list, and volunteer shifts.',
      eventTitles: ['Doors open'],
      ideaTitles: ['Setup checklist'],
      ideaNotes: ['A guitar performance could be one optional activity.'],
      creatorKey: 'challenge-author-20',
      firstPublishedAt: '2026-06-20T12:00:00.000Z',
      language: 'en',
    },
    {
      name: 'Partida amistosa de juegos',
      summary: 'Una tarde social para aprender un juego de mesa y tomar café.',
      eventTitles: ['Ronda para principiantes'],
      ideaTitles: ['Equipos equilibrados'],
      ideaNotes: ['Elegir una partida corta para que todos puedan participar.'],
      creatorKey: 'challenge-author-21',
      firstPublishedAt: '2026-05-21T12:00:00.000Z',
      language: 'es',
    },
  ],
  plant_exchange: [
    {
      name: 'Intercambio de esquejes y semillas',
      summary: 'Vecinos comparten plantas, consejos de cultivo y variedades locales.',
      eventTitles: ['Mesa de intercambio', 'Consejos para cuidar plantas'],
      ideaTitles: ['Etiquetas para esquejes'],
      ideaNotes: ['Anotar el nombre de cada planta y la cantidad de luz que necesita.'],
      creatorKey: 'challenge-author-22',
      firstPublishedAt: '2026-10-06T12:00:00.000Z',
      language: 'es',
    },
    {
      name: 'Community seed and cutting swap',
      summary: 'Trade starts from home gardens and share practical growing tips.',
      eventTitles: ['Bring a labeled cutting', 'Plant care exchange'],
      ideaTitles: ['Light and water tags'],
      ideaNotes: ['Write the plant name and its preferred growing conditions.'],
      creatorKey: 'challenge-author-23',
      firstPublishedAt: '2026-07-22T12:00:00.000Z',
      language: 'en',
    },
    {
      name: 'Semillas para el balcón',
      summary: 'Compartir semillas fáciles para cultivar en espacios pequeños.',
      eventTitles: ['Preparar sobres'],
      ideaTitles: ['Calendario de siembra'],
      ideaNotes: ['Elegir plantas que crezcan bien en macetas.'],
      creatorKey: 'challenge-author-24',
      firstPublishedAt: '2026-09-23T12:00:00.000Z',
      language: 'es',
    },
    {
      name: 'Cuttings on the porch',
      summary: 'A small plant exchange with advice for rooting and transplanting.',
      eventTitles: ['Label each start'],
      ideaTitles: ['Rooting station'],
      ideaNotes: ['Bring clean jars and mark the date each cutting was started.'],
      creatorKey: 'challenge-author-25',
      firstPublishedAt: '2026-08-24T12:00:00.000Z',
      language: 'en',
    },
    {
      name: 'Huerto en recipientes',
      summary: 'Una demostración breve para cultivar hierbas en macetas.',
      eventTitles: ['Elegir recipientes'],
      ideaTitles: ['Mezcla de tierra'],
      ideaNotes: ['Mostrar cómo drenar el exceso de agua.'],
      creatorKey: 'challenge-author-26',
      firstPublishedAt: '2026-10-25T12:00:00.000Z',
      language: 'es',
    },
    {
      name: 'Neighborhood event checklist',
      summary: 'A reusable plan for room access, budget, schedule, and reminders.',
      eventTitles: ['Confirm the location'],
      ideaTitles: ['Volunteer roles'],
      ideaNotes: ['A seed packet can be a small thank-you for helpers.'],
      creatorKey: 'challenge-author-27',
      firstPublishedAt: '2026-06-26T12:00:00.000Z',
      language: 'en',
    },
    {
      name: 'Noche de lectura de cuentos',
      summary: 'Compartir relatos cortos y conversar sobre los personajes.',
      eventTitles: ['Leer en voz alta'],
      ideaTitles: ['Tarjetas de personajes'],
      ideaNotes: ['Elegir una historia breve para empezar.'],
      creatorKey: 'challenge-author-28',
      firstPublishedAt: '2026-05-27T12:00:00.000Z',
      language: 'es',
    },
  ],
}

const challengeSeeds: Readonly<Record<PersonalLikeChallengeFamily, string>> = Object.freeze({
  book_circle: 'challenge-book_circle-01',
  tabletop_games: 'challenge-tabletop_games-01',
  live_music: 'challenge-live_music-01',
  plant_exchange: 'challenge-plant_exchange-01',
})

const planRows = Object.entries(familyPlans).flatMap(([family, candidates]) =>
  candidates.map((candidate, index) => {
    const intentFamily = family as PersonalLikeChallengeFamily
    const catalogKey = `challenge-${intentFamily}-${String(index + 1).padStart(2, '0')}`
    return {
      ...candidate,
      catalogKey,
      revision: 1,
      contentHash: createHash('sha256').update(`${catalogKey}:v1`).digest('hex'),
      intentFamily,
      split: 'challenge' as const,
    }
  })
)

export const PERSONAL_LIKE_CHALLENGE_PLANS: readonly PersonalLikeChallengePlan[] =
  Object.freeze(planRows)

const ambiguousFamilyPairs = new Set(['book_circle|tabletop_games', 'live_music|tabletop_games'])

function familyPair(left: PersonalLikeChallengeFamily, right: PersonalLikeChallengeFamily): string {
  return [left, right].sort().join('|')
}

function judgmentFor(
  seedFamily: PersonalLikeChallengeFamily,
  candidateFamily: PersonalLikeChallengeFamily,
  candidateIndex: number
): { judgment: PersonalLikeChallengeJudgment; rationale: string } {
  if (seedFamily === candidateFamily) {
    if (candidateIndex <= 5)
      return {
        judgment: 'relevant',
        rationale: 'Same predeclared intent; candidate offers a concrete variant of that activity.',
      }
    if (candidateIndex === 6)
      return {
        judgment: 'ambiguous',
        rationale:
          'Generic planning content mentions the seed activity only incidentally or describes an adjacent format.',
      }
    return {
      judgment: 'unrelated',
      rationale: 'Different primary activity despite shared general event-planning context.',
    }
  }
  if (ambiguousFamilyPairs.has(familyPair(seedFamily, candidateFamily)))
    return {
      judgment: 'ambiguous',
      rationale: 'Both can be indoor social meetups, but the primary activity differs.',
    }
  return {
    judgment: 'unrelated',
    rationale: 'The authored primary activity and expected participant intent differ.',
  }
}

export const PERSONAL_LIKE_CHALLENGE_PAIRS: readonly PersonalLikeChallengePair[] = Object.freeze(
  Object.values(challengeSeeds).flatMap((seedKey) => {
    const seed = PERSONAL_LIKE_CHALLENGE_PLANS.find((plan) => plan.catalogKey === seedKey)!
    return PERSONAL_LIKE_CHALLENGE_PLANS.filter(
      (candidate) => candidate.catalogKey !== seedKey
    ).map((candidate) => ({
      seedKey,
      candidateKey: candidate.catalogKey,
      ...judgmentFor(
        seed.intentFamily,
        candidate.intentFamily,
        Number(candidate.catalogKey.slice(-2))
      ),
    }))
  })
)

export function personalLikeChallengeCanonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(personalLikeChallengeCanonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${personalLikeChallengeCanonicalJson(record[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

export const PERSONAL_LIKE_CHALLENGE_LOCK = createHash('sha256')
  .update(
    personalLikeChallengeCanonicalJson({
      plans: PERSONAL_LIKE_CHALLENGE_PLANS,
      pairs: PERSONAL_LIKE_CHALLENGE_PAIRS,
    })
  )
  .digest('hex')
