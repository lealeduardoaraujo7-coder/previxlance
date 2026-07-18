"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface Option { id: string; label: string; totalBet: number }

const PRESETS = [10, 50, 100, 500]

function calcPayout(amountCents: number, optionTotalBet: number, allOptions: Option[]) {
  if (amountCents <= 0) return null
  const currentPool = allOptions.reduce((s, o) => s + o.totalBet, 0)
  const newPool = currentPool + amountCents
  const newOptionTotal = optionTotalBet + amountCents
  const prizePool = newPool * 0.98
  const payout = Math.floor((amountCents / newOptionTotal) * prizePool)
  const profit = payout - amountCents
  const multiplier = (payout / amountCents).toFixed(2)
  return { payout, profit, multiplier }
}

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function BetForm({
  marketId, options, userBalance, yesPct = 50, noPct = 50,
}: {
  marketId: string
  options: Option[]
  userBalance: number
  yesPct?: number
  noPct?: number
}) {
  const router = useRouter()
  const { update } = useSession()
  const [selectedOption, setSelectedOption] = useState("")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Preselect a side when arriving from a card pill (?lado=SIM|NAO|<label>)
  useEffect(() => {
    const lado = new URLSearchParams(window.location.search).get("lado")
    if (!lado) return
    const norm = lado === "NAO" ? "NÃO" : lado === "SIM" ? "SIM" : decodeURIComponent(lado)
    const match = options.find((o) => o.label === norm)
    if (match) setSelectedOption(match.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const amountCents = Math.round(parseFloat(amount || "0") * 100)
  const selectedOpt = options.find((o) => o.id === selectedOption)
  const payout = selectedOpt ? calcPayout(amountCents, selectedOpt.totalBet, options) : null
  const isBinary = options.length === 2 && options.some(o => o.label === "SIM") && options.some(o => o.label === "NÃO")
  const isYesSelected = selectedOpt?.label === "SIM"
  const accentColor = selectedOpt ? (isYesSelected ? "var(--green)" : "var(--red)") : "var(--border)"

  async function handleBet() {
    if (!selectedOption || amountCents < 100) return
    setLoading(true); setError(""); setSuccess("")
    const res = await fetch("/api/apostas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId, optionId: selectedOption, amount: amountCents }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || "Erro ao registrar aposta"); return }
    setSuccess("Aposta registrada!")
    setAmount(""); setSelectedOption("")
    await update({ balance: data.balance })
    router.refresh()
  }

  const btnLabel = loading
    ? "Processando..."
    : !selectedOption
      ? "Selecione SIM ou NÃO"
      : amountCents < 100
        ? "Mínimo R$1,00"
        : `Comprar ${selectedOpt?.label}${payout && payout.profit > 0 ? ` · +${brl(payout.profit)}` : ""}`

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h2 className="text-sm font-bold" style={{ color: "var(--text-0)" }}>Fazer aposta</h2>
        <span className="text-xs" style={{ color: "var(--text-2)" }}>
          Saldo:{" "}
          <span className="font-bold tabular-nums" style={{ color: "var(--text-0)" }}>
            {brl(userBalance)}
          </span>
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Binary option buttons */}
        {isBinary ? (
          <div className="grid grid-cols-2 gap-2.5">
            {options.map((opt) => {
              const isYes = opt.label === "SIM"
              const pct = isYes ? yesPct : noPct
              const selected = selectedOption === opt.id
              const clr = isYes ? "var(--green)" : "var(--red)"
              const dimBg = isYes ? "var(--green-dim)" : "var(--red-dim)"
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className="rounded-xl py-4 px-4 text-left transition-all"
                  style={selected
                    ? { background: dimBg, border: `1.5px solid ${clr}` }
                    : { background: "var(--card-2)", border: "1.5px solid var(--border)" }
                  }
                >
                  <p
                    className="text-[9px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: selected ? clr : "var(--text-2)" }}
                  >
                    {opt.label}
                  </p>
                  <p
                    className="text-[28px] font-black tabular-nums leading-none"
                    style={{ color: selected ? clr : "var(--text-0)" }}
                  >
                    {pct}¢
                  </p>
                  <p
                    className="text-[9px] mt-1.5 font-medium"
                    style={{ color: selected ? clr : "var(--text-2)" }}
                  >
                    {pct}% de chance
                  </p>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {options.map((opt) => {
              const selected = selectedOption === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className="w-full rounded-xl py-3 px-4 text-left text-sm font-medium transition-all"
                  style={selected
                    ? { background: "var(--green-dim)", border: "1.5px solid var(--green)", color: "var(--green)" }
                    : { background: "var(--card-2)", border: "1.5px solid var(--border)", color: "var(--text-1)" }
                  }
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Amount */}
        <div>
          {/* Presets */}
          <div className="flex gap-1.5 mb-2">
            {PRESETS.map((preset) => {
              const active = amount === preset.toString()
              return (
                <button
                  key={preset}
                  onClick={() => setAmount(preset.toString())}
                  className="flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-all"
                  style={active
                    ? { background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(0,192,118,0.3)" }
                    : { background: "var(--card-2)", color: "var(--text-1)", border: "1px solid var(--border)" }
                  }
                >
                  R${preset}
                </button>
              )
            })}
          </div>

          {/* Input */}
          <div className="relative">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none"
              style={{ color: "var(--text-2)" }}
            >
              R$
            </span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-xl pl-10 pr-4 py-3 text-sm font-semibold focus:outline-none transition-colors"
              style={{
                background: "var(--card-2)",
                border: `1.5px solid ${amountCents > 0 ? accentColor : "var(--border)"}`,
                color: "var(--text-0)",
              }}
            />
          </div>
        </div>

        {/* Payout preview */}
        {payout && amountCents > 0 && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--card-2)", border: "1px solid var(--border)" }}
          >
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs" style={{ color: "var(--text-2)" }}>Lucro potencial</span>
              <span
                className="text-base font-black tabular-nums"
                style={{ color: payout.profit >= 0 ? "var(--green)" : "var(--text-2)" }}
              >
                {payout.profit >= 0 ? "+" : ""}{brl(payout.profit)}
              </span>
            </div>
            <div
              className="flex justify-between items-center px-4 py-2.5"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <span className="text-xs" style={{ color: "var(--text-2)" }}>Total se ganhar</span>
              <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-0)" }}>
                {brl(payout.payout)}
              </span>
            </div>
            <div
              className="flex justify-between items-center px-4 py-2.5"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <span className="text-[10px]" style={{ color: "var(--text-2)" }}>Multiplicador</span>
              <span className="text-[10px] font-semibold" style={{ color: "var(--text-1)" }}>
                {payout.multiplier}×
              </span>
            </div>
          </div>
        )}

        {/* Feedback */}
        {error && (
          <div
            className="rounded-xl px-4 py-2.5 text-xs"
            style={{ background: "var(--red-dim)", color: "var(--red)", border: "1px solid rgba(255,77,77,0.2)" }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            className="rounded-xl px-4 py-2.5 text-xs font-semibold"
            style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(0,192,118,0.25)" }}
          >
            ✓ {success}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleBet}
          disabled={!selectedOption || amountCents < 100 || loading}
          className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-40"
          style={{
            background: selectedOption
              ? isYesSelected
                ? "linear-gradient(135deg, #00c076, #009e64)"
                : "linear-gradient(135deg, #ff5c5c, #cc3a3a)"
              : "var(--card-2)",
            color: selectedOption ? "white" : "var(--text-2)",
            boxShadow: selectedOption && amountCents >= 100
              ? isYesSelected
                ? "0 4px 20px rgba(0,192,118,0.35)"
                : "0 4px 20px rgba(255,92,92,0.35)"
              : "none",
          }}
        >
          {btnLabel}
        </button>

        <p className="text-[9px] text-center" style={{ color: "var(--text-2)" }}>
          2% de taxa sobre o lucro · Sem custo para registrar
        </p>
      </div>
    </div>
  )
}
