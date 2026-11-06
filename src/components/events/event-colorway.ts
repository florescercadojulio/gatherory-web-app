const colorways = ['coral', 'violet', 'mint', 'sky'] as const

/** Keep an event's visual identity consistent between its card and detail page. */
export function eventColorway(eventId: string) {
  let hash = 0
  for (const character of eventId.toLowerCase()) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }
  return colorways[hash % colorways.length]!
}
