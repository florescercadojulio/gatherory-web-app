import { createHash } from 'node:crypto'

export type PersonalLikeIntentFamily =
  'wedding' | 'birthday' | 'food_dietary' | 'camping' | 'craft_activity' | 'generic_logistics'

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

const families: Record<
  PersonalLikeIntentFamily,
  {
    split: PersonalLikeFixtureSplit
    candidates: Omit<
      PersonalLikeLabeledPlan,
      'catalogKey' | 'revision' | 'contentHash' | 'intentFamily' | 'split'
    >[]
  }
> = {
  wedding: {
    split: 'development',
    candidates: [
      {
        name: 'Coastal vows and supper',
        summary: 'A small seaside wedding with a sunset ceremony and shared meal.',
        eventTitles: ['Vow ceremony', 'Harbor supper'],
        ideaTitles: ['Lantern aisle'],
        ideaNotes: ['Warm lights along the sand after the vows.'],
        creatorKey: 'author-01',
        firstPublishedAt: '2026-10-02T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Boda en el jardín',
        summary: 'Una boda tranquila con ceremonia al aire libre y cena familiar.',
        eventTitles: ['Ceremonia civil', 'Cena bajo las luces'],
        ideaTitles: ['Flores de temporada'],
        ideaNotes: ['Usar flores locales para decorar las mesas.'],
        creatorKey: 'author-02',
        firstPublishedAt: '2026-07-03T12:00:00.000Z',
        language: 'es',
      },
      {
        name: 'City hall wedding day',
        summary: 'A courthouse ceremony followed by dinner for close friends.',
        eventTitles: ['City hall vows', 'Restaurant dinner'],
        ideaTitles: ['Photo walk'],
        ideaNotes: ['Take portraits in the old arcade nearby.'],
        creatorKey: 'author-03',
        firstPublishedAt: '2026-09-05T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Wedding weekend, together',
        summary: 'Two days for a welcome meal, ceremony, and reception.',
        eventTitles: ['Welcome picnic', 'Wedding ceremony', 'Reception'],
        ideaTitles: ['Quiet room'],
        ideaNotes: ['Keep a calm space available for anyone who needs a break.'],
        creatorKey: 'author-04',
        firstPublishedAt: '2026-08-07T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Una boda bilingüe',
        summary: 'Plan vows and a bilingual reception for two families.',
        eventTitles: ['Ceremonia bilingüe', 'Baile y cena'],
        ideaTitles: ['Programa impreso'],
        ideaNotes: ['Add both languages to the printed schedule.'],
        creatorKey: 'author-05',
        firstPublishedAt: '2026-10-09T12:00:00.000Z',
        language: 'mixed',
      },
      {
        name: 'Backyard vows',
        summary: 'A relaxed wedding in a family garden with a short ceremony.',
        eventTitles: ['Garden ceremony', 'Dinner outdoors'],
        ideaTitles: ['Rain plan'],
        ideaNotes: ['Move the chairs under the covered porch if it rains.'],
        creatorKey: 'author-06',
        firstPublishedAt: '2026-06-11T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Wedding details checklist',
        summary: 'Venue, budget, guest list, schedule, and vendor logistics for a wedding.',
        eventTitles: ['Venue walkthrough'],
        ideaTitles: ['Meal accommodations'],
        ideaNotes: ['Record dietary needs and confirm the menu with the caterer.'],
        creatorKey: 'author-07',
        firstPublishedAt: '2026-10-13T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Celebración para dos familias',
        summary: 'A small ceremony and reception with a shared playlist.',
        eventTitles: ['Ceremonia', 'Recepción'],
        ideaTitles: ['Música compartida'],
        ideaNotes: ['Invite each family to add a favorite song.'],
        creatorKey: 'author-08',
        firstPublishedAt: '2026-05-15T12:00:00.000Z',
        language: 'es',
      },
    ],
  },
  birthday: {
    split: 'development',
    candidates: [
      {
        name: 'Backyard birthday games',
        summary: 'A birthday afternoon with garden games, cake, and a picnic table.',
        eventTitles: ['Birthday lunch', 'Garden games'],
        ideaTitles: ['Build-your-own sundae'],
        ideaNotes: ['Set out toppings and small bowls for the birthday cake.'],
        creatorKey: 'author-02',
        firstPublishedAt: '2026-10-01T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Cumpleaños en casa',
        summary: 'Una fiesta de cumpleaños sencilla con música, pastel y juegos.',
        eventTitles: ['Merienda de cumpleaños'],
        ideaTitles: ['Piñata de papel'],
        ideaNotes: ['Preparar una piñata pequeña y segura para todas las edades.'],
        creatorKey: 'author-09',
        firstPublishedAt: '2026-07-04T12:00:00.000Z',
        language: 'es',
      },
      {
        name: 'Milestone dinner',
        summary: 'Celebrate a fortieth birthday with stories and a favorite meal.',
        eventTitles: ['Family dinner', 'Toast and stories'],
        ideaTitles: ['Memory cards'],
        ideaNotes: ['Ask each guest to write one kind memory.'],
        creatorKey: 'author-10',
        firstPublishedAt: '2026-09-06T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Cumpleaños bilingüe',
        summary: 'A bilingual birthday gathering with games for children and adults.',
        eventTitles: ['Juegos y merienda', 'Birthday cake'],
        ideaTitles: ['Búsqueda del tesoro'],
        ideaNotes: ['Use clues in both languages around the garden.'],
        creatorKey: 'author-11',
        firstPublishedAt: '2026-08-08T12:00:00.000Z',
        language: 'mixed',
      },
      {
        name: 'Birthday picnic',
        summary: 'Bring a blanket, fruit, and cupcakes to a neighborhood park.',
        eventTitles: ['Park picnic'],
        ideaTitles: ['Birthday banner'],
        ideaNotes: ['Make a reusable paper banner together before lunch.'],
        creatorKey: 'author-12',
        firstPublishedAt: '2026-10-10T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Cumpleaños tranquilo',
        summary: 'Una celebración pequeña con pastel, conversación y un paseo.',
        eventTitles: ['Pastel en casa', 'Paseo corto'],
        ideaTitles: ['Lista de canciones'],
        ideaNotes: ['Elegir canciones favoritas de la persona cumpleañera.'],
        creatorKey: 'author-13',
        firstPublishedAt: '2026-06-12T12:00:00.000Z',
        language: 'es',
      },
      {
        name: 'Birthday logistics sheet',
        summary: 'Budget, venue, guest list, food, schedule, reminders, and cleanup plan.',
        eventTitles: ['Room setup'],
        ideaTitles: ['Dietary checklist'],
        ideaNotes: ['Confirm allergies and label every dish before guests arrive.'],
        creatorKey: 'author-14',
        firstPublishedAt: '2026-10-14T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Cumpleaños con amigos',
        summary: 'Una tarde de baile y juegos para celebrar otro año.',
        eventTitles: ['Baile', 'Tarta y café'],
        ideaTitles: ['Tarjetas de deseos'],
        ideaNotes: ['Cada invitado escribe un deseo para el próximo año.'],
        creatorKey: 'author-15',
        firstPublishedAt: '2026-05-16T12:00:00.000Z',
        language: 'es',
      },
    ],
  },
  food_dietary: {
    split: 'development',
    candidates: [
      {
        name: 'Allergy-aware potluck',
        summary: 'A shared meal with clear ingredient labels and safe options.',
        eventTitles: ['Community potluck'],
        ideaTitles: ['Ingredient cards'],
        ideaNotes: ['Mark dairy, nuts, gluten, and vegan dishes clearly.'],
        creatorKey: 'author-03',
        firstPublishedAt: '2026-10-03T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Cena vegetariana',
        summary: 'Una cena sin carne con opciones veganas y etiquetas de ingredientes.',
        eventTitles: ['Cena de temporada'],
        ideaTitles: ['Menú accesible'],
        ideaNotes: ['Preguntar por alergias y separar los utensilios de servicio.'],
        creatorKey: 'author-16',
        firstPublishedAt: '2026-07-05T12:00:00.000Z',
        language: 'es',
      },
      {
        name: 'Gluten-free picnic menu',
        summary: 'Plan a picnic meal with safe substitutions and separate serving tools.',
        eventTitles: ['Lunch at the lake'],
        ideaTitles: ['Safe snack basket'],
        ideaNotes: ['Pack sealed snacks for guests with strict dietary needs.'],
        creatorKey: 'author-17',
        firstPublishedAt: '2026-09-07T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Mesa compartida',
        summary: 'A bilingual potluck where everyone can see ingredients before eating.',
        eventTitles: ['Potluck dinner'],
        ideaTitles: ['Etiquetas bilingües'],
        ideaNotes: ['Write each dish name and allergen note in both languages.'],
        creatorKey: 'author-18',
        firstPublishedAt: '2026-08-09T12:00:00.000Z',
        language: 'mixed',
      },
      {
        name: 'Plant-based brunch',
        summary: 'A weekend brunch with vegan mains, fruit, and coffee.',
        eventTitles: ['Sunday brunch'],
        ideaTitles: ['Oat milk station'],
        ideaNotes: ['Offer separate pitchers to avoid mixing dietary choices.'],
        creatorKey: 'author-19',
        firstPublishedAt: '2026-10-11T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Comida para muchas edades',
        summary: 'Prepare a flexible menu with mild and spicy dishes.',
        eventTitles: ['Family lunch'],
        ideaTitles: ['Tarjetas de ingredientes'],
        ideaNotes: ['List common allergens and vegetarian choices.'],
        creatorKey: 'author-20',
        firstPublishedAt: '2026-06-13T12:00:00.000Z',
        language: 'es',
      },
      {
        name: 'Dietary needs dinner plan',
        summary: 'Venue, schedule, budget, guest list, and a meal that accommodates allergies.',
        eventTitles: ['Dinner service'],
        ideaTitles: ['Separate utensils'],
        ideaNotes: ['Label allergen-safe plates and keep serving spoons separate.'],
        creatorKey: 'author-21',
        firstPublishedAt: '2026-10-15T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Cocina comunitaria',
        summary: 'Una comida para compartir recetas sin gluten y sin lácteos.',
        eventTitles: ['Taller de cocina', 'Comida compartida'],
        ideaTitles: ['Recetario'],
        ideaNotes: ['Anotar ingredientes y alternativas para cada receta.'],
        creatorKey: 'author-22',
        firstPublishedAt: '2026-05-17T12:00:00.000Z',
        language: 'es',
      },
    ],
  },
  camping: {
    split: 'development',
    candidates: [
      {
        name: 'First-time family campout',
        summary: 'A gentle overnight with tent practice, a trail, and campfire snacks.',
        eventTitles: ['Tent setup', 'Short nature walk'],
        ideaTitles: ['Campfire story cards'],
        ideaNotes: ['Bring short stories for after sunset.'],
        creatorKey: 'author-04',
        firstPublishedAt: '2026-10-04T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Acampada junto al lago',
        summary: 'Una noche de camping con una caminata fácil y desayuno al aire libre.',
        eventTitles: ['Montar las tiendas', 'Paseo del lago'],
        ideaTitles: ['Mapa de senderos'],
        ideaNotes: ['Elegir una ruta corta con sombra y baños cercanos.'],
        creatorKey: 'author-23',
        firstPublishedAt: '2026-07-06T12:00:00.000Z',
        language: 'es',
      },
      {
        name: 'Friends at the campground',
        summary: 'Share a campsite, trail time, and a simple meal outdoors.',
        eventTitles: ['Arrival and setup', 'Morning hike'],
        ideaTitles: ['Gear checklist'],
        ideaNotes: ['Check sleeping bags, lanterns, water, and first aid.'],
        creatorKey: 'author-24',
        firstPublishedAt: '2026-09-08T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Campamento mixto',
        summary: 'A weekend camping trip with flexible routes and Spanish-English notes.',
        eventTitles: ['Trail walk', 'Cocina de campamento'],
        ideaTitles: ['Nature bingo'],
        ideaNotes: ['Look for birds and leaves without collecting them.'],
        creatorKey: 'author-25',
        firstPublishedAt: '2026-08-10T12:00:00.000Z',
        language: 'mixed',
      },
      {
        name: 'Backyard campout',
        summary: 'Sleep in a tent at home and make a quiet evening under the stars.',
        eventTitles: ['Backyard tent night'],
        ideaTitles: ['Constellation cards'],
        ideaNotes: ['Print a simple sky map for the month.'],
        creatorKey: 'author-26',
        firstPublishedAt: '2026-10-12T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Ruta y fogata',
        summary: 'Una caminata de día termina con una fogata permitida y comida sencilla.',
        eventTitles: ['Sendero de la mañana', 'Cena al fuego'],
        ideaTitles: ['Seguridad de fogata'],
        ideaNotes: ['Revisar restricciones locales y apagar brasas por completo.'],
        creatorKey: 'author-27',
        firstPublishedAt: '2026-06-14T12:00:00.000Z',
        language: 'es',
      },
      {
        name: 'Outdoor trip logistics',
        summary: 'Budget, location, guest list, weather, gear, and schedule for a group weekend.',
        eventTitles: ['Meet at the trailhead'],
        ideaTitles: ['Dietary and gear notes'],
        ideaNotes: ['Gather food needs and equipment before assigning rides.'],
        creatorKey: 'author-28',
        firstPublishedAt: '2026-10-16T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Caminata para principiantes',
        summary: 'A relaxed camping outing with easy trails and shared breakfast.',
        eventTitles: ['Paseo corto', 'Desayuno al aire libre'],
        ideaTitles: ['Bolsa de primeros auxilios'],
        ideaNotes: ['Include water, bandages, and emergency contact details.'],
        creatorKey: 'author-29',
        firstPublishedAt: '2026-05-18T12:00:00.000Z',
        language: 'es',
      },
    ],
  },
  craft_activity: {
    split: 'development',
    candidates: [
      {
        name: 'A gathering for making things',
        summary: 'A low-key afternoon with time to try a hands-on activity.',
        eventTitles: ['Open studio time'],
        ideaTitles: ['Ceramic painting night'],
        ideaNotes: ['Paint small bowls, then let them dry before taking them home.'],
        creatorKey: 'author-05',
        firstPublishedAt: '2026-10-05T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Taller de grabado',
        summary: 'A creative afternoon with a short printmaking demonstration.',
        eventTitles: ['Estampado en papel'],
        ideaTitles: ['Sellos de hojas'],
        ideaNotes: ['Use washable ink and scrap paper to practice patterns.'],
        creatorKey: 'author-30',
        firstPublishedAt: '2026-07-07T12:00:00.000Z',
        language: 'es',
      },
      {
        name: 'Community craft table',
        summary: 'Bring simple supplies and make cards together at the library.',
        eventTitles: ['Card-making afternoon'],
        ideaTitles: ['Paper collage'],
        ideaNotes: ['Reuse paper scraps and provide child-safe scissors.'],
        creatorKey: 'author-31',
        firstPublishedAt: '2026-09-09T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Noche de arte',
        summary: 'A bilingual open studio with watercolor and quiet music.',
        eventTitles: ['Pintura con acuarela'],
        ideaTitles: ['Tarjetas ilustradas'],
        ideaNotes: ['Make a small set of cards to exchange at the end.'],
        creatorKey: 'author-32',
        firstPublishedAt: '2026-08-11T12:00:00.000Z',
        language: 'mixed',
      },
      {
        name: 'Build a tiny terrarium',
        summary: 'Learn the layers for a small plant terrarium and decorate a jar.',
        eventTitles: ['Terrarium workshop'],
        ideaTitles: ['Moss and stone layers'],
        ideaNotes: ['Use a spoon to add drainage stones below the soil.'],
        creatorKey: 'author-33',
        firstPublishedAt: '2026-10-17T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Costura para principiantes',
        summary: 'Una tarde para practicar puntadas básicas en tela reciclada.',
        eventTitles: ['Primeras puntadas'],
        ideaTitles: ['Bolsa reutilizable'],
        ideaNotes: ['Cortar una bolsa simple y coserla a mano.'],
        creatorKey: 'author-34',
        firstPublishedAt: '2026-06-15T12:00:00.000Z',
        language: 'es',
      },
      {
        name: 'Hands-on activity logistics',
        summary: 'Budget, room setup, participant list, schedule, materials, and cleanup.',
        eventTitles: ['Supply setup'],
        ideaTitles: ['Accessible work table'],
        ideaNotes: ['Keep materials labeled and leave room for different hand movements.'],
        creatorKey: 'author-35',
        firstPublishedAt: '2026-10-18T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Pintar macetas',
        summary: 'Decorate small flower pots and trade plant-care tips.',
        eventTitles: ['Pintura de macetas'],
        ideaTitles: ['Colores resistentes'],
        ideaNotes: ['Choose non-toxic paint and allow time to dry.'],
        creatorKey: 'author-36',
        firstPublishedAt: '2026-05-19T12:00:00.000Z',
        language: 'es',
      },
      {
        name: 'An easy afternoon workshop',
        summary: 'A quiet hands-on session where everyone can make one small keepsake.',
        eventTitles: ['Open studio hours'],
        ideaTitles: ['Choose a small project'],
        ideaNotes: [
          'Paint ceramic bowls and mugs with underglaze, then let each piece dry before taking it home.',
        ],
        creatorKey: 'author-65',
        firstPublishedAt: '2026-10-21T12:00:00.000Z',
        language: 'en',
      },
    ],
  },
  generic_logistics: {
    split: 'development',
    candidates: [
      {
        name: 'Simple event checklist',
        summary: 'A reusable checklist for venue, date, schedule, budget, and reminders.',
        eventTitles: ['Confirm location'],
        ideaTitles: ['Guest list'],
        ideaNotes: ['Write down names, dietary needs, and contact details.'],
        creatorKey: 'author-06',
        firstPublishedAt: '2026-10-06T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Lista para reuniones',
        summary: 'Organiza el lugar, la fecha, el presupuesto, las tareas y los avisos.',
        eventTitles: ['Confirmar horario'],
        ideaTitles: ['Notas de asistentes'],
        ideaNotes: ['Guardar preferencias de comida y necesidades de acceso.'],
        creatorKey: 'author-37',
        firstPublishedAt: '2026-07-08T12:00:00.000Z',
        language: 'es',
      },
      {
        name: 'Plan a gathering from scratch',
        summary:
          'Coordinate logistics for a group: schedule, location, budget, invitations, and cleanup.',
        eventTitles: ['Room preparation'],
        ideaTitles: ['Accessibility notes'],
        ideaNotes: ['Ask about seating, dietary needs, transport, and timing.'],
        creatorKey: 'author-38',
        firstPublishedAt: '2026-09-10T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Planning notes template',
        summary: 'A general framework for dividing tasks and tracking decisions.',
        eventTitles: ['Check-in meeting'],
        ideaTitles: ['Task board'],
        ideaNotes: ['List owners, due dates, budget changes, and logistics.'],
        creatorKey: 'author-39',
        firstPublishedAt: '2026-08-12T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Meetup coordination',
        summary: 'Choose a place, set a date, notify people, and make a basic run of show.',
        eventTitles: ['Arrival window', 'Wrap-up'],
        ideaTitles: ['Reminder message'],
        ideaNotes: ['Send the address and a reminder the day before.'],
        creatorKey: 'author-40',
        firstPublishedAt: '2026-10-19T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Notas de logística',
        summary: 'Coordina el transporte, el horario, el presupuesto y las tareas.',
        eventTitles: ['Revisar espacio'],
        ideaTitles: ['Lista de compras'],
        ideaNotes: ['Anotar materiales, precios y responsables.'],
        creatorKey: 'author-41',
        firstPublishedAt: '2026-06-16T12:00:00.000Z',
        language: 'es',
      },
      {
        name: 'Long-form planning notes',
        summary:
          'Schedule, venue, budget, guests, reminders, logistics, dietary needs, setup, transport, vendor follow-up, contingency plans, accessible seating, cleanup assignments, and a repeating checklist for every gathering.',
        eventTitles: ['Operations review'],
        ideaTitles: ['Repeat the checklist'],
        ideaNotes: [
          'Budget budget schedule schedule guest guest venue venue logistics logistics dietary needs dietary needs transport transport setup cleanup reminders.',
        ],
        creatorKey: 'author-42',
        firstPublishedAt: '2026-10-20T12:00:00.000Z',
        language: 'en',
      },
      {
        name: 'Planning de baja información',
        summary: 'Organiza un encuentro: fecha, sitio, horario y presupuesto.',
        eventTitles: [],
        ideaTitles: ['Mensaje de confirmación'],
        ideaNotes: ['Compartir dirección y hora.'],
        creatorKey: 'author-43',
        firstPublishedAt: '2026-05-20T12:00:00.000Z',
        language: 'und',
      },
    ],
  },
}

