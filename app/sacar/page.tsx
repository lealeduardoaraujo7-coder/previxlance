"use client"
import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

const QUICK_VALUES = [20, 50, 100, 200, 500]
function brl(cents: number) { return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) }

export default function SacarPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [amount, setAmount] = useState("")
  const [pixKey, setPixKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const amountCents = Math.round(parseFloat(amount || "0") * 100)
  const balance = session?.user?.balance ?? 0
  const fee = Math.round(amountCents * 0.01)
  const net = amountCents - fee

  async function handleWithdraw(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (amountCents < 2000) { setError("Valor mínimo: R$ 20,00"); return }
    if (amountCents > balance) { setError("Saldo insuficiente"); return }
    setLoading(true); setError("")
    const res = await fetch("/api/sacar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountCents, pixKey }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || "Erro ao solicitar saque"); return }
    await update({ balance: data.balance })
    setSuccess(true)
  }

  if (status === "loading") return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center"><p className="text-gray-400">Carregando...</p></div>
  if (status === "unauthenticated") { router.push("/login"); return null }

  if (success) return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 text-5xl">⏳</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Saque solicitado!</h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">Seu saque está em análise. O PIX será enviado em até 24h após aprovação.</p>
        <button onClick={() => router.push("/perfil")} className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors">
          Ver meu perfil
        </button>
      </div>
    </div>
  )

  const inputClass = "w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Sacar</h1>
      <p className="text-sm text-gray-500 dark:text-zinc-400 mb-8">Retire seu saldo via PIX</p>
      <div className="mb-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
        <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">Saldo disponível</p>
        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{brl(balance)}</p>
      </div>
      <form onSubmit={handleWithdraw} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Valor (R$)</label>
          <input type="number" min="20" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0,00" className={`${inputClass} text-lg font-semibold`} />
          <div className="mt-2 flex gap-2 flex-wrap">
            {QUICK_VALUES.map((v) => (
              <button key={v} type="button" onClick={() => setAmount(String(v))}
                className="rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-1 text-xs text-gray-500 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                R${v}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Chave PIX para recebimento</label>
          <input type="text" value={pixKey} onChange={(e) => setPixKey(e.target.value)} required placeholder="CPF, email ou telefone" className={inputClass} />
        </div>
        {amountCents >= 2000 && (
          <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-zinc-400">Valor solicitado</span>
              <span className="text-gray-900 dark:text-white">{brl(amountCents)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-zinc-400">Taxa (1%)</span>
              <span className="text-red-500 dark:text-red-400">-{brl(fee)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-200 dark:border-zinc-700 pt-2">
              <span className="text-gray-700 dark:text-zinc-200 font-medium">Você recebe</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{brl(net)}</span>
            </div>
          </div>
        )}
        {error && <p className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button type="submit" disabled={loading || amountCents < 2000 || amountCents > balance} className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50 transition-colors">
          {loading ? "Processando..." : "Solicitar saque"}
        </button>
      </form>
    </div>
  )
}
