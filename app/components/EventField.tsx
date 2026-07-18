"use client"
import { useEffect, useState } from "react"
import ImageUpload from "@/app/components/ImageUpload"

type Ev = { id: string; title: string }

/**
 * Optional event picker for market forms. When an event is selected, a short
 * label (required) and a per-line image (optional) appear. The parent submits
 * `eventId`, `shortLabel` and `shortImageUrl`; the API enforces the label too.
 */
export function EventField({
  eventId, onEventId, shortLabel, onShortLabel, shortImageUrl, onShortImageUrl, inputClass,
}: {
  eventId: string
  onEventId: (id: string) => void
  shortLabel: string
  onShortLabel: (s: string) => void
  shortImageUrl: string
  onShortImageUrl: (s: string) => void
  inputClass: string
}) {
  const [events, setEvents] = useState<Ev[]>([])

  useEffect(() => {
    fetch("/api/admin/eventos").then((r) => r.json()).then((e) => {
      if (Array.isArray(e)) setEvents(e.map((x: any) => ({ id: x.id, title: x.title })))
    }).catch(() => {})
  }, [])

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Evento (opcional)</label>
      <select value={eventId} onChange={(e) => onEventId(e.target.value)} className={inputClass}>
        <option value="">Nenhum — mercado avulso</option>
        {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
      </select>

      {eventId && (
        <div className="mt-2 space-y-2">
          <input
            type="text"
            value={shortLabel}
            onChange={(e) => onShortLabel(e.target.value)}
            placeholder="Rótulo curto (ex: LOUD)"
            className={inputClass}
          />
          <p className="text-[11px]" style={{ color: "var(--text-2)" }}>
            Como aparece no card do evento. Obrigatório.
          </p>
          <label className="block text-xs font-medium" style={{ color: "var(--text-1)" }}>Imagem da linha (opcional)</label>
          <ImageUpload value={shortImageUrl} onChange={onShortImageUrl} />
        </div>
      )}
    </div>
  )
}
