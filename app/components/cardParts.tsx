import Link from "next/link"
import { OutcomeThumb } from "@/app/components/OutcomeThumb"

/** "R$ 5.822.600" — no decimals. */
export function volLabel(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

/**
 * One result row: thumb (per-line image or series block), name with series
 * underline, decimal odds, prob pill. `pct === null` means there is no pool yet
 * → muted "—" pill (no invented price). `imageUrl` renders in place of the block.
 */
export function OutcomeRow({ href, blockColor, name, underline, pct, odds, imageUrl }: {
  href: string; blockColor: string; name: string; underline: string; pct: number | null; odds: string; imageUrl?: string | null
}) {
  const muted = pct === null
  return (
    <div className="flex items-center gap-3">
      <OutcomeThumb imageUrl={imageUrl} blockColor={blockColor} />
      <span className="text-[15px]" style={{ color: "var(--text-0)", fontWeight: 500 }}>
        <span style={{ borderBottom: `2px solid ${underline}`, paddingBottom: 1 }}>{name}</span>
      </span>
      <span className="ml-auto text-[13px] tabular-nums text-right" style={{ color: "var(--text-2)", width: 56 }}>{odds}</span>
      <Link href={href} className={`prob-pill flex-shrink-0${muted ? " prob-pill-muted" : ""}`} style={{ minWidth: 64, pointerEvents: "auto" }}>
        {muted ? "—" : `${pct}%`}
      </Link>
    </div>
  )
}
