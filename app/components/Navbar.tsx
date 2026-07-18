"use client"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { useTranslation, type Lang } from "./TranslationProvider"

const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: "pt-BR", label: "Português (BR)", flag: "🇧🇷" },
  { code: "en",    label: "English",         flag: "🇺🇸" },
  { code: "es",    label: "Español",          flag: "🇪🇸" },
]

type TrendingMarket = {
  id: string
  title: string
  category: string
  imageUrl: string | null
  totalPool: number
  options: { label: string; totalBet: number }[]
  _count: { bets: number }
}

const CAT_STYLE: Record<string, { bg: string; emoji: string }> = {
  futebol:        { bg: "linear-gradient(135deg,#1b5e20,#43a047)", emoji: "⚽" },
  politica:       { bg: "linear-gradient(135deg,#0d47a1,#1976d2)", emoji: "🗳️" },
  economia:       { bg: "linear-gradient(135deg,#004d40,#00897b)", emoji: "📈" },
  entretenimento: { bg: "linear-gradient(135deg,#4a148c,#8e24aa)", emoji: "🎬" },
  esportes:       { bg: "linear-gradient(135deg,#0369a1,#0ea5e9)", emoji: "🎮" },
  outros:         { bg: "linear-gradient(135deg,#37474f,#607d8b)", emoji: "💡" },
}

