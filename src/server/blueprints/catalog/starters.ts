import { weddingBlueprintV1 } from './wedding.v1'
import { birthdayBlueprintV1 } from './birthday.v1'
import { thanksgivingBlueprintV1 } from './thanksgiving.v1'

/** Explicit deployment catalog; importing it never writes or seeds a database. */
export const blueprintStarters = [
  weddingBlueprintV1,
  birthdayBlueprintV1,
  thanksgivingBlueprintV1,
] as const
