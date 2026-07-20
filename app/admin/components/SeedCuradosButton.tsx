"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

/**
 * Admin-only: creates the curated set of 15 example markets (photos, one event,
 * binary + multiple, this-week + months) via /api/admin/seed-curados. Idempotent
 * server-side, so re-clicking just skips what already exists.
 */
export default function SeedCuradosButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")

  async function seed() {
    if (!confirm("Criar 15 mercados de exemplo (esportes, essa semana e meses) com fotos?")) return
    setLoading(true); setMsg("")
    const res = await fetch("/api/admin/seed-curados", { method: "POST" })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setMsg(data.error || "Erro"); return }
    const c = data.created?.length ?? 0
    const s = data.skipped?.length ?? 0
    setMsg(`${c} criados${s ? ` · ${s} já existiam` : ""}`)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={seed} disabled={loading}
        className="rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
        {loading ? "Criando..." : "Criar 15 mercados de exemplo"}
      </button>
      {msg && <span className="text-xs" style={{ color: "var(--text-2)" }}>{msg}</span>}
    </div>
  )
}
