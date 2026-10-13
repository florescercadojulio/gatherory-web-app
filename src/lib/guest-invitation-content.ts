import { z } from "zod"

const webURL = z.url().refine((value) => ["https:", "http:"].includes(new URL(value).protocol))
const track = z.object({
  providerID: z.string(), catalogID: z.string(), title: z.string(), artistName: z.string(),
  albumTitle: z.string().nullable().optional(), artworkURL: z.string().nullable().optional(),
  previewURL: webURL.nullable().optional(), externalURL: webURL.nullable().optional(),
  isrc: z.string().nullable().optional(), duration: z.number().nonnegative().nullable().optional(),
})

/** Allowlist, not a copy of a planning configuration. Unknown fields stay private. */
export function guestIdeaContent(category: string, configuration: unknown) {
  const record = (value: unknown): Record<string, unknown> =>
    value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const native = record(record(configuration).native)
  const values = record(record(native[category])._0)
  const tracks = category === "music" && Array.isArray(values.tracks)
    ? values.tracks.flatMap((value) => {
        const parsed = track.safeParse(value)
        return parsed.success ? [parsed.data] : []
      }) : []
  const url = category === "link" ? webURL.safeParse(values.url) : null
  const publicKeys: Record<string, string[]> = {
    attire: ["style", "restrictions"], venue: ["setting", "capacity", "area"],
    food: ["type", "servings", "dietaryNotes"], flowers: ["focus", "palette"],
    photography: ["style", "coverageHours", "priorities"], decor: ["focus", "paletteOrMaterials"],
    invitations: ["format", "quantity", "productionNotes"], honeymoon: ["style", "destination", "nights"],
  }
  const fields = Object.fromEntries((publicKeys[category] ?? []).flatMap((key) =>
    typeof values[key] === "string" || typeof values[key] === "number" || values[key] === null ? [[key, values[key]]] : []))
  const safeConfiguration = category === "music" ? { music: { _0: { tracks } } }
    : category === "link" && url?.success ? { link: { _0: { url: url.data } } }
    : Object.keys(fields).length ? { [category]: { _0: fields } } : { standard: {} }
  return { tracks, linkURL: url?.success ? url.data : null, configuration: safeConfiguration }
}
