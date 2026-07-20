"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

type Cargo = { marketId: string; mercado: string; opcao: string; shares: number; precoAtual: number; valorAtual: number }
type Pedido = { marketId: string; mercado: string; lado: string; resultado: string; valor: number; shares: number; preco: number; data: string }
type Historia = { marketId: string; mercado: string; status: string; custoTotal: number; pagamentoTotal: number; retornoTotal: number; retornoPct: number }

type Tab = "cargos" | "pedidos" | "historia"
const TABS: { key: Tab; label: string }[] = [
  { key: "cargos", label: "CARGOS" },
  { key: "pedidos", label: "PEDIDOS" },
  { key: "historia", label: "HISTÓRIA" },
]

const card = { background: "var(--card)", border: "1px solid var(--border)" } as const

export default function PortfolioTabs() {
  const [tab, setTab] = useState<Tab>("cargos")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ cargos: Cargo[]; pedidos: Pedido[]; historia: Historia[] }>({ cargos: [], pedidos: [], historia: [] })

  useEffect(() => {
    fetch("/api/portfolio/historico")
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 rounded-xl p-1" style={{ background: "var(--card-2)", border: "1px solid var(--border)" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 rounded-lg py-2 text-xs font-bold tracking-wide transition-colors"
            style={tab === t.key ? { background: "var(--green-dim)", color: "var(--green)" } : { color: "var(--text-2)" }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      ) : tab === "cargos" ? (
        data.cargos.length === 0 ? <Empty text="Nenhuma posição ainda." /> : (
          <div className="rounded-2xl overflow-hidden" style={card}>
            {data.cargos.map((c, i) => {
              const isNao = c.opcao === "NÃO"
              const clr = isNao ? "var(--red)" : "var(--green)"
              const dim = isNao ? "var(--red-dim)" : "var(--green-dim)"
              return (
                <Link key={c.marketId + c.opcao} href={`/mercados/${c.marketId}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--card-2)]"
                  style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-0)" }}>{c.mercado}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ background: dim, color: clr }}>{c.opcao}</span>
                      <span className="text-[11px] tabular-nums" style={{ color: "var(--text-2)" }}>{c.shares.toFixed(1)} contratos · {c.precoAtual}¢</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-0)" }}>{brl(c.valorAtual)}</p>
                </Link>
              )
            })}
          </div>
        )
      ) : tab === "pedidos" ? (
        data.pedidos.length === 0 ? <Empty text="Nenhuma ordem executada ainda." /> : (
          <div className="rounded-2xl overflow-hidden" style={card}>
            {data.pedidos.map((p, i) => {
              const isSell = p.lado === "SELL"
              const isNao = p.resultado === "NÃO"
              const clr = isNao ? "var(--red)" : "var(--green)"
              return (
                <Link key={i} href={`/mercados/${p.marketId}`}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[var(--card-2)]"
                  style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-medium truncate" style={{ color: "var(--text-0)" }}>{p.mercado}</p>
                    <p className="mt-0.5" style={{ color: "var(--text-2)" }}>
                      {isSell ? "Vendeu" : "Comprou"} <span style={{ color: clr }}>{p.resultado}</span> · {p.preco}¢ · {new Date(p.data).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums ml-3" style={{ color: isSell ? "var(--green)" : "var(--text-0)" }}>
                    {isSell ? "+" : "−"}{brl(p.valor)}
                  </span>
                </Link>
              )
            })}
          </div>
        )
      ) : (
        data.historia.length === 0 ? <Empty text="Nenhuma aposta no histórico." /> : (
          <div className="rounded-2xl overflow-hidden" style={card}>
            {/* header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-2)", borderBottom: "1px solid var(--border)" }}>
              <span>Mercado</span>
              <span className="text-right w-20">Custo</span>
              <span className="text-right w-20">Pagamento</span>
              <span className="text-right w-24">Retorno</span>
            </div>
            {data.historia.map((h, i) => {
              const pos = h.retornoTotal >= 0
              return (
                <Link key={h.marketId} href={`/mercados/${h.marketId}`}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 items-center transition-colors hover:bg-[var(--card-2)]"
                  style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                  <span className="text-[13px] font-medium truncate" style={{ color: "var(--text-0)" }}>{h.mercado}</span>
                  <span className="text-[12px] tabular-nums text-right w-20" style={{ color: "var(--text-1)" }}>{brl(h.custoTotal)}</span>
                  <span className="text-[12px] tabular-nums text-right w-20" style={{ color: "var(--text-1)" }}>{brl(h.pagamentoTotal)}</span>
                  <span className="text-[12px] font-bold tabular-nums text-right w-24" style={{ color: pos ? "var(--green)" : "var(--red)" }}>
                    {pos ? "+" : ""}{brl(h.retornoTotal)} <span className="text-[10px] opacity-80">({pos ? "+" : ""}{h.retornoPct}%)</span>
                  </span>
                </Link>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl p-12 text-center" style={card}>
      <p style={{ color: "var(--text-2)" }}>{text}</p>
    </div>
  )
}
