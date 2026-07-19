"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { OutcomeThumb } from "@/app/components/OutcomeThumb"
import { priceCents, sharesForSpend, proceedsForShares } from "@/lib/amm"

export type TradeOption = { id: string; label: string; shares: number }
export type Outcome = {
  marketId: string
  name: string
  imageUrl: string | null
  liquidity: number
  options: TradeOption[]
  positions: Record<string, number> // optionId → contracts held
}

const SERIES = ["#00c076", "#2f6ff5", "#f59e0b", "#a855f7"]
const SERIES_BLOCK = ["rgba(0,192,118,0.18)", "rgba(47,111,245,0.18)", "rgba(245,158,11,0.18)", "rgba(168,85,247,0.18)"]
const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

function traded(o: Outcome) { return o.options.some((x) => x.shares > 0) }
function optColor(label: string, i: number) {
  if (label === "SIM") return "#00c076"
  if (label === "NÃO") return "#ff5c5c"
  return SERIES[i % SERIES.length]
}
/** SIM price (or the leading/first option) in cents for the row pill; null when untraded. */
function rowCents(o: Outcome): number | null {
  if (!traded(o)) return null
  const i = Math.max(0, o.options.findIndex((x) => x.label === "SIM"))
  return priceCents(o.options.map((x) => x.shares), o.liquidity, i)
}

