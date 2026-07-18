"use client"
import { useEffect, useState } from "react"

interface TickerItem {
  id: string
  label: string
  text: string
  color: string
}

export default function LiveTicker() {
  const [items, setItems] = useState<TickerItem[]>([])

  useEffect(() => {
    fetch("/api/manchete")
      .then((r) => r.json())
      .then((data: TickerItem[]) => { if (Array.isArray(data)) setItems(data) })
      .catch(() => {})
  }, [])

  if (items.length === 0) return null

  const doubled = [...items, ...items]

  return (
    <div
      className="overflow-hidden border-b"
      style={{ background: "var(--card)", borderColor: "var(--border)", height: 34 }}
    >
      <div className="ticker-track h-full flex items-center">
        {doubled.map((item, i) => (
          <div key={`${item.id}-${i}`} className="flex items-center gap-2 px-6 whitespace-nowrap">
            <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: item.color }} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: item.color }} />
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: item.color }}>
              {item.label}
            </span>
            <span className="text-[11px]" style={{ color: "var(--text-1)" }}>{item.text}</span>
            <span className="mx-3" style={{ color: "var(--border-2)" }}>·</span>
          </div>
        ))}
      </div>
    </div>
  )
}