function MarketThumb({ market }: { market: TrendingMarket }) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const style = CAT_STYLE[market.category] ?? CAT_STYLE.outros
  const showImg = market.imageUrl && !errored

  return (
    <div className="relative flex-shrink-0 overflow-hidden rounded-xl"
      style={{ width: 44, height: 44, background: style.bg, boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
      {showImg && (
        <img
          src={market.imageUrl!}
          alt=""
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-300"
          style={{ opacity: loaded ? 1 : 0, filter: loaded ? "none" : "blur(6px)" }}
        />
      )}
      {(!showImg || !loaded) && (
        <span className="absolute inset-0 flex items-center justify-center text-xl select-none"
          style={{ opacity: showImg ? 0 : 1, transition: "opacity 0.3s" }}>
          {style.emoji}
        </span>
      )}
    </div>
  )
}

function SearchBar({ className = "" }: { className?: string }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [q, setQ] = useState("")
  const [focused, setFocused] = useState(false)
  const [trending, setTrending] = useState<TrendingMarket[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (focused && trending.length === 0) {
      fetch("/api/tendencias").then(r => r.json()).then(setTrending).catch(() => {})
    }
  }, [focused])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setFocused(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => { document.removeEventListener("mousedown", handleClick); document.removeEventListener("keydown", handleKey) }
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = q.trim()
    setFocused(false)
    router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/")
  }

  const showDropdown = focused && !q.trim() && trending.length > 0

  function brl(n: number) { return (n / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) }

  function topPct(m: TrendingMarket) {
    const top = m.options[0]
    if (!top || m.totalPool === 0) return null
    return Math.round((top.totalBet / m.totalPool) * 100)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSearch}>
        <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
          <svg className="h-4 w-4" style={{ color: "var(--text-2)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={t("nav.search")}
          className="w-full rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none transition-colors"
          style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-0)" }}
        />
        {!focused && (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <kbd className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: "var(--border)", color: "var(--text-2)" }}>/</kbd>
          </div>
        )}
      </form>

      {showDropdown && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 rounded-2xl overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--border-2)", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-2)" }}>
              Em alta agora
            </span>
            <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>

          {/* Market rows */}
          <div className="pb-2">
            {trending.map((m) => {
              const pct = topPct(m)
              const top = m.options[0]
              return (
                <button
                  key={m.id}
                  onClick={() => { setFocused(false); router.push(`/mercados/${m.id}`) }}
                  className="group flex items-center gap-3 w-full px-3 py-2.5 text-left transition-all duration-150 hover:bg-gray-50 dark:hover:bg-zinc-800/70"
                >
                  {/* Thumbnail */}
                  <MarketThumb market={m} />

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug truncate transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                      style={{ color: "var(--text-0)" }}>
                      {m.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md"
                        style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
                        {m.category.charAt(0) + m.category.slice(1).toLowerCase()}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--text-2)" }}>
                        {m._count.bets} apostas
                      </span>
                    </div>
                  </div>

                  {/* Right: probability */}
                  {pct !== null && top && (
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums" style={{ color: "#00C853" }}>{pct}%</p>
                      <p className="text-[10px] leading-tight" style={{ color: "var(--text-2)" }}>{top.label}</p>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t" style={{ borderColor: "var(--border)" }}>
            <button onClick={handleSearch}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
              Ver todos os mercados →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const isDark = theme === "dark"
  return (
    <button onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800"
      style={{ color: "var(--text-1)" }}>
      <span className="flex items-center gap-2">
        {isDark
          ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        }
        {isDark ? t("nav.lightMode") : t("nav.darkMode")}
      </span>
      <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isDark ? "bg-emerald-500" : "bg-gray-200"}`}>
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isDark ? "translate-x-4.5" : "translate-x-0.5"}`} />
      </div>
    </button>
  )
}

function LanguageSelector() {
  const { lang, setLang, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]

  if (open) return (
    <div>
      <button onClick={() => setOpen(false)}
        className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800"
        style={{ color: "var(--text-2)" }}>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        {t("nav.language")}
      </button>
      {LANGUAGES.map((l) => (
        <button key={l.code} onClick={() => { setLang(l.code); setOpen(false) }}
          className={`flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm transition-colors ${lang === l.code ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" : "hover:bg-gray-50 dark:hover:bg-zinc-800"}`}
          style={lang !== l.code ? { color: "var(--text-1)" } : {}}>
          <span className="text-base">{l.flag}</span>
          <span>{l.label}</span>
          {lang === l.code && <svg className="h-3.5 w-3.5 ml-auto text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
        </button>
      ))}
    </div>
  )

  return (
    <button onClick={() => setOpen(true)}
      className="flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800"
      style={{ color: "var(--text-1)" }}>
      <span className="flex items-center gap-2">
        <svg className="h-4 w-4" style={{ color: "var(--text-2)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
        </svg>
        {t("nav.language")}
      </span>
      <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-2)" }}>
        {current.flag} {current.code.toUpperCase()}
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </span>
    </button>
  )
}

function DropdownMenu({ session, onClose }: { session: any; onClose: () => void }) {
  const { t } = useTranslation()
  const balance = session.user.balance ?? 0
  const brl = (n: number) => (n / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  const link = "block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800"

  return (
    <div className="absolute right-0 mt-2 w-64 rounded-2xl overflow-hidden shadow-2xl z-50" style={{ background: "var(--card)", border: "1px solid var(--border-2)" }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--card-2)" }}>
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-0)" }}>{session.user.name ?? "Usuário"}</p>
        <p className="text-xs truncate" style={{ color: "var(--text-2)" }}>{session.user.email}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--text-2)" }}>{t("nav.balance")}</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{brl(balance)}</span>
        </div>
      </div>

      <div className="p-1.5">
        {[
          { href: "/classificacao", icon: "M8 21h8M12 17v4M6 4h12v4a6 6 0 01-12 0V4M6 4H3v1.5A3.5 3.5 0 006.5 9M18 4h3v1.5A3.5 3.5 0 0117.5 9", label: "Classificação" },
          { href: "/perfil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", label: t("nav.myProfile") },
          { href: "/apostas", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", label: t("nav.myBets") },
          { href: "/criar-mercado", icon: "M12 4v16m8-8H4", label: "Propor mercado" },
          { href: "/depositar", icon: "M12 4v16m8-8H4", label: t("nav.deposit") },
          { href: "/sacar", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z", label: t("nav.withdraw") },
        ].map(({ href, icon, label }) => (
          <Link key={href} href={href} onClick={onClose} className={link} style={{ color: "var(--text-1)" }}>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0" style={{ color: "var(--text-2)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
              {label}
            </span>
          </Link>
        ))}
      </div>

      <div className="p-1.5 border-t" style={{ borderColor: "var(--border)" }}>
        <ThemeToggle />
        <LanguageSelector />
      </div>

      <div className="p-1.5 border-t" style={{ borderColor: "var(--border)" }}>
        <Link href="/como-funciona" onClick={onClose} className={link} style={{ color: "var(--text-1)" }}>{t("nav.howItWorks")}</Link>
        <Link href="/termos" onClick={onClose} className={link} style={{ color: "var(--text-1)" }}>{t("nav.terms")}</Link>
        <Link href="/suporte" onClick={onClose} className={link} style={{ color: "var(--text-1)" }}>{t("nav.support")}</Link>
      </div>

      <div className="p-1.5 border-t" style={{ borderColor: "var(--border)" }}>
        {session.user.role === "ADMIN" && (
          <Link href="/admin" onClick={onClose} className="block rounded-lg px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
            {t("nav.admin")}
          </Link>
        )}
        <button onClick={() => { onClose(); signOut() }}
          className="w-full text-left rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
          {t("nav.signOut")}
        </button>
      </div>
    </div>
  )
}

function CategoryBarInner() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const activeCategory = searchParams.get("categoria") ?? "TODOS"
  const activeStatus   = searchParams.get("status")   ?? "OPEN"
  const isHome         = pathname === "/"
  const sortNew        = searchParams.get("sort") === "novo"

  // Tendências + Novo are fixed tabs; the rest come from the DB (showInNav).
  const [navCats, setNavCats] = useState<{ label: string; value: string }[]>([])
  useEffect(() => {
    fetch("/api/categorias")
      .then((r) => r.json())
      .then((cats: any[]) => {
        if (Array.isArray(cats)) {
          setNavCats(cats.filter((c) => c.showInNav).map((c) => ({ label: c.name, value: c.slug })))
        }
      })
      .catch(() => {})
  }, [])

  const items = [
    { label: "Tendências", value: "TODOS" },
    { label: "Novo", value: "NOVO" },
    ...navCats,
  ]

  return (
    <div
      className="flex items-center overflow-x-auto"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none", flexWrap: "nowrap" }}
    >
      {items.map((cat) => {
        const href = cat.value === "NOVO"
          ? `/?categoria=TODOS&sort=novo&status=${activeStatus}`
          : `/?categoria=${cat.value}&status=${activeStatus}`

        const isActive = isHome && (
          cat.value === "NOVO"
            ? sortNew
            : activeCategory === cat.value && !sortNew
        )

        return (
          <Link
            key={cat.value}
            href={href}
            className="flex-shrink-0 px-4 py-3 text-sm transition-colors whitespace-nowrap border-b-2"
            style={{
              color: isActive ? "var(--text-0)" : "var(--text-2)",
              fontWeight: isActive ? 700 : 500,
              borderBottomColor: isActive ? "#00C853" : "transparent",
            }}
          >
            {cat.label}
          </Link>
        )
      })}
    </div>
  )
}

function CategoryBar() {
  return (
    <div className="border-t" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Suspense fallback={
          <div className="flex gap-2 py-3">
            {["Tendências", "Novo"].map(c => (
              <span key={c} className="px-4 text-sm font-medium" style={{ color: "var(--text-2)" }}>{c}</span>
            ))}
          </div>
        }>
          <CategoryBarInner />
        </Suspense>
      </div>
    </div>
  )
}

export function Navbar() {
  const { data: session } = useSession()
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const balance = session?.user?.balance ?? 0
  const brl = (n: number) => (n / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  function closeAll() { setMenuOpen(false); setMobileOpen(false) }

  return (
    <header className="sticky top-0 z-50" style={{ background: "var(--card)" }}>
      {/* ── Top bar ── */}
      <div className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-3">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 mr-2" onClick={closeAll}>
              <div className="flex items-center justify-center rounded-[9px] flex-shrink-0"
                style={{ width: 34, height: 34, background: "linear-gradient(135deg,#00C853,#1B5E20)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <polyline points="4,18 9,12 14,15 20,6" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="16,6 20,6 20,10" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1 }}>
                <span style={{ color: "var(--text-0)" }}>Previx</span><span style={{ color: "#00C853" }}>Lance</span>
              </span>
            </Link>

            {/* Search — grows to fill space */}
            <div className="hidden md:block flex-1 max-w-xl">
              <SearchBar />
            </div>

            {/* Right nav — desktop */}
            <div className="hidden md:flex items-center gap-2 ml-auto flex-shrink-0">
              {session ? (
                <>
                  <Link href="/depositar"
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                    {brl(balance)}
                    <span style={{ color: "var(--text-2)" }} className="mx-1">·</span>
                    {t("nav.deposit")}
                  </Link>
                  <div className="relative">
                    <button onClick={() => setMenuOpen(!menuOpen)}
                      className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors"
                      style={{ borderColor: "var(--border-2)", background: "var(--card-2)", color: "var(--text-0)" }}>
                      <span>{session.user.name?.split(" ")[0] ?? "Conta"}</span>
                      <svg className="h-3.5 w-3.5" style={{ color: "var(--text-2)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {menuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                        <div className="relative z-50">
                          <DropdownMenu session={session} onClose={closeAll} />
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/classificacao"
                    className="text-sm transition-colors"
                    style={{ color: "var(--text-1)" }}>
                    Classificação
                  </Link>
                  <Link href="/como-funciona"
                    className="flex items-center gap-1 text-sm transition-colors"
                    style={{ color: "var(--text-1)" }}>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {t("nav.howItWorks")}
                  </Link>
                  <ThemeToggleInline />
                  <Link href="/login"
                    className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
                    style={{ color: "var(--text-0)" }}>
                    {t("nav.signIn")}
                  </Link>
                  <Link href="/register"
                    className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,#00c076,#009e64)" }}>
                    {t("nav.signUp")}
                  </Link>
                </>
              )}

              {/* Hamburger */}
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
                style={{ color: "var(--text-1)" }}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Mobile right */}
            <div className="flex md:hidden items-center gap-2 ml-auto">
              {session && (
                <Link href="/depositar" className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{brl(balance)}</Link>
              )}
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
                style={{ color: "var(--text-1)" }}>
                {mobileOpen
                  ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category bar ── */}
      <CategoryBar />

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="border-b px-4 py-3 space-y-1" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="pb-2"><SearchBar /></div>
          <Link href="/" onClick={closeAll} className="block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800" style={{ color: "var(--text-1)" }}>{t("nav.markets")}</Link>
          <Link href="/classificacao" onClick={closeAll} className="block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800" style={{ color: "var(--text-1)" }}>Classificação</Link>
          <Link href="/como-funciona" onClick={closeAll} className="block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800" style={{ color: "var(--text-1)" }}>{t("nav.howItWorks")}</Link>
          {session ? (
            <>
              <Link href="/perfil" onClick={closeAll} className="block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800" style={{ color: "var(--text-1)" }}>{t("nav.myProfile")}</Link>
              <Link href="/apostas" onClick={closeAll} className="block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800" style={{ color: "var(--text-1)" }}>{t("nav.myBets")}</Link>
              <Link href="/criar-mercado" onClick={closeAll} className="block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800" style={{ color: "var(--text-1)" }}>Propor mercado</Link>
              <Link href="/depositar" onClick={closeAll} className="block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800" style={{ color: "var(--text-1)" }}>{t("nav.deposit")}</Link>
              <Link href="/sacar" onClick={closeAll} className="block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800" style={{ color: "var(--text-1)" }}>{t("nav.withdraw")}</Link>
              {session.user.role === "ADMIN" && (
                <Link href="/admin" onClick={closeAll} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-gray-50 dark:hover:bg-zinc-800">{t("nav.admin")}</Link>
              )}
              <div className="pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                <ThemeToggle />
                <LanguageSelector />
              </div>
              <div className="border-t pt-1 space-y-1" style={{ borderColor: "var(--border)" }}>
                <Link href="/termos" onClick={closeAll} className="block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800" style={{ color: "var(--text-2)" }}>{t("nav.terms")}</Link>
                <Link href="/suporte" onClick={closeAll} className="block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800" style={{ color: "var(--text-2)" }}>{t("nav.support")}</Link>
              </div>
              <button onClick={() => { closeAll(); signOut() }} className="w-full text-left rounded-lg px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                {t("nav.signOut")}
              </button>
            </>
          ) : (
            <>
              <div className="pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                <ThemeToggle />
                <LanguageSelector />
              </div>
              <div className="border-t pt-1 space-y-1" style={{ borderColor: "var(--border)" }}>
                <Link href="/termos" onClick={closeAll} className="block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800" style={{ color: "var(--text-2)" }}>{t("nav.terms")}</Link>
                <Link href="/suporte" onClick={closeAll} className="block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800" style={{ color: "var(--text-2)" }}>{t("nav.support")}</Link>
              </div>
              <div className="flex gap-2 pt-1">
                <Link href="/login" onClick={closeAll} className="flex-1 rounded-xl border py-2.5 text-center text-sm transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800" style={{ borderColor: "var(--border-2)", color: "var(--text-0)" }}>{t("nav.signIn")}</Link>
                <Link href="/register" onClick={closeAll} className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-400">{t("nav.signUp")}</Link>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  )
}

function ThemeToggleInline() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"
  return (
    <button onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
      style={{ color: "var(--text-2)" }}>
      {isDark
        ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
      }
    </button>
  )
}
