"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function SaveButton({ marketId, initialSaved }: { marketId: string; initialSaved: boolean }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!session) { router.push("/login"); return }
    setLoading(true)
    const res = await fetch(`/api/mercados/${marketId}/salvar`, { method: "POST" })
    const data = await res.json()
    if (res.ok) setSaved(data.saved)
    setLoading(false)
  }

  return (
    <button onClick={toggle} disabled={loading} title={saved ? "Remover dos salvos" : "Salvar mercado"}
      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
        saved
          ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500 hover:border-gray-300 dark:hover:border-zinc-600 hover:text-gray-600 dark:hover:text-zinc-300"
      }`}>
      <svg className="h-4 w-4" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {saved ? "Salvo" : "Salvar"}
    </button>
  )
}
