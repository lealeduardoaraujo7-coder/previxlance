"use client"
import { useRef, useState } from "react"
import { useSession } from "next-auth/react"

export default function FotoUpload({ currentImage }: { currentImage?: string | null }) {
  const { update } = useSession()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(currentImage ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")
    setLoading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/perfil/foto", { method: "POST", body: fd })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || "Erro no upload"); return }
    setPreview(data.url)
    await update()
    if (inputRef.current) inputRef.current.value = ""
  }

  const initials = "EU"

  return (
    <div className="flex items-center gap-4 mb-8">
      <button onClick={() => inputRef.current?.click()} disabled={loading} className="relative group flex-shrink-0">
        {preview ? (
          <img src={preview} alt="Foto de perfil" className="h-16 w-16 rounded-full object-cover border-2 border-gray-200 dark:border-zinc-700" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center border-2 border-gray-200 dark:border-zinc-700">
            <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{initials}</span>
          </div>
        )}
        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        {loading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          </div>
        )}
      </button>
      <div>
        <button onClick={() => inputRef.current?.click()} disabled={loading}
          className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
          {loading ? "Enviando..." : "Alterar foto de perfil"}
        </button>
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">JPG, PNG, WebP ou GIF · Máx 5MB</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
