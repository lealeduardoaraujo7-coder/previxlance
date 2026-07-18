"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ApproveButtons({ transactionId }: { transactionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null)

  async function handle(action: "approve" | "reject") {
    setLoading(action)
    await fetch("/api/admin/saques", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId, action }),
    })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => handle("approve")} disabled={loading !== null}
        className="flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50 transition-colors">
        {loading === "approve" ? "Aprovando..." : "Aprovar"}
      </button>
      <button onClick={() => handle("reject")} disabled={loading !== null}
        className="flex-1 rounded-xl border border-red-300 dark:border-red-700 py-2 text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 transition-colors">
        {loading === "reject" ? "Rejeitando..." : "Rejeitar"}
      </button>
    </div>
  )
}
