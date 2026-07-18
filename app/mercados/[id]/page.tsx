import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import BetForm from "./BetForm"
import CommentSection from "./CommentSection"
import SaveButton from "./SaveButton"
import MarketChart from "./MarketChart"
import BTCLiveWidget from "./BTCLiveWidget"

/* ── Helpers ─────────────────────────────────────────────────────────── */
function timeAgo(date: Date | string) {
  const diff = Date.now() - new Date(date).getTime()
  if (diff < 60_000) return "agora"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m atrás`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h atrás`
  return `${Math.floor(diff / 86_400_000)}d atrás`
}

function brl(cents: number) {
  const n = cents / 100
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `R$${(n / 1_000).toFixed(0)}K`
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function timeLeft(d: Date | string) {
  const diff = new Date(d).getTime() - Date.now()
  if (diff <= 0) return "Encerrado"
  const days = Math.floor(diff / 86_400_000)
  if (days > 0) return `${days}d`
  const hrs = Math.floor(diff / 3_600_000)
  if (hrs > 0) return `${hrs}h`
  return `${Math.floor(diff / 60_000)}m`
}

function miniSpark(seed: string, target: number, w = 80, h = 30): string {
  let s = seed.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0) >>> 0
  const rng = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000 }
  const pts = 20
  const points: [number, number][] = []
  for (let i = 0; i < pts; i++) {
    const t = i / (pts - 1)
    const v = Math.max(3, Math.min(97, 50 + (target - 50) * t + (rng() - 0.5) * 14 * (1 - t * 0.6)))
    points.push([(i / (pts - 1)) * w, h - (i === pts - 1 ? target : v) / 100 * h])
  }
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1], c = points[i]
    const cx = ((p[0] + c[0]) / 2).toFixed(1)
    d += ` C ${cx} ${p[1].toFixed(1)},${cx} ${c[1].toFixed(1)},${c[0].toFixed(1)} ${c[1].toFixed(1)}`
  }
  return d
}

function seededChange(seed: string, salt = ""): number {
  let s = (seed + salt).split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0) >>> 0
  s = (s * 1664525 + 1013904223) >>> 0
  s = (s * 1664525 + 1013904223) >>> 0
  return Math.round(((s / 0x100000000) * 22 - 11) * 10) / 10
}

