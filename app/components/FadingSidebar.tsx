"use client"
import { useEffect, useRef, useState } from "react"

/**
 * Home right-sidebar wrapper. The announcement cards fade out as the user
 * scrolls the page down, then fade back in when they scroll near the top —
 * they "somem com a página" instead of staying pinned. Not sticky.
 *
 * Opacity goes 1 → 0 over FADE_PX of scroll; below ~0.05 we drop pointer
 * events so the invisible cards can't be clicked.
 */
const FADE_PX = 380

export default function FadingSidebar({ children }: { children: React.ReactNode }) {
  const [opacity, setOpacity] = useState(1)
  const raf = useRef(0)

  useEffect(() => {
    function update() {
      const y = window.scrollY
      setOpacity(Math.max(0, Math.min(1, 1 - y / FADE_PX)))
    }
    function onScroll() {
      cancelAnimationFrame(raf.current)
      raf.current = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <div
      className="space-y-4"
      style={{
        opacity,
        transform: `translateY(${(1 - opacity) * -8}px)`,
        transition: "opacity 120ms linear, transform 120ms linear",
        pointerEvents: opacity < 0.05 ? "none" : "auto",
      }}
    >
      {children}
    </div>
  )
}
