"use client"
import { useEffect, useRef, useState } from "react"
import { animate } from "framer-motion"

interface Tick {
  price: number; change24h: number; high24h: number; low24h: number; vol24h: number
}

const SVG_W = 600, SVG_H = 90, PAD = 4

function makePaths(prices: number[]) {
  if (prices.length < 2) return { line: "", area: "" }
  const min = Math.min(...prices), max = Math.max(...prices), range = max - min || 1
  const pts = prices.map((p, i) => ({
    x: PAD + (i / (prices.length - 1)) * (SVG_W - PAD * 2),
    y: PAD + (1 - (p - min) / range) * (SVG_H - PAD * 2),
  }))
  let line = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i - 1].x + pts[i].x) / 2
    line += ` C ${cx.toFixed(1)},${pts[i - 1].y.toFixed(1)} ${cx.toFixed(1)},${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`
  }
  return { line, area: `${line} L ${pts[pts.length - 1].x} ${SVG_H} L ${pts[0].x} ${SVG_H} Z` }
}

function fmt(n: number) { return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }
function fmtBig(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  return `$${(n / 1e6).toFixed(0)}M`
}

export default function BTCLiveWidget({ yesPct, noPct }: { yesPct: number; noPct: number }) {
  const [connected, setConnected] = useState(false)
  const [time, setTime]           = useState("")

  /* DOM refs — zero re-renders */
  const priceRef    = useRef<HTMLSpanElement>(null)
  const changeRef   = useRef<HTMLSpanElement>(null)
  const arrowRef    = useRef<HTMLSpanElement>(null)
  const highRef     = useRef<HTMLSpanElement>(null)
  const lowRef      = useRef<HTMLSpanElement>(null)
  const volRef      = useRef<HTMLSpanElement>(null)
  const panelRef    = useRef<HTMLDivElement>(null)
  const flashTimer  = useRef<ReturnType<typeof setTimeout>>()

  /* SVG refs */
  const lineRef     = useRef<SVGPathElement>(null)
  const areaRef     = useRef<SVGPathElement>(null)
  const dotRef      = useRef<SVGCircleElement>(null)

  /* Crosshair refs */
  const xhLineRef   = useRef<SVGLineElement>(null)
  const xhDotRef    = useRef<SVGCircleElement>(null)
  const tooltipRef  = useRef<HTMLDivElement>(null)
  const wrapRef     = useRef<HTMLDivElement>(null)

  const prices      = useRef<number[]>([])
  const times       = useRef<number[]>([])
  const prevPrice   = useRef(0)
  const animCtrl    = useRef<{ stop: () => void } | null>(null)
  const positive    = useRef(true)

  function updateChart(ps: number[], pos: boolean) {
    positive.current = pos
    if (ps.length < 2) return
    const { line, area } = makePaths(ps)
    const clr = pos ? "#00c076" : "#ff5c5c"
    const fill = pos ? "rgba(0,192,118,0.12)" : "rgba(255,92,92,0.10)"
    lineRef.current?.setAttribute("d", line)
    areaRef.current?.setAttribute("d", area)
    lineRef.current?.setAttribute("stroke", clr)
    areaRef.current?.setAttribute("fill", fill)
    xhDotRef.current?.setAttribute("stroke", clr)
    const min = Math.min(...ps), max = Math.max(...ps), range = max - min || 1
    const lx = SVG_W - PAD
    const ly = PAD + (1 - (ps[ps.length - 1] - min) / range) * (SVG_H - PAD * 2)
    dotRef.current?.setAttribute("cx", String(lx))
    dotRef.current?.setAttribute("cy", String(ly))
    dotRef.current?.setAttribute("fill", clr)
    dotRef.current?.style.setProperty("filter", `drop-shadow(0 0 6px ${clr})`)
  }

  function flash(pos: boolean) {
    if (!panelRef.current) return
    clearTimeout(flashTimer.current)
    panelRef.current.style.transition = "background 0.08s"
    panelRef.current.style.background = pos ? "rgba(0,192,118,0.08)" : "rgba(255,92,92,0.08)"
    flashTimer.current = setTimeout(() => {
      if (panelRef.current) {
        panelRef.current.style.transition = "background 0.8s"
        panelRef.current.style.background = ""
      }
    }, 700)
  }

  function handlePointer(clientX: number, rect: DOMRect) {
    const ps = prices.current, ts = times.current
    if (ps.length < 2) return
    const relX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const idx  = Math.round(relX * (ps.length - 1))
    const p    = ps[idx], t = ts[idx] ?? Date.now()
    const min  = Math.min(...ps), max = Math.max(...ps), range = max - min || 1
    const x    = PAD + (idx / (ps.length - 1)) * (SVG_W - PAD * 2)
    const y    = PAD + (1 - (p - min) / range) * (SVG_H - PAD * 2)
    const clr  = positive.current ? "#00c076" : "#ff5c5c"
    if (xhLineRef.current) { xhLineRef.current.setAttribute("x1", String(x)); xhLineRef.current.setAttribute("x2", String(x)); xhLineRef.current.style.opacity = "1" }
    if (xhDotRef.current)  { xhDotRef.current.setAttribute("cx", String(x));  xhDotRef.current.setAttribute("cy", String(y));  xhDotRef.current.style.opacity = "1" }
    if (tooltipRef.current) {
      const d = new Date(t)
      tooltipRef.current.innerHTML = `<span style="color:${clr};font-weight:700;font-size:12px">$${fmt(Math.round(p))}</span><span style="display:block;color:var(--text-2);font-size:9px;margin-top:1px">${d.toLocaleTimeString("pt-BR")}</span>`
      tooltipRef.current.style.opacity = "1"
      const flip = relX > 0.65
      tooltipRef.current.style.left  = flip ? "auto" : `${relX * 100}%`
      tooltipRef.current.style.right = flip ? `${(1 - relX) * 100}%` : "auto"
      tooltipRef.current.style.transform = flip ? "translateX(50%)" : "translateX(-50%)"
    }
  }

  function hidePointer() {
    if (xhLineRef.current)  xhLineRef.current.style.opacity  = "0"
    if (xhDotRef.current)   xhDotRef.current.style.opacity   = "0"
    if (tooltipRef.current) tooltipRef.current.style.opacity = "0"
  }

  /* Touch listener (non-passive) */
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      e.preventDefault()
      handlePointer(e.touches[0].clientX, el.getBoundingClientRect())
    }
    el.addEventListener("touchmove", onMove, { passive: false })
    el.addEventListener("touchend", hidePointer)
    return () => { el.removeEventListener("touchmove", onMove); el.removeEventListener("touchend", hidePointer) }
  }, [])

  /* Initial CoinGecko load */
  useEffect(() => {
    fetch("/api/crypto/btc").then(r => r.json()).then(data => {
      if (data.prices?.length) {
        prices.current = data.prices
        const now = Date.now()
        times.current = data.prices.map((_: number, i: number) => now - (data.prices.length - 1 - i) * 3_600_000)
        updateChart(prices.current, (data.change24h ?? 0) >= 0)
      }
      if (data.price && priceRef.current) { prevPrice.current = data.price; priceRef.current.textContent = `$${fmt(data.price)}` }
      if (data.change24h != null && changeRef.current && arrowRef.current) {
        const pos = data.change24h >= 0
        arrowRef.current.textContent  = pos ? "▲" : "▼"
        changeRef.current.textContent = ` ${Math.abs(data.change24h).toFixed(2)}%`
        const clr = pos ? "var(--green)" : "var(--red)"
        arrowRef.current.style.color  = clr
        changeRef.current.style.color = clr
      }
      if (data.vol24h   && volRef.current)  volRef.current.textContent  = fmtBig(data.vol24h)
      if (data.prices?.length) {
        const mn = Math.min(...data.prices), mx = Math.max(...data.prices)
        if (lowRef.current)  lowRef.current.textContent  = `$${fmt(mn)}`
        if (highRef.current) highRef.current.textContent = `$${fmt(mx)}`
      }
    }).catch(() => {})
  }, [])

  /* Binance WebSocket */
  useEffect(() => {
    let ws: WebSocket, dead = false, retry: ReturnType<typeof setTimeout>
    function connect() {
      ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@ticker")
      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data)
          const tick: Tick = {
            price: parseFloat(d.c), change24h: parseFloat(d.P),
            vol24h: parseFloat(d.q), high24h: parseFloat(d.h), low24h: parseFloat(d.l),
          }
          setConnected(true)
          setTime(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))

          const pos = tick.change24h >= 0
          const prev = prevPrice.current

          animCtrl.current?.stop()
          if (prev > 0 && priceRef.current) {
            animCtrl.current = animate(prev, tick.price, {
              duration: 0.4, ease: "easeOut",
              onUpdate: (v: number) => { if (priceRef.current) priceRef.current.textContent = `$${fmt(Math.round(v))}` },
            })
          } else if (priceRef.current) {
            priceRef.current.textContent = `$${fmt(tick.price)}`
          }
          if (prev !== 0) flash(tick.price >= prev)
          prevPrice.current = tick.price

          if (changeRef.current && arrowRef.current) {
            arrowRef.current.textContent  = pos ? "▲" : "▼"
            changeRef.current.textContent = ` ${Math.abs(tick.change24h).toFixed(2)}%`
            const clr = pos ? "var(--green)" : "var(--red)"
            arrowRef.current.style.color  = clr
            changeRef.current.style.color = clr
          }
          if (volRef.current)  volRef.current.textContent  = fmtBig(tick.vol24h)
          if (highRef.current) highRef.current.textContent = `$${fmt(tick.high24h)}`
          if (lowRef.current)  lowRef.current.textContent  = `$${fmt(tick.low24h)}`

          prices.current = [...prices.current, tick.price].slice(-120)
          times.current  = [...times.current, Date.now()].slice(-120)
          updateChart(prices.current, pos)
        } catch {}
      }
      ws.onclose = () => { if (!dead) retry = setTimeout(connect, 3000) }
      ws.onerror = () => ws?.close()
    }
    connect()
    return () => { dead = true; clearTimeout(retry); ws?.close() }
  }, [])

  return (
    <div
      className="rounded-2xl overflow-hidden mb-5"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          {/* BTC icon */}
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(145deg, #fb923c, #f97316, #ea580c)", boxShadow: "0 3px 12px rgba(249,115,22,0.3)" }}
          >
            <span className="text-white font-black text-base leading-none" style={{ fontFamily: "serif" }}>₿</span>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "var(--text-2)" }}>
              BTC / USD · Tempo Real
            </p>
            <div className="flex items-baseline gap-1.5">
              <span ref={priceRef} className="text-xl font-black tabular-nums leading-none" style={{ color: "var(--text-0)", letterSpacing: "-0.02em" }}>—</span>
              <span ref={arrowRef} className="text-xs font-bold" style={{ color: "var(--text-2)" }} />
              <span ref={changeRef} className="text-xs font-semibold" style={{ color: "var(--text-2)" }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {time && <span className="text-[9px] tabular-nums" style={{ color: "var(--text-2)" }}>{time}</span>}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70" style={{ backgroundColor: "var(--green)" }} />}
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: connected ? "var(--green)" : "var(--text-2)" }} />
            </span>
            <span className="text-[9px] font-semibold" style={{ color: connected ? "var(--green)" : "var(--text-2)" }}>
              {connected ? "AO VIVO" : "conectando..."}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div ref={panelRef}>
        <div
          ref={wrapRef}
          className="relative cursor-crosshair select-none px-4 pt-3 pb-2"
          style={{ height: 110 }}
          onMouseMove={(e) => handlePointer(e.clientX, e.currentTarget.getBoundingClientRect())}
          onMouseLeave={hidePointer}
        >
          {/* Tooltip */}
          <div
            ref={tooltipRef}
            className="absolute top-1 z-20 pointer-events-none rounded-xl px-2.5 py-1.5 opacity-0 whitespace-nowrap"
            style={{
              background: "var(--card-2)",
              border: "1px solid var(--border-2)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              transition: "opacity 0.1s",
            }}
          />
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="none"
            className="w-full h-full"
            style={{ display: "block" }}
          >
            {[0.33, 0.66].map((f) => (
              <line key={f} x1={PAD} x2={SVG_W - PAD} y1={f * SVG_H} y2={f * SVG_H}
                stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            ))}
            <path ref={areaRef} d="" fill="rgba(0,192,118,0.10)" />
            <path ref={lineRef} d="" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" />
            <line ref={xhLineRef} x1="0" x2="0" y1={PAD} y2={SVG_H - PAD}
              stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3,3" opacity="0" style={{ transition: "opacity 0.1s" }} />
            <circle ref={xhDotRef} cx="0" cy="0" r="4"
              fill="transparent" stroke="var(--green)" strokeWidth="2" opacity="0" style={{ transition: "opacity 0.1s" }} />
            <circle ref={dotRef} cx={SVG_W - PAD} cy={SVG_H / 2} r="3.5" fill="var(--green)"
              style={{ filter: "drop-shadow(0 0 5px var(--green))" }} />
          </svg>
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-3 divide-x"
          style={{ borderTop: "1px solid var(--border)", divideColor: "var(--border)" }}
        >
          {[
            { label: "Máx. 24h", ref: highRef },
            { label: "Mín. 24h", ref: lowRef  },
            { label: "Vol. 24h", ref: volRef   },
          ].map(({ label, ref: r }) => (
            <div key={label} className="px-4 py-3" style={{ borderRight: "1px solid var(--border)" }}>
              <p className="text-[8px] uppercase tracking-widest font-semibold mb-1" style={{ color: "var(--text-2)" }}>{label}</p>
              <span ref={r} className="text-xs font-bold tabular-nums" style={{ color: "var(--text-0)" }}>—</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current odds */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex justify-between text-[10px] font-semibold mb-2" style={{ color: "var(--text-2)" }}>
          <span style={{ color: "var(--green)" }}>PARA CIMA · {yesPct}%</span>
          <span style={{ color: "var(--red)" }}>PARA BAIXO · {noPct}%</span>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "var(--red-dim)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${yesPct}%`, background: "linear-gradient(90deg, var(--green), #00e090)" }}
          />
        </div>
      </div>
    </div>
  )
}