/* ── Page ─────────────────────────────────────────────────────────────── */
export default async function MercadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  const [market, savedMarket] = await Promise.all([
    prisma.market.findUnique({
      where: { id },
      include: {
        options: true,
        categoryRef: true,
        _count: { select: { bets: true } },
        bets: {
          take: 12,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true } },
            option: { select: { label: true } },
          },
        },
      },
    }),
    session
      ? prisma.savedMarket.findUnique({
          where: { userId_marketId: { userId: session.user.id, marketId: id } },
        })
      : null,
  ])

  if (!market) notFound()

  const yesOpt  = market.options.find((o) => o.label === "SIM")
  const noOpt   = market.options.find((o) => o.label === "NÃO")
  const pool    = (yesOpt?.totalBet ?? 0) + (noOpt?.totalBet ?? 0)
  const yesPct  = pool > 0 ? Math.round(((yesOpt?.totalBet ?? 0) / pool) * 100) : 50
  const noPct   = 100 - yesPct
  const isOpen  = market.status === "OPEN"
  // Single category source: color from the DB, name for display.
  const catColor = market.categoryRef?.color ?? "#8b98a5"
  const catName  = market.categoryRef?.name ?? market.category

  const isBTC = /bitcoin|btc/i.test(market.title)

  const yesChange = seededChange(market.id, "yes")
  const noChange  = seededChange(market.id, "no")
  const yesSparkPath = miniSpark(market.id + "yes", yesPct)
  const noSparkPath  = miniSpark(market.id + "no",  noPct)

  type RecentBet = {
    id: string; amount: number; createdAt: Date
    user: { name: string | null } | null
    option: { label: string } | null
  }
  const recentBets = (market as any).bets as RecentBet[]

  const closesAtStr = new Date(market.closesAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  })
  const createdAtStr = new Date(market.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  })

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ minHeight: 260 }}>
        {/* Background: image or category gradient */}
        {market.imageUrl ? (
          <>
            <img
              src={market.imageUrl}
              alt={market.title}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: "brightness(0.35) saturate(0.8)" }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 50%, var(--bg) 100%)" }}
            />
          </>
        ) : (
          // Neutral backdrop — no per-category gradient/glow (contra 1px + no-shadow direction)
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #0b0f14 0%, var(--bg) 100%)" }} />
        )}

        {/* Hero content */}
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            <Link href="/" className="hover:text-white/70 transition-colors">Mercados</Link>
            <span>/</span>
            <span style={{ color: "rgba(255,255,255,0.6)" }}>{catName}</span>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
              style={{ background: catColor, color: "#0b0b0f", border: "1px solid rgba(0,0,0,0.1)" }}
            >
              {catName}
            </span>
            <span
              className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={isOpen
                ? { background: "rgba(0,192,118,0.2)", color: "#00c076", border: "1px solid rgba(0,192,118,0.4)" }
                : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }
              }
            >
              {isOpen && <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#00c076" }} />}
              {isOpen ? "AO VIVO" : market.status === "RESOLVED" ? "RESOLVIDO" : "FECHADO"}
            </span>
            <div className="ml-auto">
              <SaveButton marketId={market.id} initialSaved={!!savedMarket} />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight mb-3 text-white max-w-3xl">
            {market.title}
          </h1>
          {market.description && (
            <p className="text-sm leading-relaxed mb-6 max-w-xl" style={{ color: "rgba(255,255,255,0.55)" }}>
              {market.description}
            </p>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap gap-5">
            {[
              { label: "Volume", value: brl(market.totalPool) },
              { label: "Apostas", value: market._count.bets.toLocaleString("pt-BR") },
              { label: "Encerra em", value: timeLeft(market.closesAt) },
              { label: "Prob. SIM", value: `${yesPct}%` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {label}
                </p>
                <p className="text-base font-black tabular-nums text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">

          {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
          <div className="space-y-5 min-w-0">

            {/* ── BTC LIVE WIDGET (only for BTC markets) ───────────── */}
            {isBTC && <BTCLiveWidget yesPct={yesPct} noPct={noPct} />}

            {/* ── OPTION CARDS (financial asset style) ─────────────── */}
            {market.type === "BINARY" && (
              <div className="grid grid-cols-2 gap-3">
                {/* SIM card */}
                <div
                  className="relative rounded-2xl overflow-hidden p-5"
                  style={{ background: "var(--card)", border: "1px solid rgba(0,192,118,0.2)" }}
                >
                  {/* Sparkline background */}
                  <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none" style={{ opacity: 0.35 }}>
                    <svg viewBox="0 0 80 30" preserveAspectRatio="none" className="w-full h-full">
                      <defs>
                        <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00c076" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#00c076" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={`${yesSparkPath} L 80 30 L 0 30 Z`} fill="url(#simGrad)" />
                      <path d={yesSparkPath} fill="none" stroke="#00c076" strokeWidth="1.5" />
                    </svg>
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--green)" }}>SIM</span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: "var(--green-dim)",
                          color: yesChange >= 0 ? "var(--green)" : "var(--red)",
                        }}
                      >
                        {yesChange >= 0 ? "▲" : "▼"} {Math.abs(yesChange)}%
                      </span>
                    </div>
                    <div className="text-[42px] font-black tabular-nums leading-none mb-1" style={{ color: "var(--text-0)" }}>
                      {yesPct}¢
                    </div>
                    <p className="text-[10px]" style={{ color: "var(--text-2)" }}>
                      {yesPct}% de probabilidade
                    </p>
                    <p className="text-[10px] mt-0.5 font-semibold" style={{ color: "var(--green)" }}>
                      Vol: {brl(yesOpt?.totalBet ?? 0)}
                    </p>
                  </div>
                </div>

                {/* NÃO card */}
                <div
                  className="relative rounded-2xl overflow-hidden p-5"
                  style={{ background: "var(--card)", border: "1px solid rgba(255,92,92,0.2)" }}
                >
                  {/* Sparkline background */}
                  <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none" style={{ opacity: 0.35 }}>
                    <svg viewBox="0 0 80 30" preserveAspectRatio="none" className="w-full h-full">
                      <defs>
                        <linearGradient id="naoGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ff5c5c" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#ff5c5c" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={`${noSparkPath} L 80 30 L 0 30 Z`} fill="url(#naoGrad)" />
                      <path d={noSparkPath} fill="none" stroke="#ff5c5c" strokeWidth="1.5" />
                    </svg>
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--red)" }}>NÃO</span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: "var(--red-dim)",
                          color: noChange >= 0 ? "var(--green)" : "var(--red)",
                        }}
                      >
                        {noChange >= 0 ? "▲" : "▼"} {Math.abs(noChange)}%
                      </span>
                    </div>
                    <div className="text-[42px] font-black tabular-nums leading-none mb-1" style={{ color: "var(--text-0)" }}>
                      {noPct}¢
                    </div>
                    <p className="text-[10px]" style={{ color: "var(--text-2)" }}>
                      {noPct}% de probabilidade
                    </p>
                    <p className="text-[10px] mt-0.5 font-semibold" style={{ color: "var(--red)" }}>
                      Vol: {brl(noOpt?.totalBet ?? 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* MULTIPLE option cards */}
            {market.type === "MULTIPLE" && (
              <div className="space-y-2.5">
                {market.options.map((opt, i) => {
                  const total = market.options.reduce((s, o) => s + o.totalBet, 0)
                  const pct   = total > 0 ? Math.round((opt.totalBet / total) * 100) : Math.round(100 / market.options.length)
                  const sp    = miniSpark(market.id + opt.id, pct)
                  const ch    = seededChange(market.id, opt.id)
                  return (
                    <div
                      key={opt.id}
                      className="relative rounded-xl overflow-hidden flex items-center justify-between px-4 py-3.5"
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      {/* Progress fill */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-l-xl"
                        style={{ width: `${pct}%`, background: "rgba(0,192,118,0.06)", transition: "width 0.5s" }}
                      />
                      <div className="relative flex items-center gap-3 min-w-0">
                        <div
                          className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                          style={{ background: "var(--green-dim)", color: "var(--green)" }}
                        >
                          {i + 1}
                        </div>
                        <span className="text-sm font-semibold truncate" style={{ color: "var(--text-0)" }}>{opt.label}</span>
                      </div>
                      <div className="relative flex items-center gap-4 flex-shrink-0">
                        <svg viewBox="0 0 60 24" style={{ width: 60, height: 24 }}>
                          <path d={miniSpark(market.id + opt.id + "2", pct, 60, 24)} fill="none" stroke="var(--green)" strokeWidth="1.5" />
                        </svg>
                        <div className="text-right">
                          <p className="text-base font-black tabular-nums leading-none" style={{ color: "var(--text-0)" }}>{pct}¢</p>
                          <p className="text-[9px] mt-0.5" style={{ color: ch >= 0 ? "var(--green)" : "var(--red)" }}>
                            {ch >= 0 ? "+" : ""}{ch}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── PROBABILITY BAR ─────────────────────────────────── */}
            {market.type === "BINARY" && (
              <div
                className="rounded-2xl p-5"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="flex justify-between text-xs font-semibold mb-2.5" style={{ color: "var(--text-1)" }}>
                  <span style={{ color: "var(--green)" }}>SIM — {yesPct}% chance</span>
                  <span style={{ color: "var(--red)" }}>NÃO — {noPct}% chance</span>
                </div>
                <div className="h-3 w-full rounded-full overflow-hidden" style={{ background: "var(--red-dim)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${yesPct}%`, background: "linear-gradient(90deg, #00c076 0%, #00e090 100%)" }}
                  />
                </div>
              </div>
            )}

            {/* ── CHART ─────────────────────────────────────────────── */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-2)" }}>
                Probabilidade histórica
              </h3>
              <MarketChart marketId={market.id} yesPct={yesPct} />
              <p className="text-[9px] text-center mt-3" style={{ color: "var(--text-2)" }}>
                Histórico estimado · baseado no volume acumulado
              </p>
            </div>

            {/* ── STATS ROW ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Volume total",     value: brl(market.totalPool),                        accent: false },
                { label: "Apostas",          value: market._count.bets.toLocaleString("pt-BR"),   accent: false },
                { label: "Encerra em",       value: timeLeft(market.closesAt),                    accent: isOpen },
                { label: "Prob. SIM",        value: `${yesPct}%`,                                 accent: true  },
              ].map(({ label, value, accent }) => (
                <div
                  key={label}
                  className="rounded-xl p-4"
                  style={{ background: "var(--card)", border: `1px solid ${accent ? "rgba(0,192,118,0.2)" : "var(--border)"}` }}
                >
                  <p className="text-[9px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "var(--text-2)" }}>
                    {label}
                  </p>
                  <p
                    className="text-lg font-black tabular-nums leading-none"
                    style={{ color: accent ? "var(--green)" : "var(--text-0)" }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* ── RESOLVED BANNER ───────────────────────────────────── */}
            {market.status === "RESOLVED" && market.resolution && (
              <div
                className="rounded-2xl p-5 flex items-center gap-4"
                style={{ background: "var(--green-dim)", border: "1px solid rgba(0,192,118,0.28)" }}
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "rgba(0,192,118,0.2)" }}
                >
                  ✓
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--green)" }}>
                    Mercado Resolvido
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-0)" }}>{market.resolution}</p>
                </div>
              </div>
            )}

            {/* ── RECENT ACTIVITY ───────────────────────────────────── */}
            {recentBets.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div
                  className="px-5 py-4 flex items-center gap-2.5"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70" style={{ backgroundColor: "var(--green)" }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "var(--green)" }} />
                  </span>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-1)" }}>
                    Atividade ao vivo
                  </h3>
                  <span
                    className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "var(--green-dim)", color: "var(--green)" }}
                  >
                    {recentBets.length} trades
                  </span>
                </div>

                <div>
                  {recentBets.map((bet, i) => {
                    const isYes = bet.option?.label === "SIM"
                    const clr   = isYes ? "var(--green)" : "var(--red)"
                    const dimBg = isYes ? "var(--green-dim)" : "var(--red-dim)"
                    const name  = bet.user?.name?.split(" ")[0] ?? "Trader"
                    return (
                      <div
                        key={bet.id}
                        className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                        style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                            style={{ background: dimBg, color: clr }}
                          >
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 text-xs">
                            <span className="font-semibold" style={{ color: "var(--text-0)" }}>{name}</span>
                            <span style={{ color: "var(--text-1)" }}> comprou </span>
                            <span
                              className="font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider"
                              style={{ background: dimBg, color: clr }}
                            >
                              {bet.option?.label ?? "—"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-sm font-black tabular-nums" style={{ color: clr }}>{brl(bet.amount)}</p>
                          <p className="text-[9px]" style={{ color: "var(--text-2)" }}>{timeAgo(bet.createdAt)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── COMMENTS ──────────────────────────────────────────── */}
            <CommentSection marketId={market.id} />
          </div>

          {/* ── RIGHT COLUMN — sticky trading panel ─────────────────── */}
          <div className="lg:sticky lg:top-6 space-y-4">

            {market.status === "OPEN" && session ? (
              <BetForm
                marketId={market.id}
                options={market.options}
                userBalance={session.user.balance ?? 0}
                yesPct={yesPct}
                noPct={noPct}
              />
            ) : market.status === "OPEN" && !session ? (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-base font-black mb-1" style={{ color: "var(--text-0)" }}>
                  Faça sua previsão
                </h3>
                <p className="text-xs mb-5 leading-relaxed" style={{ color: "var(--text-1)" }}>
                  Crie sua conta grátis e comece a negociar em mercados de previsão.
                </p>
                <Link
                  href="/login"
                  className="block rounded-xl py-3.5 text-sm font-bold text-white mb-2"
                  style={{ background: "linear-gradient(135deg, #00c076, #009e64)", boxShadow: "0 4px 20px rgba(0,192,118,0.35)" }}
                >
                  Entrar / Criar conta
                </Link>
                <p className="text-[9px]" style={{ color: "var(--text-2)" }}>Gratuito · Sem cartão de crédito</p>
              </div>
            ) : null}

            {/* Market info panel */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="px-4 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-2)" }}>
                  Sobre este mercado
                </h3>
              </div>
              <div>
                {[
                  { label: "Criado em",        value: createdAtStr },
                  { label: "Fecha em",          value: closesAtStr  },
                  { label: "Tipo",              value: market.type === "BINARY" ? "Binário (SIM / NÃO)" : "Múltiplas opções" },
                  { label: "Taxa da plataforma",value: "2% sobre o lucro" },
                  { label: "Resolução",         value: "Resultado oficial" },
                  { label: "Categoria",         value: catName },
                ].map(({ label, value }, i) => (
                  <div
                    key={label}
                    className="flex justify-between items-center px-4 py-3"
                    style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}
                  >
                    <span className="text-xs" style={{ color: "var(--text-2)" }}>{label}</span>
                    <span className="text-xs font-semibold text-right" style={{ color: "var(--text-0)", maxWidth: 140, lineHeight: 1.3 }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div
              className="rounded-2xl p-4"
              style={{ background: "var(--card-2)", border: "1px solid var(--border)" }}
            >
              <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: "var(--text-2)" }}>
                Como funciona
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-1)" }}>
                Compre contratos SIM ou NÃO. A probabilidade reflete o consenso coletivo. Se você acertar, recebe proporcionalmente ao pool total, menos 2% de taxa da plataforma.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
