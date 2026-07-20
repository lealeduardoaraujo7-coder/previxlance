"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

const KEY = "previx_propose_card_dismissed"

/**
 * "Propose a market" announcement for the home right sidebar (below the Discord
 * card). Banner art lives in /public/previx_propor.svg — swap that file to
 * change the artwork. Highlights the R$0,50 reward for each approved proposal.
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

      {/* Banner art — replace /public/previx_propor.svg to change it */}
      <img src="/previx_propor.svg" alt="Proponha um mercado" className="block w-full" draggable={false} />

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
