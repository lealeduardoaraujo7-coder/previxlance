"use client"
import { useState } from "react"
import Image from "next/image"
import { Landmark, Trophy, TrendingUp, Clapperboard, Gamepad2, HelpCircle, type LucideIcon } from "lucide-react"

/**
 * Lucide icon per known category slug (graceful fallback for the tinted icon).
 * New categories created by the admin fall back to HelpCircle. The tint COLOR
 * always comes from the DB (Category.color), so this map only picks the glyph.
 */
const SLUG_ICON: Record<string, { icon: LucideIcon; fg: string }> = {
  politica:       { icon: Landmark,     fg: "#1d4ed8" },
  futebol:        { icon: Trophy,       fg: "#15803d" },
  economia:       { icon: TrendingUp,   fg: "#b45309" },
  entretenimento: { icon: Clapperboard, fg: "#7e22ce" },
  esportes:       { icon: Gamepad2,     fg: "#0369a1" },
  outros:         { icon: HelpCircle,   fg: "#4b5563" },
}

type CategoryLike = { slug?: string | null; imageUrl?: string | null; color?: string | null } | null | undefined

/**
 * Image source priority (item 4): item image → category image → lucide icon on
 * the category's tint. onError cascades down a level; the broken-image glyph is
 * never shown.
 */
export default function MarketImage({ imageUrl, category, size = 48 }: {
  imageUrl?: string | null
  category?: CategoryLike
  size?: number
}) {
  const [itemErr, setItemErr] = useState(false)
  const [catErr, setCatErr] = useState(false)

  const itemSrc = imageUrl && !itemErr ? imageUrl : null
  const catSrc = category?.imageUrl && !catErr ? category.imageUrl : null

  const box = {
    width: size, height: size, borderRadius: 8,
    border: "1px solid var(--border)", overflow: "hidden", flexShrink: 0,
  } as const

  if (itemSrc) {
    return (
      <div style={box}>
        <Image src={itemSrc} alt="" width={size} height={size} onError={() => setItemErr(true)}
          style={{ width: size, height: size, objectFit: "cover", display: "block" }} />
      </div>
    )
  }
  if (catSrc) {
    return (
      <div style={box}>
        <Image src={catSrc} alt="" width={size} height={size} onError={() => setCatErr(true)}
          style={{ width: size, height: size, objectFit: "cover", display: "block" }} />
      </div>
    )
  }

  const glyph = SLUG_ICON[category?.slug ?? "outros"] ?? { icon: HelpCircle, fg: "#6b7280" }
  const Icon = glyph.icon
  return (
    <div style={{ ...box, background: category?.color ?? "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={Math.round(size * 0.5)} color={glyph.fg} strokeWidth={2} />
    </div>
  )
}
