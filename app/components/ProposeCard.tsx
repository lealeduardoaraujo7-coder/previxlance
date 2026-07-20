"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

const KEY = "previx_propose_card_dismissed"

/**
 * "Propose a market" announcement for the home right sidebar (below the Discord
 * card). Highlights the R$0,50 reward for each proposal the admin approves.
 * Dismissible for the browser session only (sessionStorage, no localStorage).
 */
export default function ProposeCard() {
  const [dismissed, setDismissed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setDismissed(sessionStorage.getItem(KEY) === "1")
    setReady(true)
  }, [])

  function dismiss() {
    sessionStorage.setItem(KEY, "1")
    setDismissed(true)
  }

  if (!ready || dismissed) return null

  return (
    <div className="relative overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}>
      <button onClick={dismiss} aria-label="Dispensar"
        className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full transition-colors"
        style={{ background: "rgba(0,0,0,0.35)", color: "#fff" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

      {/* Banner */}
      <div className="relative px-4 pt-5 pb-4" style={{ background: "linear-gradient(135deg,#0b3b2a 0%,#0f5138 55%,#127a4f 100%)" }}>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-3" style={{ background: "rgba(255,255,255,0.14)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
          </svg>
        </div>
        <h3 className="text-[17px] font-bold text-white leading-tight">Proponha um mercado</h3>
        <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.82)" }}>
          Tem uma boa ideia de aposta? Sugira um mercado — se for aprovado pela equipe, você ganha saldo.
        </p>
        <span className="inline-flex items-center gap-1.5 mt-3 rounded-full px-2.5 py-1 text-[12px] font-bold"
          style={{ background: "rgba(255,255,255,0.16)", color: "#fff" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
          Ganhe R$0,50 por mercado aprovado
        </span>
      </div>

      {/* CTA */}
      <div className="p-3">
        <Link href="/criar-mercado"
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#00c076,#009e64)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          Propor mercado
        </Link>
      </div>
    </div>
  )
}