export default function TradePanel({
  outcomes, initialMarketId, showList,
}: {
  outcomes: Outcome[]; initialMarketId: string; showList: boolean
}) {
  const router = useRouter()
  const { data: session, update } = useSession()
  const authed = !!session
  const balance = session?.user?.balance ?? 0

  const first = outcomes.find((o) => o.marketId === initialMarketId) ?? outcomes[0]
  const [selectedId, setSelectedId] = useState(first.marketId)
  const [tab, setTab] = useState<"BUY" | "SELL">("BUY")
  const [optionId, setOptionId] = useState(first.options[0]?.id ?? "")
  const [amount, setAmount] = useState("")
  const [sellPct, setSellPct] = useState(100)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const selected = outcomes.find((o) => o.marketId === selectedId) ?? outcomes[0]
  const opt = selected.options.find((o) => o.id === optionId) ?? selected.options[0]
  const idx = selected.options.findIndex((o) => o.id === opt.id)
  const q = selected.options.map((o) => o.shares)
  const hasPool = traded(selected)
  const optPrice = hasPool ? priceCents(q, selected.liquidity, idx) : null
  const accent = optColor(opt.label, idx)

  const amountCents = Math.round(parseFloat(amount || "0") * 100)
  const buyContracts = amountCents >= 100 ? sharesForSpend(q, selected.liquidity, idx, amountCents) : 0
  const maxPayout = Math.round(buyContracts * 100)

  const heldShares = selected.positions[opt.id] ?? 0
  const sellShares = heldShares * (sellPct / 100)
  const sellProceeds = sellShares > 0 ? proceedsForShares(q, selected.liquidity, idx, sellShares) : 0
  const heldValue = heldShares > 0 && optPrice !== null ? Math.round(heldShares * optPrice) : 0

  function pick(o: Outcome) {
    setSelectedId(o.marketId); setOptionId(o.options[0]?.id ?? ""); setAmount(""); setSellPct(100); setError("")
  }

  async function submit() {
    setLoading(true); setError("")
    const body = tab === "BUY"
      ? { marketId: selectedId, optionId: opt.id, side: "BUY", amount: amountCents }
      : { marketId: selectedId, optionId: opt.id, side: "SELL", shares: sellShares }
    const res = await fetch("/api/apostas", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || "Erro na operação"); return }
    setAmount("")
    if (typeof data.balance === "number") await update({ balance: data.balance })
    router.refresh()
  }

  if (!authed) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-0)" }}>Faça sua previsão</h3>
        <p className="text-xs mb-5 leading-relaxed" style={{ color: "var(--text-1)" }}>
          Entre para comprar e vender contratos com preço ao vivo.
        </p>
        <Link href="/login" className="block rounded-xl py-3.5 text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, #00c076, #009e64)" }}>Entrar / Criar conta</Link>
      </div>
    )
  }

  const buyDisabled = loading || amountCents < 100 || amountCents > balance || !buyContracts
  const sellDisabled = loading || heldShares <= 0 || sellShares <= 0
  const binary = selected.options.length === 2

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        {/* COMPRAR / VENDER tabs */}
        <div className="grid grid-cols-2" style={{ borderBottom: "1px solid var(--border)" }}>
          {(["BUY", "SELL"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError("") }}
              className="py-3 text-sm font-bold transition-colors"
              style={tab === t ? { color: "var(--text-0)", borderBottom: "2px solid var(--green)" } : { color: "var(--text-2)" }}>
              {t === "BUY" ? "Comprar" : "Vender"}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {/* Selected outcome name + line image */}
          <div className="flex items-center gap-2.5">
            <OutcomeThumb imageUrl={selected.imageUrl} blockColor={SERIES_BLOCK[0]} />
            <span className="text-[20px] font-semibold leading-tight" style={{ color: "var(--text-0)" }}>{selected.name}</span>
          </div>

          {/* Option price buttons (SIM/NÃO for binary, N options otherwise) */}
          <div className={binary ? "grid grid-cols-2 gap-2.5" : "flex flex-col gap-2"}>
            {selected.options.map((o, i) => {
              const cents = hasPool ? priceCents(q, selected.liquidity, i) : null
              const on = o.id === opt.id
              const clr = optColor(o.label, i)
              return (
                <button key={o.id} onClick={() => setOptionId(o.id)}
                  className={`rounded-xl transition-all ${binary ? "py-3.5 px-4 text-left" : "py-3 px-4 flex items-center justify-between"}`}
                  style={on ? { background: `${clr}1f`, border: `1.5px solid ${clr}` } : { background: "var(--card-2)", border: "1.5px solid var(--border)" }}>
                  <p className={`font-bold ${binary ? "text-[10px] uppercase tracking-widest mb-1" : "text-sm"}`} style={{ color: on ? clr : binary ? "var(--text-2)" : "var(--text-0)" }}>{o.label}</p>
                  <p className={`font-bold tabular-nums leading-none ${binary ? "text-[26px]" : "text-[18px]"}`} style={{ color: on ? clr : "var(--text-0)" }}>
                    {cents === null ? "—" : cents}¢
                  </p>
                </button>
              )
            })}
          </div>

          {tab === "BUY" ? (
            <>
              <div className="flex gap-1.5">
                {[["R$10", 10], ["R$50", 50], ["R$100", 100], ["Máx", balance / 100]].map(([lbl, v]) => (
                  <button key={String(lbl)} onClick={() => setAmount(String(v))}
                    className="flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-all"
                    style={{ background: "var(--card-2)", color: "var(--text-1)", border: "1px solid var(--border)" }}>{lbl}</button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none" style={{ color: "var(--text-2)" }}>R$</span>
                <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00"
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm font-semibold focus:outline-none"
                  style={{ background: "var(--card-2)", border: "1.5px solid var(--border)", color: "var(--text-0)" }} />
              </div>
              {amountCents >= 100 && (
                <div className="rounded-xl px-4 py-3 flex justify-between items-center" style={{ background: "var(--card-2)", border: "1px solid var(--border)" }}>
                  <span className="text-xs" style={{ color: "var(--text-2)" }}>Pagamento máximo</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: "var(--green)" }}>{brl(maxPayout)}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="rounded-xl px-4 py-3 space-y-1.5" style={{ background: "var(--card-2)", border: "1px solid var(--border)" }}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--text-2)" }}>Você tem</span>
                  <span className="font-semibold tabular-nums" style={{ color: "var(--text-0)" }}>{heldShares.toFixed(2)} contratos {opt.label}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--text-2)" }}>Valor atual</span>
                  <span className="font-semibold tabular-nums" style={{ color: "var(--text-0)" }}>{brl(heldValue)}</span>
                </div>
              </div>
              {heldShares > 0 && (
                <div className="flex gap-1.5">
                  {[25, 50, 75, 100].map((p) => (
                    <button key={p} onClick={() => setSellPct(p)}
                      className="flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-all"
                      style={sellPct === p ? { background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(0,192,118,0.3)" } : { background: "var(--card-2)", color: "var(--text-1)", border: "1px solid var(--border)" }}>{p}%</button>
                  ))}
                </div>
              )}
              {sellShares > 0 && (
                <div className="rounded-xl px-4 py-3 flex justify-between items-center" style={{ background: "var(--card-2)", border: "1px solid var(--border)" }}>
                  <span className="text-xs" style={{ color: "var(--text-2)" }}>Você recebe</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: "var(--green)" }}>{brl(sellProceeds)}</span>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="rounded-xl px-4 py-2.5 text-xs" style={{ background: "var(--red-dim)", color: "var(--red)", border: "1px solid rgba(255,77,77,0.2)" }}>{error}</div>
          )}

          <button onClick={submit} disabled={tab === "BUY" ? buyDisabled : sellDisabled}
            className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>
            {loading ? "Processando..."
              : tab === "BUY" ? `Comprar ${opt.label}${amountCents >= 100 ? ` · ${brl(amountCents)}` : ""}`
              : heldShares <= 0 ? `Sem contratos ${opt.label}` : `Vender ${opt.label} · ${brl(sellProceeds)}`}
          </button>
          <p className="text-[9px] text-center" style={{ color: "var(--text-2)" }}>2% de taxa por operação · 1 contrato paga R$1 se ganhar</p>
        </div>
      </div>

      {/* Outcome list (events only) — click selects the outcome above, no reload */}
      {showList && outcomes.length > 1 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-2)" }}>Resultados</h3>
          </div>
          {outcomes.map((o, i) => {
            const cents = rowCents(o)
            const on = o.marketId === selectedId
            return (
              <button key={o.marketId} onClick={() => pick(o)}
                className="flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-[var(--card-2)]"
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)", background: on ? "var(--card-2)" : undefined }}>
                <OutcomeThumb imageUrl={o.imageUrl} blockColor={SERIES_BLOCK[i % 4]} />
                <span className="flex-1 min-w-0 text-[14px] font-medium truncate" style={{ color: "var(--text-0)" }}>{o.name}</span>
                <span className={`prob-pill flex-shrink-0${cents === null ? " prob-pill-muted" : ""}`} style={{ minWidth: 60 }}>
                  {cents === null ? "—" : `${cents}%`}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
