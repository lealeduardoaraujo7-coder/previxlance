"use client"
import { useEffect, useState } from "react"
import { signIn, getProviders } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"

type Mode = "login" | "signup"

/** Opens the auth modal from anywhere: window.dispatchEvent(new CustomEvent("previx:auth", { detail: { mode } })) */
export default function AuthModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>("login")
  const [emailStep, setEmailStep] = useState(false)
  const [providers, setProviders] = useState<Record<string, unknown> | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => { getProviders().then((p) => setProviders(p as any)).catch(() => {}) }, [])

  useEffect(() => {
    function onOpen(e: Event) {
      const m = (e as CustomEvent).detail?.mode === "signup" ? "signup" : "login"
      setMode(m); setEmailStep(false); setError(""); setEmail(""); setPassword(""); setOpen(true)
    }
    window.addEventListener("previx:auth", onOpen as EventListener)
    return () => window.removeEventListener("previx:auth", onOpen as EventListener)
  }, [])

  function close() { if (!loading) setOpen(false) }

  async function oauth(provider: "google" | "apple") {
    if (!providers?.[provider]) {
      setError(provider === "apple"
        ? "Login com Apple ainda não está configurado."
        : "Login com Google ainda não está configurado.")
      return
    }
    signIn(provider, { callbackUrl: "/" })
  }

  async function emailSubmit() {
    setError(""); setLoading(true)
    if (mode === "signup") {
      const reg = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: email.split("@")[0], email, password }),
      })
      const data = await reg.json().catch(() => ({}))
      if (!reg.ok) { setLoading(false); setError(data.error || "Erro ao cadastrar"); return }
    }
    const res = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    if (res?.error) { setError("E-mail ou senha inválidos"); return }
    setOpen(false)
    router.refresh()
  }

  const title = mode === "login" ? "Conecte-se" : "Inscrever-se"
  const emailBtn = mode === "login" ? "Continuar com o e-mail" : "Cadastre-se com seu e-mail"

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
          onClick={close} style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
          <motion.div onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            className="w-full max-w-[400px] rounded-2xl p-6 shadow-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border-2)" }}>

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ color: "var(--text-0)" }}>{title}</h2>
              <button onClick={close} aria-label="Fechar" style={{ color: "var(--text-2)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>

            {!emailStep ? (
              <div className="space-y-2.5">
                {/* Google */}
                <button onClick={() => oauth("google")}
                  className="flex w-full items-center justify-center gap-3 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "#111" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 2.9 14.7 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.4 12 20.4c5.9 0 9.8-4.1 9.8-9.9 0-.7-.1-1.2-.2-1.7H12z"/></svg>
                  Continuar com o Google
                </button>
                {/* Apple */}
                <button onClick={() => oauth("apple")}
                  className="flex w-full items-center justify-center gap-3 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "#111" }}>
                  <svg width="16" height="18" viewBox="0 0 384 512" fill="#fff"><path d="M318.7 268c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-92.6zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                  Continue com a Apple
                </button>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1" style={{ background: "var(--border-2)" }} />
                  <span className="text-xs" style={{ color: "var(--text-2)" }}>ou</span>
                  <div className="h-px flex-1" style={{ background: "var(--border-2)" }} />
                </div>

                <button onClick={() => { setEmailStep(true); setError("") }}
                  className="w-full rounded-xl py-3 text-sm font-semibold transition-colors"
                  style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-0)" }}>
                  {emailBtn}
                </button>

                {error && <p className="text-xs text-center" style={{ color: "var(--red)" }}>{error}</p>}
              </div>
            ) : (
              <div className="space-y-3">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-0)" }} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha (mín. 6)"
                  onKeyDown={(e) => { if (e.key === "Enter") emailSubmit() }}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-0)" }} />
                {mode === "login" && (
                  <a href="/suporte" className="block text-xs" style={{ color: "var(--green)" }}>Esqueceu sua senha?</a>
                )}
                {error && <p className="text-xs" style={{ color: "var(--red)" }}>{error}</p>}
                <button onClick={emailSubmit} disabled={loading || !email || password.length < 6}
                  className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#00c076,#009e64)" }}>
                  {loading ? "..." : mode === "login" ? "Entrar" : "Criar conta"}
                </button>
                <button onClick={() => { setEmailStep(false); setError("") }} className="w-full text-xs" style={{ color: "var(--text-2)" }}>← Voltar</button>
              </div>
            )}

            {/* Switch mode */}
            <p className="text-xs text-center mt-5" style={{ color: "var(--text-2)" }}>
              {mode === "login" ? "Novo por aqui? " : "Já tem conta? "}
              <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setEmailStep(false); setError("") }}
                className="font-semibold" style={{ color: "var(--green)" }}>
                {mode === "login" ? "Inscreva-se" : "Conecte-se"}
              </button>
            </p>
            <p className="text-[10px] text-center mt-3 leading-relaxed" style={{ color: "var(--text-2)" }}>
              Ao continuar, você concorda com os <a href="/termos" className="underline">Termos</a> e a Política de Privacidade.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Helper to trigger the modal from any client component. */
export function openAuth(mode: Mode = "login") {
  window.dispatchEvent(new CustomEvent("previx:auth", { detail: { mode } }))
}
