"use client"
import { useState } from "react"

/**
 * The 32×22 thumb at the start of an outcome row. Renders the per-line image
 * when present, else the series-colored block. onError cascades down to the
 * block — never the broken-image glyph. This is the ONE place the row image is
 * rendered (OutcomeRow + the event page both use it).
 */
export function OutcomeThumb({ imageUrl, blockColor }: { imageUrl?: string | null; blockColor: string }) {
  const [errored, setErrored] = useState(false)
  const base = { width: 32, height: 22, borderRadius: 3, border: "1px solid var(--border-2)", flexShrink: 0 } as const

  if (imageUrl && !errored) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="" onError={() => setErrored(true)} style={{ ...base, objectFit: "cover", display: "block" }} />
  }
  return <span style={{ ...base, background: blockColor, display: "block" }} />
}
