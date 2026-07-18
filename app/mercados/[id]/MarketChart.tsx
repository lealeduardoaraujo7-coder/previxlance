"use client"
import { useState, useRef } from "react"

type TF = "1H" | "24H" | "7D" | "30D" | "ALL"
const TIMEFRAMES: TF[] = ["1H", "24H", "7D", "30D", "ALL"]

const TF_CONFIG: Record<TF, { pts: number; vol: number; unit: string; dur: number }> = {
  "1H":  { pts: 30, vol: 6,  unit: "min", dur: 60  },
  "24H": { pts: 48, vol: 11, unit: "h",   dur: 24  },
  "7D":  { pts: 56, vol: 16, unit: "d",   dur: 7   },
  "30D": { pts: 64, vol: 20, unit: "d",   dur: 30  },
  "ALL": { pts: 80, vol: 25, unit: "m",   dur: 12  },
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

function makePaths(data: number[], W: number, H: number) {
  const pts: [number, number][] = data.map((v, i) => [(i / (data.length - 1)) * W, H - (v / 100) * H])
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i]
    const cx = ((p[0] + c[0]) / 2).toFixed(1)
    d += ` C ${cx} ${p[1].toFixed(1)},${cx} ${c[1].toFixed(1)},${c[0].toFixed(1)} ${c[1].toFixed(1)}`
  }
  return { line: d, area: `${d} L ${W} ${H} L 0 ${H} Z` }
}

function timeLabel(idx: number, total: number, tf: TF): string {
  const { unit, dur } = TF_CONFIG[tf]
  const pct = 1 - idx / (total - 1)
  const val = Math.round(pct * dur)
  return val === 0 ? "agora" : `${val}${unit}`
}

export default function MarketChart({ marketId, yesPct }: { marketId: string; yesPct: number }) {
  const [tf, setTf] = useState<TF>("24H")
  const [xh, setXh] = useState<{ x: number; y: number; pct: number; lbl: string } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const W = 600, H = 150

  const data = genData(marketId, tf, yesPct)
  const { line, area } = makePaths(data, W, H)
  const positive = yesPct >= 50
  const clr = positive ? "#00c076" : "#ff5c5c"
  const change = (yesPct - data[0])
  const changeAbs = Math.abs(change).toFixed(1)
  const gradId = `cg${marketId.replace(/[^a-z0-9]/gi, "").slice(-8)}`

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const rx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const idx = Math.round(rx * (data.length - 1))
    setXh({
      x: (idx / (data.length - 1)) * W,
      y: H - (data[idx] / 100) * H,
      pct: Math.round(data[idx]),
      lbl: timeLabel(idx, data.length, tf),
    })
  }

  const displayPct = xh?.pct ?? yesPct

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[34px] font-black tabular-nums leading-none" style={{ color: "var(--text-0)" }}>
              {displayPct}%
            </span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{
              background: change >= 0 ? "var(--green-dim)" : "var(--red-dim)",
              color: change >= 0 ? "var(--green)" : "var(--red)",
            }}>
              {change >= 0 ? "+" : "−"}{changeAbs}%
            </span>
          </div>
          <p className="text-[10px] mt-1" style={{ color: "var(--text-2)" }}>
            {xh ? `${xh.lbl} atrás · ${xh.pct}% SIM` : "Probabilidade implícita · SIM"}
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--card-2)" }}>
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              onClick={() => { setTf(t); setXh(null) }}
              className="px-2.5 py-1.5 text-[10px] font-bold transition-all"
              style={tf === t
                ? { background: "var(--green-dim)", color: "var(--green)" }
                : { color: "var(--text-2)" }
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative flex">
        {/* Y-axis */}
        <div className="flex flex-col justify-between pr-2 flex-shrink-0" style={{ height: H }}>
          {[100, 75, 50, 25].map((v) => (
            <span key={v} className="text-[8px] tabular-nums leading-none" style={{ color: "var(--text-2)" }}>{v}%</span>
          ))}
        </div>

        {/* SVG */}
        <div className="flex-1 min-w-0">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="w-full cursor-crosshair select-none"
            style={{ height: H, display: "block" }}
            onPointerMove={onMove}
            onPointerLeave={() => setXh(null)}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={clr} stopOpacity="0.22" />
                <stop offset="85%" stopColor={clr} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal grid lines */}
            {[0.25, 0.5, 0.75].map((v) => (
              <line key={v} x1={0} y1={v * H} x2={W} y2={v * H}
                stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            ))}

            <path d={area} fill={`url(#${gradId})`} />
            <path d={line} fill="none" stroke={clr} strokeWidth="2" strokeLinecap="round" />

            {/* Crosshair */}
            {xh && (
              <>
                <line x1={xh.x} y1={0} x2={xh.x} y2={H}
                  stroke={clr} strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
                <line x1={0} y1={xh.y} x2={W} y2={xh.y}
                  stroke={clr} strokeWidth="1" strokeDasharray="3,3" opacity="0.25" />
                <circle cx={xh.x} cy={xh.y} r={4} fill={clr} />
                <circle cx={xh.x} cy={xh.y} r={8} fill={clr} opacity="0.18" />
              </>
            )}
          </svg>
        </div>
      </div>

      {/* X-axis hint */}
      <div className="flex justify-between mt-1.5 pl-8">
        <span className="text-[8px]" style={{ color: "var(--text-2)" }}>{timeLabel(0, data.length, tf)} atrás</span>
        <span className="text-[8px]" style={{ color: "var(--text-2)" }}>agora</span>
      </div>
    </div>
  )
}
