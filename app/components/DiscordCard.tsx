"use client"
import { useEffect, useState } from "react"

const KEY = "previx_discord_card_dismissed"
const DISCORD_URL = "https://discord.gg/Mv4y8P4bXG"

/**
 * Discord invite card for the home right sidebar (Kalshi-Pro slot).
 * Dismissible with × — the choice is kept only for the browser session
 * (sessionStorage), never localStorage, so it reappears in a new session.
 */
export default function DiscordCard() {
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
    <div
      className="relative overflow-hidden"
      style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
    >
      {/* Dismiss */}
      <button
        onClick={dismiss}
        aria-label="Dispensar"
        className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full transition-colors"
        style={{ background: "rgba(0,0,0,0.35)", color: "#fff" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {/* Banner image (add public/previx_discord.svg) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/previx_discord.svg" alt="Comunidade PrevixLance no Discord" className="block w-full" style={{ display: "block" }} />

      {/* CTA */}
      <div className="p-3">
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener"
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#00c076,#009e64)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.028zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          Entrar no Discord
        </a>
      </div>
    </div>
  )
}
