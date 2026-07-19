"use client"
import { useState, useRef } from "react"

type TF = "1D" | "1S" | "1M" | "TUDO"
const TIMEFRAMES: { key: TF; label: string }[] = [
  { key: "1D", label: "1D" },
  { key: "1S", label: "1S" },
  { key: "1M", label: "1M" },
  { key: "TUDO", label: "Tudo" },
]

const TF_CONFIG: Record<TF, { pts: number; vol: number; unit: string; dur: number }> = {
  "1D":   { pts: 48, vol: 11, unit: "h", dur: 24 },
  "1S":   { pts: 56, vol: 16, unit: "d", dur: 7 },
  "1M":   { pts: 64, vol: 20, unit: "d", dur: 30 },
  "TUDO": { pts: 80, vol: 25, unit: "m", dur: 12 },
}

function genData(seed: string, tf: TF, target: number): number[] {
  const { pts, vol } = TF_CONFIG[tf]
  let s = `${seed}${tf}`.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0) >>> 0
  const rng = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000 }
  const result: number[] = []
  let v = 50
  for (let i = 0; i < pts; i++) {
    const t = i / (pts - 1)
    v = Math.max(3, Math.min(97, 50 + (target - 50) * t + (rng() - 0.5) * vol * (1 - t * 0.5)))
    result.push(i === pts - 1 ? target : Math.round(v * 10) / 10)
  }
  return result
}

function makeLine(data: number[], W: number, H: number) {
  const pts: [number, number][] = data.map((v, i) => [(i / (data.length - 1)) * W, H - (v / 100) * H])
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i]
    const cx = ((p[0] + c[0]) / 2).toFixed(1)
    d += ` C ${cx} ${p[1].toFixed(1)},${cx} ${c[1].toFixed(1)},${c[0].toFixed(1)} ${c[1].toFixed(1)}`
  }
  return d
}

function timeLabel(idx: number, total: number, tf: TF): string {
  const { unit, dur } = TF_CONFIG[tf]
  const val = Math.round((1 - idx / (total - 1)) * dur)
  return val === 0 ? "agora" : `${val}${unit}`
}

/**
 * Single probability chart. Line only (no area fill), dotted grid, Y axis on the
 * right in %, timeframe selector, and a top legend with the series name + current %.
 * `seriesColor` overrides the default (green when ≥50, else red) — used to tint a
 * child market with its event's series color.
 */
export default function MarketChart({
  marketId, yesPct, seriesColor, seriesLabel = "Sim",
}: {
  marketId: string; yesPct: number; seriesColor?: string; seriesLabel?: string
}) {
  const [tf, setTf] = useState<TF>("1D")
  const [xh, setXh] = useState<{ x: number; y: number; pct: number; lbl: string } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const W = 600, H = 150

  const data = genData(marketId, tf, yesPct)
  const line = makeLine(data, W, H)
  const clr = seriesColor ?? (yesPct >= 50 ? "#00c076" : "#ff5c5c")
  const displayPct = xh?.pct ?? yesPct

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const rx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const idx = Math.round(rx * (data.length - 1))
    setXh({ x: (idx / (data.length - 1)) * W, y: H - (data[idx] / 100) * H, pct: Math.round(data[idx]), lbl: timeLabel(idx, data.length, tf) })
  }

  return (
    <div>
      {/* Top legend: series name + current % */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: clr }} />
          <span className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>{seriesLabel}</span>
          <span className="text-[26px] font-bold tabular-nums leading-none" style={{ color: "var(--text-0)" }}>
            {displayPct}%
          </span>
          <span className="text-[11px]" style={{ color: "var(--text-2)" }}>
            {xh ? `${xh.lbl} atrás` : "agora"}
          </span>
        </div>

        {/* Timeframe selector */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--card-2)" }}>
          {TIMEFRAMES.map((t) => (
            <button key={t.key} onClick={() => { setTf(t.key); setXh(null) }}
              className="px-2.5 py-1.5 text-[11px] font-semibold transition-all"
              style={tf === t.key ? { background: "var(--card)", color: "var(--text-0)" } : { color: "var(--text-2)" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart with right-side Y axis */}
      <div className="flex">
        <div className="flex-1 min-w-0">
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
            className="w-full cursor-crosshair select-none" style={{ height: H, display: "block" }}
            onPointerMove={onMove} onPointerLeave={() => setXh(null)}>
            {/* Dotted horizontal grid */}
            {[0.25, 0.5, 0.75].map((v) => (
              <line key={v} x1={0} y1={v * H} x2={W} y2={v * H}
                stroke="var(--border-2)" strokeWidth="1" strokeDasharray="2,4" />
            ))}
            {/* Line only — no filled area */}
            <path d={line} fill="none" stroke={clr} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Crosshair */}
            {xh && (
              <>
                <line x1={xh.x} y1={0} x2={xh.x} y2={H} stroke={clr} strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
                <circle cx={xh.x} cy={xh.y} r={4} fill={clr} />
                <circle cx={xh.x} cy={xh.y} r={8} fill={clr} opacity="0.18" />
              </>
            )}
          </svg>
        </div>

        {/* Y-axis on the RIGHT, in % */}
        <div className="flex flex-col justify-between pl-2 flex-shrink-0" style={{ height: H }}>
          {[100, 75, 50, 25, 0].map((v) => (
            <span key={v} className="text-[9px] tabular-nums leading-none" style={{ color: "var(--text-2)" }}>{v}%</span>
          ))}
        </div>
      </div>
    </div>
  )
}
