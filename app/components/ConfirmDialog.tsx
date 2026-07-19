"use client"
import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"

interface Props {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * App-style confirmation modal — replaces the native window.confirm().
 * Theme-aware (uses the site CSS tokens), animated, closes on Esc / backdrop.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, loading, onCancel])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => !loading && onCancel()}
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 360, damping: 26 }}
            className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border-2)" }}
          >
            {/* Icon */}
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                background: danger ? "rgba(239,68,68,0.12)" : "rgba(0,200,83,0.12)",
                color: danger ? "#ef4444" : "#00C853",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {danger ? (
                  <>
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </>
                ) : (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </>
                )}
              </svg>
            </div>

            <h2 className="text-center text-lg font-bold mb-1.5" style={{ color: "var(--text-0)" }}>
              {title}
            </h2>
            {message && (
              <p className="text-center text-sm mb-6 leading-relaxed" style={{ color: "var(--text-2)" }}>
                {message}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-1)" }}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-all disabled:opacity-60"
                style={{
                  background: danger
                    ? "linear-gradient(135deg,#ef4444,#dc2626)"
                    : "linear-gradient(135deg,#00c076,#009e64)",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Aguarde...
                  </span>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
