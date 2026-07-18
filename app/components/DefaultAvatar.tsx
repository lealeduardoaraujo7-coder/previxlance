/** Instagram/X-style default avatar: grey silhouette on a soft grey circle. */
export default function DefaultAvatar({ size = 40, muted = false }: { size?: number; muted?: boolean }) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size, background: muted ? "var(--card-2)" : "#e4e6eb", opacity: muted ? 0.7 : 1 }}
    >
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="15.5" r="6.5" fill="#b0b4bb" />
        <path d="M7 34c0-7.2 5.8-12 13-12s13 4.8 13 12" fill="#b0b4bb" />
      </svg>
    </div>
  )
}
