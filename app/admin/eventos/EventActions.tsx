"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function EventActions({ id, title, childCount }: { id: string; title: string; childCount: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function del() {
    const warn = childCount > 0
      ? `Excluir o evento "${title}"?\n\nIsto vai desvincular ${childCount} mercado(s), que voltarão a aparecer soltos na home. Os mercados NÃO serão apagados.`
      : `Excluir o evento "${title}"?`
    if (!confirm(warn)) return
    setLoading(true)
    const res = await fetch(`/api/admin/eventos/${id}`, { method: "DELETE" })
    setLoading(false)
    if (res.ok) router.refresh()
  }

  return (
    <button onClick={del} disabled={loading}
      className="rounded-lg px-3 py-1.5 text-xs border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50">
      {loading ? "..." : "Excluir"}
    </button>
  )
}