const ambiguousFamilyPairs = new Set([
  'birthday|craft_activity',
  'birthday|food_dietary',
  'camping|food_dietary',
  'food_dietary|generic_logistics',
])

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

export const PERSONAL_LIKE_DEVELOPMENT_PLANS: readonly PersonalLikeLabeledPlan[] =
  Object.freeze(plans)

export const PERSONAL_LIKE_DEVELOPMENT_SEEDS: Readonly<Record<PersonalLikeIntentFamily, string>> =
  Object.freeze(
    Object.fromEntries(
      Object.keys(families).map((family) => [family, `synthetic-${family}-01`])
    ) as Record<PersonalLikeIntentFamily, string>
  )

export const PERSONAL_LIKE_DEVELOPMENT_PAIRS: readonly PersonalLikeLabeledPair[] = Object.freeze(
  PERSONAL_LIKE_DEVELOPMENT_PLANS.flatMap((seed) => {
    if (PERSONAL_LIKE_DEVELOPMENT_SEEDS[seed.intentFamily] !== seed.catalogKey) return []
    return PERSONAL_LIKE_DEVELOPMENT_PLANS.filter(
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

export const PERSONAL_LIKE_DEVELOPMENT_LOCK = createHash('sha256')
  .update(
    personalLikeFixtureCanonicalJson({
      plans: PERSONAL_LIKE_DEVELOPMENT_PLANS,
      pairs: PERSONAL_LIKE_DEVELOPMENT_PAIRS,
    })
  )
  .digest('hex')
