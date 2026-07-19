"use client"
import { useState } from "react"

type Activity = { id: string; side: string; amount: number; label: string; name: string; ago: string }
type Rule = { label: string; value: string }

const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default function MarketTabs({ rules, activity }: { rules: Rule[]; activity: Activity[] }) {
  const [tab, setTab] = useState<"rules" | "activity">("rules")

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="grid grid-cols-2" style={{ borderBottom: "1px solid var(--border)" }}>
        {([["rules", "Regras"], ["activity", "Atividade"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className="py-3 text-sm font-semibold transition-colors"
            style={tab === key ? { color: "var(--text-0)", borderBottom: "2px solid var(--green)" } : { color: "var(--text-2)" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "rules" ? (
        <div>
          {rules.map((r, i) => (
            <div key={r.label} className="flex justify-between items-center px-5 py-3" style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
              <span className="text-xs" style={{ color: "var(--text-2)" }}>{r.label}</span>
              <span className="text-xs font-semibold text-right" style={{ color: "var(--text-0)", maxWidth: 200 }}>{r.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {activity.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-2)" }}>Nenhuma negociação ainda.</p>
          ) : activity.map((a, i) => {
            const isBuy = a.side !== "SELL"
            const clr = a.label === "NÃO" ? "var(--red)" : "var(--green)"
            const dim = a.label === "NÃO" ? "var(--red-dim)" : "var(--green-dim)"
            return (
              <div key={a.id} className="flex items-center justify-between px-5 py-3" style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                <div className="flex items-center gap-3 min-w-0 text-xs">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{ background: dim, color: clr }}>
                    {a.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="min-w-0">
                    <span className="font-semibold" style={{ color: "var(--text-0)" }}>{a.name}</span>
                    <span style={{ color: "var(--text-1)" }}>{isBuy ? " comprou " : " vendeu "}</span>
                    <span className="font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider" style={{ background: dim, color: clr }}>{a.label}</span>
                  </span>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-black tabular-nums" style={{ color: clr }}>{brl(a.amount)}</p>
                  <p className="text-[9px]" style={{ color: "var(--text-2)" }}>{a.ago}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
