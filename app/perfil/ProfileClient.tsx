"use client"
import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import UsernameEditor from "./UsernameEditor"
import { gradient, avatarInitial } from "@/lib/avatar"

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

type Cargo = { marketId: string; mercado: string; opcao: string; shares: number; precoAtual: number; valorAtual: number }
type Pedido = { marketId: string; mercado: string; lado: string; resultado: string; valor: number; shares: number; preco: number; data: string }
type Historia = { marketId: string; mercado: string; status: string; custoTotal: number; pagamentoTotal: number; retornoTotal: number; retornoPct: number }

export default function ProfileClient({
  username, changes, image, name, email, createdAt, balance,
}: {
  username: string | null; changes: number; image: string | null
  name: string | null; email: string | null; createdAt: string; balance: number
}) {
  const { update } = useSession()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar] = useState(image)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [tab, setTab] = useState<"cargos" | "atividade">("cargos")
  const [sub, setSub] = useState<"ativo" | "fechado">("ativo")
  const [q, setQ] = useState("")
  const [data, setData] = useState<{ cargos: Cargo[]; pedidos: Pedido[]; historia: Historia[] }>({ cargos: [], pedidos: [], historia: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/portfolio/historico").then((r) => r.json())
      .then((d) => { if (d && !d.error) setData(d) }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    const fd = new FormData(); fd.append("file", file)
    const res = await fetch("/api/perfil/foto", { method: "POST", body: fd })
    const d = await res.json().catch(() => ({}))
    setAvatarLoading(false)
    // Pass the new URL so the JWT/session updates → the navbar avatar refreshes.
    if (res.ok) { setAvatar(d.url); await update({ image: d.url }) }
    if (fileRef.current) fileRef.current.value = ""
  }

  const valorPosicoes = data.cargos.reduce((s, c) => s + c.valorAtual, 0)
  const lucros = data.historia.map((h) => h.retornoTotal).filter((x) => x > 0)
  const maiorLucro = lucros.length ? Math.max(...lucros) : null
  const previsoes = data.historia.length
  const joined = new Date(createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  const handle = username || "..."

  const fechados = data.historia.filter((h) => h.status !== "OPEN")
  const cargosFiltrados = data.cargos.filter((c) => c.mercado.toLowerCase().includes(q.toLowerCase()))
  const fechadosFiltrados = fechados.filter((h) => h.mercado.toLowerCase().includes(q.toLowerCase()))

  const card = { background: "var(--card)", border: "1px solid var(--border)" } as const

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* ── Header card ── */}
      <div className="rounded-2xl p-5 sm:p-6 mb-6" style={card}>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <button onClick={() => fileRef.current?.click()} disabled={avatarLoading}
            className="relative flex-shrink-0 rounded-full overflow-hidden group" style={{ width: 72, height: 72 }}>
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-black text-white" style={{ background: gradient(handle) }}>
                {avatarInitial(handle)}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" /></svg>
            </span>
            {avatarLoading && <span className="absolute inset-0 flex items-center justify-center bg-black/50"><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /></span>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

          <div className="min-w-0 flex-1">
            <UsernameEditor currentUsername={username} changes={changes} />
            <p className="text-[13px] mt-1.5" style={{ color: "var(--text-2)" }}>
              Ingressou em {joined} · 0 visualizações
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--text-2)" }}>
              {name} · {email} <span className="opacity-70">(privado)</span>
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { label: "Valor das posições", value: brl(valorPosicoes) },
            { label: "Maior lucro", value: maiorLucro === null ? "—" : brl(maiorLucro) },
            { label: "Previsões", value: String(previsoes) },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[19px] font-bold tabular-nums leading-none" style={{ color: "var(--text-0)" }}>{s.value}</p>
              <p className="text-[12px] mt-1" style={{ color: "var(--text-2)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Link href="/depositar" className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#00c076,#009e64)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
            Depósito
          </Link>
          <Link href="/sacar" className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold"
            style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-0)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            Pagamento
          </Link>
        </div>
        <p className="text-[11px] mt-2 text-center" style={{ color: "var(--text-2)" }}>Saldo disponível: <span className="font-semibold" style={{ color: "var(--green)" }}>{brl(balance)}</span></p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-5 mb-4 px-1">
        {([["cargos", "Cargos"], ["atividade", "Atividade"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="text-[15px] font-bold pb-2 transition-colors"
            style={{ color: tab === key ? "var(--text-0)" : "var(--text-2)", borderBottom: tab === key ? "2px solid var(--green)" : "2px solid transparent" }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-7 w-7 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" /></div>
      ) : tab === "cargos" ? (
        <>
          {/* Ativo / Fechado + busca */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--card-2)", border: "1px solid var(--border)" }}>
              {([["ativo", "Ativo"], ["fechado", "Fechado"]] as const).map(([key, label]) => (
                <button key={key} onClick={() => setSub(key)} className="rounded-lg px-4 py-1.5 text-xs font-bold transition-colors"
                  style={sub === key ? { background: "var(--green-dim)", color: "var(--green)" } : { color: "var(--text-2)" }}>{label}</button>
              ))}
            </div>
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-2)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Em busca de vagas"
                className="w-full rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none" style={{ background: "var(--card-2)", border: "1px solid var(--border)", color: "var(--text-0)" }} />
            </div>
          </div>

          {sub === "ativo" ? (
            cargosFiltrados.length === 0 ? <Empty text="Nenhuma posição ativa." /> : (
              <div className="rounded-2xl overflow-hidden" style={card}>
                <Header cols={["Mercado", "Valor"]} />
                {cargosFiltrados.map((c, i) => {
                  const isNao = c.opcao === "NÃO"; const clr = isNao ? "var(--red)" : "var(--green)"; const dim = isNao ? "var(--red-dim)" : "var(--green-dim)"
                  return (
                    <Link key={c.marketId + c.opcao} href={`/mercados/${c.marketId}`} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--card-2)]" style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
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
          ) : (
            fechadosFiltrados.length === 0 ? <Empty text="Nenhuma posição fechada." /> : (
              <div className="rounded-2xl overflow-hidden" style={card}>
                <Header cols={["Mercado", "Retorno"]} />
                {fechadosFiltrados.map((h, i) => {
                  const pos = h.retornoTotal >= 0
                  return (
                    <Link key={h.marketId} href={`/mercados/${h.marketId}`} className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-[var(--card-2)]" style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                      <p className="text-[14px] font-semibold truncate min-w-0 flex-1" style={{ color: "var(--text-0)" }}>{h.mercado}</p>
                      <span className="text-sm font-bold tabular-nums ml-3" style={{ color: pos ? "var(--green)" : "var(--red)" }}>{pos ? "+" : ""}{brl(h.retornoTotal)} <span className="text-[10px] opacity-80">({pos ? "+" : ""}{h.retornoPct}%)</span></span>
                    </Link>
                  )
                })}
              </div>
            )
          )}
        </>
      ) : (
        data.pedidos.length === 0 ? <Empty text="Nenhuma atividade ainda." /> : (
          <div className="rounded-2xl overflow-hidden" style={card}>
            {data.pedidos.map((p, i) => {
              const isSell = p.lado === "SELL"; const isNao = p.resultado === "NÃO"; const clr = isNao ? "var(--red)" : "var(--green)"
              return (
                <Link key={i} href={`/mercados/${p.marketId}`} className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[var(--card-2)]" style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-medium truncate" style={{ color: "var(--text-0)" }}>{p.mercado}</p>
                    <p className="mt-0.5" style={{ color: "var(--text-2)" }}>{isSell ? "Vendeu" : "Comprou"} <span style={{ color: clr }}>{p.resultado}</span> · {p.preco}¢ · {new Date(p.data).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums ml-3" style={{ color: isSell ? "var(--green)" : "var(--text-0)" }}>{isSell ? "+" : "−"}{brl(p.valor)}</span>
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
  return <div className="rounded-2xl p-12 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}><p style={{ color: "var(--text-2)" }}>{text}</p></div>
}
function Header({ cols }: { cols: [string, string] }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-2)", borderBottom: "1px solid var(--border)" }}>
      <span>{cols[0]}</span><span>{cols[1]}</span>
    </div>
  )
}
