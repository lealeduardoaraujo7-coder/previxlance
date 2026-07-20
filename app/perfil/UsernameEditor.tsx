"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"

/** Public @handle editor. First 2 changes are free; the 3rd+ needs 30 days. */
export default function UsernameEditor({
  currentUsername,
  changes,
}: {
  currentUsername: string | null
  changes: number
}) {
  const { update } = useSession()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentUsername ?? "")
  const [username, setUsername] = useState(currentUsername ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState<string | null>(null)

  const isProvisional = !!username && username.startsWith("user_")
  const freeLeft = Math.max(0, 2 - changes)

  async function save() {
    setError(""); setInfo(null); setLoading(true)
    const res = await fetch("/api/perfil/username", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: value }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || "Erro ao salvar"); return }
    setUsername(data.username)
    setEditing(false)
    setInfo(data.aviso ?? (data.trocasRestantes > 0 ? `Trocas grátis restantes: ${data.trocasRestantes}` : null))
    await update({ username: data.username })
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-0)" }}>
          @{username || "..."}
        </h1>
        <button onClick={() => { setValue(username); setEditing(true); setError(""); setInfo(null) }}
          className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
          style={{ background: "var(--card-2)", color: "var(--text-1)", border: "1px solid var(--border)" }}>
          Editar
        </button>
        {isProvisional && (
          <span className="text-[11px] px-2 py-1 rounded-lg" style={{ background: "var(--green-dim)", color: "var(--green)" }}>
            Personalize seu @nome de usuário
          </span>
        )}
        {info && <span className="text-[11px]" style={{ color: "var(--text-2)" }}>{info}</span>}
      </div>
    )
  }

  return (
    <div className="max-w-sm">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: "var(--text-2)" }}>@</span>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value.toLowerCase())}
            placeholder="nome_de_usuario"
            maxLength={20}
            className="w-full rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none"
            style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-0)" }}
          />
        </div>
        <button onClick={save} disabled={loading}
          className="rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#00c076,#009e64)" }}>
          {loading ? "..." : "Salvar"}
        </button>
        <button onClick={() => { setEditing(false); setError("") }}
          className="rounded-xl px-3 py-2.5 text-sm" style={{ color: "var(--text-2)" }}>
          Cancelar
        </button>
      </div>
      <p className="text-[11px] mt-1.5" style={{ color: "var(--text-2)" }}>
        3–20 caracteres: letras, números ou _ · {freeLeft > 0 ? `${freeLeft} troca(s) grátis` : "próxima troca exige 30 dias"}
      </p>
      {error && <p className="text-xs mt-1" style={{ color: "var(--red)" }}>{error}</p>}
    </div>
  )
}
