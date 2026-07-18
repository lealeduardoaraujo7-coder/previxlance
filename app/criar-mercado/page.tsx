"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ImageUpload from "@/app/components/ImageUpload"

type Cat = { slug: string; name: string; color: string | null }

export default function CriarMercadoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const [categories, setCategories] = useState<Cat[]>([])

  useEffect(() => {
    fetch("/api/categorias").then((r) => r.json()).then((c) => { if (Array.isArray(c)) setCategories(c) }).catch(() => {})
  }, [])

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "outros",
    type: "BINARY",
    closesAt: "",
    imageUrl: "",
  })
  const [options, setOptions] = useState(["", ""])

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  function addOption() { if (options.length < 8) setOptions(o => [...o, ""]) }
  function removeOption(i: number) { if (options.length > 2) setOptions(o => o.filter((_, idx) => idx !== i)) }
  function setOption(i: number, v: string) { setOptions(o => o.map((x, idx) => idx === i ? v : x)) }

  const canNext1 = form.title.trim().length >= 10 && form.category && form.closesAt
  const canNext2 = form.type === "BINARY" || options.filter(o => o.trim()).length >= 2

  async function submit() {
    setLoading(true)
    setError("")
    try {
      const body: any = { ...form }
      if (form.type === "MULTIPLE") body.options = options.filter(o => o.trim())
      const res = await fetch("/api/mercados/propor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      let data: any = {}
      try { data = await res.json() } catch { /* API returned non-JSON */ }
      if (!res.ok) { setError(data.error ?? `Erro ${res.status} ao enviar proposta.`); return }
      setDone(true)
    } catch (err) {
      setError("Erro de conexão. Verifique sua internet e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") return null

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-center max-w-sm px-6">
        <div className="text-5xl mb-5">🔒</div>
        <h1 className="text-xl font-black mb-2" style={{ color: "var(--text-0)" }}>Faça login para continuar</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-1)" }}>
          Você precisa de uma conta para propor um mercado.
        </p>
        <Link href="/login" className="inline-block rounded-xl px-6 py-3 text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg,#00c076,#009e64)" }}>
          Entrar na conta
        </Link>
      </div>
    </div>
  )

  if (done) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-center max-w-sm px-6">
        <div className="mb-5 h-20 w-20 rounded-3xl flex items-center justify-center text-4xl mx-auto"
          style={{ background: "var(--green-dim)", border: "1px solid rgba(0,192,118,0.3)" }}>
          ✅
        </div>
        <h1 className="text-2xl font-black mb-2" style={{ color: "var(--text-0)" }}>Proposta enviada!</h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-1)" }}>
          Seu mercado foi enviado para análise. Nossa equipe vai revisar e aprovar em até <strong>24 horas</strong>.
          Você será notificado quando ele estiver ao vivo.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setDone(false); setStep(1); setForm({ title:"",description:"",category:"outros",type:"BINARY",closesAt:"",imageUrl:"" }); setOptions(["",""]) }}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold"
            style={{ background: "var(--card)", color: "var(--text-1)", border: "1px solid var(--border-2)" }}>
            Propor outro
          </button>
          <Link href="/" className="rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#00c076,#009e64)" }}>
            Ver mercados
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-2xl px-4 py-12">

        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium mb-6"
            style={{ color: "var(--text-2)" }}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar aos mercados
          </Link>
          <h1 className="text-3xl font-black mb-2" style={{ color: "var(--text-0)" }}>Propor um mercado</h1>
          <p className="text-sm" style={{ color: "var(--text-1)" }}>
            Crie uma pergunta e deixe a comunidade votar. Sua proposta passa por aprovação antes de ir ao ar.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-black transition-all"
                style={step >= s
                  ? { background: "var(--green)", color: "#fff" }
                  : { background: "var(--card-2)", color: "var(--text-2)", border: "1px solid var(--border)" }
                }
              >
                {step > s ? "✓" : s}
              </div>
              <span className="text-xs font-semibold hidden sm:block"
                style={{ color: step >= s ? "var(--text-0)" : "var(--text-2)" }}>
                {s === 1 ? "Detalhes" : s === 2 ? "Opções" : "Revisar"}
              </span>
              {s < 3 && <div className="h-px flex-1 w-8" style={{ background: "var(--border)" }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 sm:p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>

          {/* ── Step 1: Detalhes ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-2)" }}>
                  Pergunta do mercado *
                </label>
                <textarea
                  value={form.title}
                  onChange={e => set("title", e.target.value)}
                  placeholder="Ex: O Brasil vai ganhar a Copa do Mundo 2026?"
                  rows={2}
                  maxLength={200}
                  className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition-colors"
                  style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-0)" }}
                />
                <p className="text-[10px] mt-1 text-right" style={{ color: form.title.length > 160 ? "var(--red)" : "var(--text-2)" }}>
                  {form.title.length}/200
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-2)" }}>
                  Descrição (opcional)
                </label>
                <textarea
                  value={form.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder="Contexto, fontes ou critérios de resolução..."
                  rows={3}
                  maxLength={1000}
                  className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition-colors"
                  style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-0)" }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-2)" }}>
                  Categoria *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {categories.map(c => (
                    <button
                      key={c.slug}
                      onClick={() => set("category", c.slug)}
                      className="rounded-xl py-2.5 text-xs font-semibold flex flex-col items-center gap-1.5 transition-all"
                      style={form.category === c.slug
                        ? { background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(0,192,118,0.3)" }
                        : { background: "var(--card-2)", color: "var(--text-1)", border: "1px solid var(--border)" }
                      }
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color ?? "var(--border-2)" }} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-2)" }}>
                    Tipo *
                  </label>
                  <div className="flex gap-2">
                    {[["BINARY","SIM / NÃO"],["MULTIPLE","Múltiplo"]].map(([v,l]) => (
                      <button key={v} onClick={() => set("type", v)}
                        className="flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all"
                        style={form.type === v
                          ? { background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(0,192,118,0.3)" }
                          : { background: "var(--card-2)", color: "var(--text-1)", border: "1px solid var(--border)" }
                        }>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-2)" }}>
                    Fecha em *
                  </label>
                  <input
                    type="datetime-local"
                    value={form.closesAt}
                    min={new Date(Date.now() + 3600_000).toISOString().slice(0,16)}
                    onChange={e => set("closesAt", e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-0)" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-2)" }}>
                  Imagem (opcional)
                </label>
                <ImageUpload value={form.imageUrl} onChange={url => set("imageUrl", url)} />
              </div>
            </div>
          )}

          {/* ── Step 2: Opções ── */}
          {step === 2 && (
            <div className="space-y-5">
              {form.type === "BINARY" ? (
                <div>
                  <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-1)" }}>
                    Mercado binário — as opções são automaticamente <strong>SIM</strong> e <strong>NÃO</strong>.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {["SIM","NÃO"].map((o,i) => (
                      <div key={o} className="rounded-xl px-4 py-4 text-center"
                        style={{ background: i === 0 ? "var(--green-dim)" : "var(--red-dim)",
                          border: `1px solid ${i === 0 ? "rgba(0,192,118,0.3)" : "rgba(255,92,92,0.3)"}` }}>
                        <p className="text-lg font-black" style={{ color: i === 0 ? "var(--green)" : "var(--red)" }}>{o}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--text-2)" }}>50% inicial</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-2)" }}>
                    Opções (mín. 2, máx. 8)
                  </label>
                  <div className="space-y-2.5">
                    {options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                          style={{ background: "var(--green-dim)", color: "var(--green)" }}>
                          {i + 1}
                        </div>
                        <input
                          value={opt}
                          onChange={e => setOption(i, e.target.value)}
                          placeholder={`Opção ${i + 1}`}
                          maxLength={80}
                          className="flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                          style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-0)" }}
                        />
                        {options.length > 2 && (
                          <button onClick={() => removeOption(i)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                            style={{ background: "var(--red-dim)", color: "var(--red)" }}>
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {options.length < 8 && (
                    <button onClick={addOption}
                      className="mt-3 w-full rounded-xl py-2.5 text-xs font-semibold transition-colors"
                      style={{ background: "var(--card-2)", color: "var(--text-2)", border: "1px dashed var(--border-2)" }}>
                      + Adicionar opção
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Revisar ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="rounded-xl p-4" style={{ background: "var(--card-2)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-2)" }}>Resumo da proposta</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--text-2)" }}>Pergunta</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-0)" }}>{form.title}</p>
                  </div>
                  {form.description && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--text-2)" }}>Descrição</p>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-1)" }}>{form.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    {[
                      { label: "Categoria", value: categories.find(c => c.slug === form.category)?.name },
                      { label: "Tipo", value: form.type === "BINARY" ? "SIM / NÃO" : "Múltiplo" },
                      { label: "Fecha em", value: form.closesAt ? new Date(form.closesAt).toLocaleDateString("pt-BR") : "—" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--text-2)" }}>{label}</p>
                        <p className="text-xs font-semibold" style={{ color: "var(--text-0)" }}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-2)" }}>Opções</p>
                    <div className="flex gap-2 flex-wrap">
                      {form.type === "BINARY"
                        ? ["SIM","NÃO"].map(o => (
                            <span key={o} className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                              style={{ background: "var(--green-dim)", color: "var(--green)" }}>{o}</span>
                          ))
                        : options.filter(o => o.trim()).map((o,i) => (
                            <span key={i} className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                              style={{ background: "var(--card)", color: "var(--text-1)", border: "1px solid var(--border-2)" }}>{o}</span>
                          ))
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "rgba(0,192,118,0.06)", border: "1px solid rgba(0,192,118,0.2)" }}>
                <span className="text-lg flex-shrink-0 mt-0.5">ℹ️</span>
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--green)" }}>Processo de aprovação</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-1)" }}>
                    Sua proposta será revisada pela nossa equipe em até 24 horas. Podemos editar o título ou descrição para clareza antes de publicar.
                  </p>
                </div>
              </div>

              {error && (
                <div className="rounded-xl p-3 text-xs font-medium" style={{ background: "var(--red-dim)", color: "var(--red)", border: "1px solid rgba(255,77,77,0.25)" }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => setStep(s => s - 1)}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
              style={{ visibility: step > 1 ? "visible" : "hidden",
                background: "var(--card-2)", color: "var(--text-1)", border: "1px solid var(--border-2)" }}
            >
              ← Voltar
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 ? !canNext1 : !canNext2}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#00c076,#009e64)" }}
              >
                Continuar →
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={loading}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#00c076,#009e64)", boxShadow: "0 4px 20px rgba(0,192,118,0.35)" }}
              >
                {loading ? "Enviando..." : "Enviar proposta ✓"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
