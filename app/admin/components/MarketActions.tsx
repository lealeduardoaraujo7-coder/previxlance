"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import ConfirmDialog from "@/app/components/ConfirmDialog"

interface Props {
  marketId: string
  status: string
  betCount: number
  featured?: boolean
}

export default function MarketActions({ marketId, status, betCount, featured = false }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [isFeatured, setIsFeatured] = useState(featured)
  const [starLoading, setStarLoading] = useState(false)
  const [confirmKind, setConfirmKind] = useState<"delete" | "cancel" | null>(null)

  const canFeature = status === "OPEN"

  async function toggleFeatured() {
    if (!canFeature || starLoading) return
    const next = !isFeatured
    setIsFeatured(next)        // optimistic
    setStarLoading(true)
    setError("")
    const res = await fetch(`/api/admin/mercados/${marketId}/destaque`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: next }),
    })
    setStarLoading(false)
    if (!res.ok) {
      setIsFeatured(!next)     // revert
      const data = await res.json().catch(() => ({}))
      setError(data.error || "Erro ao destacar")
      return
    }
    router.refresh()
  }

  async function sendAction(action: string) {
    setLoading(action)
    setError("")
    const res = await fetch(`/api/admin/mercados/${marketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    setLoading(null)
    if (!res.ok) { setError(data.error || "Erro"); return }
    router.refresh()
  }

  async function doDelete() {
    setLoading("delete")
    setError("")
    const res = await fetch(`/api/admin/mercados/${marketId}`, { method: "DELETE" })
    const data = await res.json()
    setLoading(null)
    setConfirmKind(null)
    if (!res.ok) { setError(data.error || "Erro ao excluir"); return }
    router.refresh()
  }

  async function doCancel() {
    setConfirmKind(null)
    await sendAction("cancel")
  }

  function runConfirm() {
    if (confirmKind === "delete") doDelete()
    else if (confirmKind === "cancel") doCancel()
  }

  const btn = "rounded-lg px-3 py-1.5 text-xs transition-colors disabled:opacity-50"

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5 flex-wrap justify-end items-center">
        {/* Estrela de destaque — só para mercados abertos */}
        <button
          onClick={toggleFeatured}
          disabled={!canFeature || starLoading}
          title={canFeature ? (isFeatured ? "Remover dos destaques" : "Destacar na home") : "Só mercados abertos podem ser destacados"}
          className={`rounded-lg p-1.5 transition-colors ${canFeature ? "hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer" : "opacity-30 cursor-not-allowed"}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"
            fill={isFeatured ? "#10b981" : "none"}
            stroke={isFeatured ? "#10b981" : "currentColor"}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={isFeatured ? "" : "text-gray-400 dark:text-zinc-500"}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>

        {/* Editar — sempre disponível exceto RESOLVED/CANCELLED */}
        {status !== "RESOLVED" && status !== "CANCELLED" && (
          <a href={`/admin/mercados/${marketId}/editar`}
            className={`${btn} border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600 hover:text-gray-700 dark:hover:text-zinc-200`}>
            Editar
          </a>
        )}

        {/* Fechar (OPEN → CLOSED) */}
        {status === "OPEN" && (
          <button onClick={() => sendAction("close")} disabled={loading !== null}
            className={`${btn} border border-yellow-300 dark:border-yellow-700 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-500/10`}>
            {loading === "close" ? "..." : "Fechar"}
          </button>
        )}

        {/* Reabrir (CLOSED → OPEN) */}
        {status === "CLOSED" && (
          <button onClick={() => sendAction("reopen")} disabled={loading !== null}
            className={`${btn} border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10`}>
            {loading === "reopen" ? "..." : "Reabrir"}
          </button>
        )}

        {/* Resolver (OPEN ou CLOSED) */}
        {(status === "OPEN" || status === "CLOSED") && (
          <a href={`/admin/mercados/${marketId}/resolver`}
            className={`${btn} border border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10`}>
            Resolver
          </a>
        )}

        {/* Cancelar (OPEN ou CLOSED) */}
        {(status === "OPEN" || status === "CLOSED") && (
          <button onClick={() => setConfirmKind("cancel")} disabled={loading !== null}
            className={`${btn} border border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10`}>
            {loading === "cancel" ? "..." : "Cancelar"}
          </button>
        )}

        {/* Excluir */}
        <button onClick={() => setConfirmKind("delete")} disabled={loading !== null}
          className={`${btn} border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10`}>
          {loading === "delete" ? "..." : "Excluir"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400 text-right">{error}</p>}

      <ConfirmDialog
        open={confirmKind === "delete"}
        danger
        title="Excluir mercado?"
        message={`${betCount > 0 ? `Este mercado tem ${betCount} aposta(s). ` : ""}Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={loading === "delete"}
        onConfirm={runConfirm}
        onCancel={() => setConfirmKind(null)}
      />

      <ConfirmDialog
        open={confirmKind === "cancel"}
        danger
        title="Cancelar mercado?"
        message={betCount > 0
          ? `As ${betCount} aposta(s) serão reembolsadas aos apostadores.`
          : "O mercado será cancelado."}
        confirmLabel="Cancelar mercado"
        cancelLabel="Voltar"
        loading={loading === "cancel"}
        onConfirm={runConfirm}
        onCancel={() => setConfirmKind(null)}
      />
    </div>
  )
}
