"use client"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"

interface Comment {
  id: string
  text: string
  gifUrl?: string | null
  createdAt: string
  user: { id: string; name: string | null; image: string | null }
  _count: { likes: number }
}

/* ── Avatar ─────────────────────────────────────────────────────────── */
function Avatar({ user, size = 36 }: { user: { name: string | null; image: string | null }; size?: number }) {
  const initials = (user.name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name ?? ""}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-black"
      style={{
        width: size, height: size,
        background: "var(--green-dim)",
        color: "var(--green)",
        fontSize: size * 0.35,
      }}
    >
      {initials}
    </div>
  )
}

/* ── GIF Picker ──────────────────────────────────────────────────────── */
const QUICK_CATEGORIES = ["trending", "futebol", "político", "cripto", "ganhou", "perdeu"]

function GifPicker({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [q, setQ] = useState("")
  const [gifs, setGifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/gif?q=${encodeURIComponent(q || "trending")}`)
        const data = await res.json()
        setGifs(data.results ?? [])
      } catch {
        setGifs([])
      }
      setLoading(false)
    }, q ? 400 : 0)
    return () => clearTimeout(timer)
  }, [q])

  return (
    <div
      className="absolute bottom-full mb-2 left-0 right-0 z-50 rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border-2)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}
    >
      {/* Search bar */}
      <div className="p-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--text-2)" }}>
              🔍
            </span>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar GIFs..."
              className="w-full rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none"
              style={{
                background: "var(--card-2)",
                border: "1px solid var(--border)",
                color: "var(--text-0)",
              }}
            />
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-lg transition-colors"
            style={{ background: "var(--card-2)", color: "var(--text-2)" }}
          >
            ×
          </button>
        </div>

        {/* Quick categories */}
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {QUICK_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setQ(cat === "trending" ? "" : cat)}
              className="rounded-lg px-2.5 py-1 text-[10px] font-semibold capitalize transition-all"
              style={q === cat || (cat === "trending" && !q)
                ? { background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(0,192,118,0.25)" }
                : { background: "var(--card-2)", color: "var(--text-2)", border: "1px solid var(--border)" }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GIF grid */}
      <div className="overflow-y-auto" style={{ height: 220 }}>
        {loading ? (
          <div className="grid grid-cols-4 gap-1.5 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg animate-pulse"
                style={{ background: "var(--card-2)" }}
              />
            ))}
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8" style={{ color: "var(--text-2)" }}>
            <span className="text-3xl mb-2">🎭</span>
            <p className="text-xs">Nenhum GIF encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 p-3">
            {gifs.map((gif) => {
              const url = gif.media?.[0]?.gif?.url ?? gif.media?.[0]?.tinygif?.url
              if (!url) return null
              return (
                <button
                  key={gif.id}
                  onClick={() => { onSelect(url); onClose() }}
                  className="rounded-lg overflow-hidden aspect-square transition-all hover:scale-105 hover:ring-2"
                  style={{ "--tw-ring-color": "var(--green)" } as any}
                >
                  <img src={url} alt={gif.title ?? "gif"} className="w-full h-full object-cover" loading="lazy" />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-3 py-1.5 text-center text-[9px]"
        style={{ borderTop: "1px solid var(--border)", color: "var(--text-2)" }}
      >
        Powered by Tenor
      </div>
    </div>
  )
}

/* ── Time helper ────────────────────────────────────────────────────── */
function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return "agora"
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

/* ── CommentSection ──────────────────────────────────────────────────── */
export default function CommentSection({ marketId }: { marketId: string }) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState("")
  const [selectedGif, setSelectedGif] = useState<string | null>(null)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch(`/api/mercados/${marketId}/comentarios`)
      .then((r) => r.json())
      .then(setComments)
      .catch(() => {})
  }, [marketId])

  async function handleSubmit() {
    if (!text.trim() && !selectedGif) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/mercados/${marketId}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, gifUrl: selectedGif }),
      })
      const c = await res.json()
      if (res.ok) {
        setComments((prev) => [c, ...prev])
        setText("")
        setSelectedGif(null)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLike(commentId: string) {
    if (!session) return
    const res = await fetch(`/api/mercados/${marketId}/comentarios/${commentId}/curtir`, { method: "POST" })
    const data = await res.json()
    setLikedIds((prev) => {
      const next = new Set(prev)
      data.liked ? next.add(commentId) : next.delete(commentId)
      return next
    })
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, _count: { likes: c._count.likes + (data.liked ? 1 : -1) } }
          : c
      )
    )
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-2"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-1)" }}>
          Discussão
        </h2>
        {comments.length > 0 && (
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "var(--card-2)", color: "var(--text-2)" }}
          >
            {comments.length}
          </span>
        )}
      </div>

      {/* Comment compose */}
      <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
        {session ? (
          <div className="relative">
            <div className="flex gap-3">
              <Avatar user={session.user as any} size={36} />
              <div className="flex-1 min-w-0">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="O que você acha deste mercado?"
                  rows={2}
                  maxLength={500}
                  className="w-full resize-none rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-colors"
                  style={{
                    background: "var(--card-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-0)",
                  }}
                />

                {/* GIF preview */}
                {selectedGif && (
                  <div className="relative mt-2 inline-block">
                    <img src={selectedGif} alt="gif" className="rounded-xl max-h-28 object-contain" />
                    <button
                      onClick={() => setSelectedGif(null)}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Actions row */}
                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowGifPicker(!showGifPicker)}
                      className="rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all"
                      style={showGifPicker
                        ? { background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(0,192,118,0.25)" }
                        : { background: "var(--card-2)", color: "var(--text-2)", border: "1px solid var(--border)" }
                      }
                    >
                      GIF
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {text.length > 380 && (
                      <span className="text-[10px] tabular-nums" style={{ color: text.length > 470 ? "var(--red)" : "var(--text-2)" }}>
                        {500 - text.length}
                      </span>
                    )}
                    <span className="text-[9px]" style={{ color: "var(--text-2)" }}>⌘↵</span>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || (!text.trim() && !selectedGif)}
                      className="rounded-xl px-4 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg, #00c076, #009e64)" }}
                    >
                      {submitting ? "..." : "Publicar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {showGifPicker && (
              <GifPicker onSelect={setSelectedGif} onClose={() => setShowGifPicker(false)} />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 py-1">
            <div
              className="h-9 w-9 rounded-full flex-shrink-0"
              style={{ background: "var(--card-2)", border: "1px solid var(--border)" }}
            />
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              <a href="/login" className="font-semibold hover:underline" style={{ color: "var(--green)" }}>
                Entre na sua conta
              </a>{" "}
              para participar da discussão.
            </p>
          </div>
        )}
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12" style={{ color: "var(--text-2)" }}>
          <span className="text-3xl mb-2">💬</span>
          <p className="text-xs">Seja o primeiro a comentar!</p>
        </div>
      ) : (
        <div>
          {comments.map((c, i) => {
            const liked = likedIds.has(c.id)
            return (
              <div
                key={c.id}
                className="px-5 py-4 transition-colors hover:bg-white/[0.015]"
                style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}
              >
                <div className="flex gap-3">
                  <Avatar user={c.user} size={34} />
                  <div className="flex-1 min-w-0">
                    {/* Name + time */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-sm font-bold" style={{ color: "var(--text-0)" }}>
                        {c.user.name ?? "Usuário"}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-2)" }}>
                        {timeAgo(c.createdAt)}
                      </span>
                    </div>

                    {/* Text */}
                    {c.text && (
                      <p className="text-sm leading-relaxed break-words" style={{ color: "var(--text-1)" }}>
                        {c.text}
                      </p>
                    )}

                    {/* GIF */}
                    {c.gifUrl && (
                      <img
                        src={c.gifUrl}
                        alt="gif"
                        className="mt-2 rounded-xl max-h-44 object-contain"
                        loading="lazy"
                      />
                    )}

                    {/* Like */}
                    <button
                      onClick={() => handleLike(c.id)}
                      className="mt-2 flex items-center gap-1.5 text-xs transition-all rounded-lg px-2 py-1"
                      style={liked
                        ? { background: "var(--red-dim)", color: "var(--red)" }
                        : { color: "var(--text-2)" }
                      }
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill={liked ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="font-semibold tabular-nums">
                        {c._count.likes > 0 ? c._count.likes : ""}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
