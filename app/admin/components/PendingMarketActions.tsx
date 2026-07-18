"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  marketId: string
}

export default function PendingMarketActions({ marketId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function sendAction(action: "approve" | "reject") {
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

  const btn = "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        <button onClick={() => sendAction("approve")} disabled={loading !== null}
          className={`${btn} border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10`}>
          {loading === "approve" ? "..." : "Aprovar"}
        </button>
        <button onClick={() => sendAction("reject")} disabled={loading !== null}
          className={`${btn} border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10`}>
          {loading === "reject" ? "..." : "Rejeitar"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  )
}
