/**
 * Deterministic avatar fallback (Polymarket-style conic blob) shared by the
 * profile page and the navbar so a user without a photo looks identical in both
 * places. Seed with the username so the colour + letter always agree.
 */
export function gradient(seed: string): string {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const a = h % 360, b = (h >> 3) % 360
  return `conic-gradient(from ${h % 360}deg, hsl(${a},70%,55%), hsl(${b},75%,50%), hsl(${(a + 120) % 360},70%,55%), hsl(${a},70%,55%))`
}

/** First letter for the avatar, or "?" when we don't have a real handle yet. */
export function avatarInitial(handle: string | null | undefined): string {
  const h = (handle ?? "").trim()
  if (!h || h[0] === ".") return "?"
  return h[0].toUpperCase()
}
