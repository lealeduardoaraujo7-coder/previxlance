"use client"
import { useState, type FormEvent, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { QRCodeSVG } from "qrcode.react"

const QUICK_VALUES = [10, 25, 50, 100, 250, 500]

type Method = "pix" | "boleto"

function formatCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

function formatPhone(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2")
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState("")

  useEffect(() => {
    const end = new Date(expiresAt + "T23:59:59").getTime()

    function update() {
      const diff = end - Date.now()
      if (diff <= 0) { setRemaining("Expirado"); return }
      const m = Math.floor((diff / 60000) % 60)
      const s = Math.floor((diff / 1000) % 60)
      setRemaining(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`)
    }

    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [expiresAt])

  return (
    <span className={remaining === "Expirado" ? "text-red-500" : "text-emerald-600 dark:text-emerald-400 font-mono font-bold"}>
      {remaining}
    </span>
  )
}

export default function DepositarPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()

  const [method, setMethod] = useState<Method>("pix")
  const [amount, setAmount] = useState("")
  const [cpf, setCpf] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  // After PIX is generated
  const [pixData, setPixData] = useState<{
    qrcode: string
    expiresAt: string
    amount: number
    transactionId: number
  } | null>(null)

  // After Boleto is generated
  const [boletoData, setBoletoData] = useState<{
    url: string | null
    line: string | null
    expiresAt: string
    amount: number
    transactionId: number
  } | null>(null)

  const amountCents = Math.round(parseFloat(amount || "0") * 100)
  const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  // Poll for payment confirmation (works for both PIX and Boleto — the status
  // route matches by transaction reference, regardless of method).
  const pendingRef = pixData?.transactionId ?? boletoData?.transactionId ?? null
  useEffect(() => {
    if (pendingRef == null) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/depositar/status?ref=${pendingRef}`)
        const data = await res.json()
        if (data.status === "COMPLETED") {
          clearInterval(interval)
          await update()
          setPixData(null)
          setBoletoData(null)
          router.push("/?deposito=ok")
        }
      } catch {}
    }, 4000)
    return () => clearInterval(interval)
  }, [pendingRef])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (amountCents < 500) { setError("Valor mínimo: R$ 5,00"); return }
    const cpfClean = cpf.replace(/\D/g, "")
    if (cpfClean.length !== 11) { setError("CPF inválido"); return }
    const phoneClean = phone.replace(/\D/g, "")
    if (phoneClean.length < 10) { setError("Telefone inválido"); return }

    setLoading(true)
    setError("")

    const endpoint = method === "pix" ? "/api/depositar" : "/api/depositar/boleto"
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountCents, cpf: cpfClean, phone: phoneClean }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || (method === "pix" ? "Erro ao gerar PIX" : "Erro ao gerar boleto"))
      return
    }

    if (method === "pix") {
      setPixData({
        qrcode: data.qrcode,
        expiresAt: data.expiresAt,
        amount: data.amount,
        transactionId: data.transactionId,
      })
    } else {
      setBoletoData({
        url: data.url ?? null,
        line: data.line ?? null,
        expiresAt: data.expiresAt,
        amount: data.amount,
        transactionId: data.transactionId,
      })
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  if (status === "loading") return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
    </div>
  )
  if (status === "unauthenticated") { router.push("/login"); return null }

  // ── PIX QR Code screen ──
  if (pixData) return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold mb-4"
          style={{ background: "rgba(0,200,83,0.1)", color: "#00C853" }}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Aguardando pagamento
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-0)" }}>
          {brl(pixData.amount)}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          Expira em <CountdownTimer expiresAt={pixData.expiresAt} />
        </p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-5">
        <div className="rounded-2xl p-4 shadow-lg" style={{ background: "#fff" }}>
          <QRCodeSVG
            value={pixData.qrcode}
            size={220}
            bgColor="#ffffff"
            fgColor="#111111"
            level="M"
          />
        </div>
      </div>

      {/* Copia e Cola */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--card-2)", border: "1px solid var(--border-2)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-2)" }}>
          PIX Copia e Cola
        </p>
        <p className="text-xs font-mono break-all mb-3 leading-relaxed" style={{ color: "var(--text-1)" }}>
          {pixData.qrcode.slice(0, 60)}...
        </p>
        <button onClick={() => copyText(pixData.qrcode)}
          className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all"
          style={{
            background: copied ? "#00C853" : "var(--card)",
            border: "1px solid var(--border-2)",
            color: copied ? "#fff" : "var(--text-0)",
          }}>
          {copied ? "✓ Copiado!" : "Copiar código PIX"}
        </button>
      </div>

      {/* Steps */}
      <div className="rounded-2xl p-4 mb-4 space-y-2.5" style={{ background: "var(--card-2)", border: "1px solid var(--border-2)" }}>
        {[
          "Abra o app do seu banco",
          "Vá em Pix → Pagar com QR Code",
          "Escaneie o QR ou cole o código",
          "Confirme o pagamento",
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="flex-shrink-0 h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: "rgba(0,200,83,0.15)", color: "#00C853" }}>
              {i + 1}
            </span>
            <span className="text-sm" style={{ color: "var(--text-1)" }}>{step}</span>
          </div>
        ))}
      </div>

      <button onClick={() => setPixData(null)}
        className="w-full rounded-xl py-2.5 text-sm transition-colors"
        style={{ color: "var(--text-2)" }}>
        ← Voltar
      </button>
    </div>
  )

  // ── Boleto screen ──
  if (boletoData) return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold mb-4"
          style={{ background: "rgba(0,200,83,0.1)", color: "#00C853" }}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Aguardando pagamento
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-0)" }}>
          {brl(boletoData.amount)}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          Vence em {new Date(boletoData.expiresAt + "T12:00:00").toLocaleDateString("pt-BR")}
        </p>
      </div>

      {/* Linha digitável */}
      {boletoData.line && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--card-2)", border: "1px solid var(--border-2)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-2)" }}>
            Linha digitável
          </p>
          <p className="text-xs font-mono break-all mb-3 leading-relaxed" style={{ color: "var(--text-1)" }}>
            {boletoData.line}
          </p>
          <button onClick={() => copyText(boletoData.line!)}
            className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all"
            style={{
              background: copied ? "#00C853" : "var(--card)",
              border: "1px solid var(--border-2)",
              color: copied ? "#fff" : "var(--text-0)",
            }}>
            {copied ? "✓ Copiado!" : "Copiar linha digitável"}
          </button>
        </div>
      )}

      {/* Link para o boleto (PDF) */}
      {boletoData.url && (
        <a href={boletoData.url} target="_blank" rel="noopener noreferrer"
          className="block w-full text-center rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 mb-4"
          style={{ background: "linear-gradient(135deg,#00c076,#009e64)" }}>
          Abrir boleto (PDF)
        </a>
      )}

      {!boletoData.line && !boletoData.url && (
        <div className="rounded-xl px-4 py-3 text-sm mb-4"
          style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", color: "#a16207" }}>
          O boleto está sendo registrado. Atualize em alguns segundos para ver a linha digitável.
        </div>
      )}

      {/* Steps */}
      <div className="rounded-2xl p-4 mb-4 space-y-2.5" style={{ background: "var(--card-2)", border: "1px solid var(--border-2)" }}>
        {[
          "Copie a linha digitável ou abra o PDF",
          "Abra o app do seu banco",
          "Vá em Pagar → Boleto",
          "O saldo é creditado após a compensação",
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="flex-shrink-0 h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: "rgba(0,200,83,0.15)", color: "#00C853" }}>
              {i + 1}
            </span>
            <span className="text-sm" style={{ color: "var(--text-1)" }}>{step}</span>
          </div>
        ))}
      </div>

      <button onClick={() => setBoletoData(null)}
        className="w-full rounded-xl py-2.5 text-sm transition-colors"
        style={{ color: "var(--text-2)" }}>
        ← Voltar
      </button>
    </div>
  )

  // ── Deposit form ──
  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-0)" }}>Depositar</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>
        {method === "pix" ? "Adicione saldo via PIX instantâneo" : "Adicione saldo via boleto bancário"}
      </p>

      {/* Método de pagamento */}
      <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-xl" style={{ background: "var(--card-2)", border: "1px solid var(--border-2)" }}>
        {([["pix", "PIX"], ["boleto", "Boleto"]] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => { setMethod(key); setError("") }}
            className="rounded-lg py-2 text-sm font-semibold transition-all"
            style={{
              background: method === key ? "linear-gradient(135deg,#00c076,#009e64)" : "transparent",
              color: method === key ? "#fff" : "var(--text-2)",
            }}>
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
            Valor (R$)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold" style={{ color: "var(--text-2)" }}>R$</span>
            <input
              type="number" min="5" step="0.01" required
              value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-xl pl-12 pr-4 py-3.5 text-xl font-bold focus:outline-none"
              style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-0)" }}
            />
          </div>
          <div className="mt-2.5 flex gap-2 flex-wrap">
            {QUICK_VALUES.map(v => (
              <button key={v} type="button" onClick={() => setAmount(String(v))}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: amount === String(v) ? "rgba(0,200,83,0.12)" : "var(--card-2)",
                  border: `1px solid ${amount === String(v) ? "#00C853" : "var(--border-2)"}`,
                  color: amount === String(v) ? "#00C853" : "var(--text-2)",
                }}>
                R$ {v}
              </button>
            ))}
          </div>
        </div>

        {/* CPF */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
            CPF
          </label>
          <input
            type="text" required
            value={cpf}
            onChange={e => setCpf(formatCPF(e.target.value))}
            placeholder="000.000.000-00"
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
            style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-0)" }}
          />
          <p className="mt-1 text-[11px]" style={{ color: "var(--text-2)" }}>
            Necessário para identificação do pagamento
          </p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-1)" }}>
            Telefone
          </label>
          <input
            type="text" required
            value={phone}
            onChange={e => setPhone(formatPhone(e.target.value))}
            placeholder="(11) 99999-9999"
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
            style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-0)" }}
          />
        </div>

        {/* Summary — no deposit fee */}
        {amountCents >= 500 && (
          <div className="rounded-xl p-3.5 text-xs space-y-1.5" style={{ background: "var(--card-2)", border: "1px solid var(--border-2)" }}>
            <div className="flex justify-between" style={{ color: "var(--text-2)" }}>
              <span>Você deposita</span>
              <span className="font-semibold" style={{ color: "var(--text-0)" }}>{brl(amountCents)}</span>
            </div>
            <div className="flex justify-between" style={{ color: "var(--text-2)" }}>
              <span>Taxa de depósito</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Grátis</span>
            </div>
            <div className="border-t pt-1.5 flex justify-between font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-0)" }}>
              <span>Saldo creditado</span>
              <span className="text-emerald-600 dark:text-emerald-400">{brl(amountCents)}</span>
            </div>
            {method === "boleto" && (
              <p className="pt-1 text-[11px]" style={{ color: "var(--text-2)" }}>
                Boleto pode levar até 1-2 dias úteis para compensar.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading || amountCents < 500}
          className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-50 hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#00c076,#009e64)" }}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              {method === "pix" ? "Gerando PIX..." : "Gerando boleto..."}
            </span>
          ) : method === "pix"
            ? `Gerar PIX de ${amountCents >= 500 ? brl(amountCents) : "..."}`
            : `Gerar boleto de ${amountCents >= 500 ? brl(amountCents) : "..."}`}
        </button>
      </form>
    </div>
  )
}
