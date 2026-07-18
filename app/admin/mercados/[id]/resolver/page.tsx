"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

export default function ResolverMercadoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [market, setMarket] = useState<any>(null)
  const [selectedOption, setSelectedOption] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/admin/mercados/${id}`).then((r) => r.json()).then(setMarket)
  }, [id])

  async function handleResolve() {
    if (!selectedOption) return
    setLoading(true); setError("")
    const res = await fetch(`/api/admin/mercados/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolution: selectedOption }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || "Erro ao resolver mercado"); setLoading(false); return }
    router.push("/admin"); router.refresh()
  }

  if (!market) return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="text-gray-400 dark:text-zinc-500">Carregando...</p>
    </div>
  )

  if (market.status !== "OPEN" && market.status !== "CLOSED") return (
    <div className="flex min-h-[50vh] items-center justify-center flex-col gap-3">
      <p className="text-gray-500 dark:text-zinc-400">Este mercado não pode ser resolvido.</p>
      <a href="/admin" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">← Voltar ao painel</a>
    </div>
  )

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200">← Voltar</Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Resolver Mercado</h1>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 mb-6 shadow-sm">
        <p className="text-gray-900 dark:text-white font-medium">{market.title}</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
          {market._count?.bets ?? 0} apostas · Pool: R$ {((market.totalPool ?? 0) / 100).toFixed(2)}
        </p>
      </div>

      <div className="space-y-3 mb-6">
        <p className="text-sm text-gray-500 dark:text-zinc-400">Selecione o resultado correto:</p>
        {market.options?.map((opt: any) => (
          <button
            key={opt.id}
            onClick={() => setSelectedOption(opt.label)}
            className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
              selectedOption === opt.label
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800"
            }`}
          >
            <span className="font-medium">{opt.label}</span>
            <span className="ml-2 text-xs text-gray-400 dark:text-zinc-500">
              {opt.totalBet ? `R$ ${(opt.totalBet / 100).toFixed(2)}` : "R$ 0,00"}
            </span>
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        onClick={handleResolve}
        disabled={!selectedOption || loading}
        className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50 transition-colors"
      >
        {loading ? "Resolvendo e distribuindo prêmios..." : "Confirmar Resolução"}
      </button>
    </div>
  )
}
