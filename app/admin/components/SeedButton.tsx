"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SeedButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")

  async function seed() {
    if (!confirm("Popular o banco com mercados de exemplo?")) return
    setLoading(true); setMsg("")
    const res = await fetch("/api/admin/seed", { method: "POST" })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setMsg(data.error || "Erro"); return }
    setMsg(`${data.created?.length ?? 0} mercados criados`)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={seed} disabled={loading}
        className="rounded-xl border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors disabled:opacity-50">
        {loading ? "Populando..." : "Popular com dados de exemplo"}
      </button>
      {msg && <span className="text-xs" style={{ color: "var(--text-2)" }}>{msg}</span>}
    </div>
  )
}
