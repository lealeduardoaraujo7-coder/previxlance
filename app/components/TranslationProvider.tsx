"use client"
import { createContext, useContext, useState, useEffect } from "react"

export type Lang = "pt-BR" | "en" | "es"

const T: Record<Lang, Record<string, string>> = {
  "pt-BR": {
    "nav.markets": "Mercados",
    "nav.howItWorks": "Como funciona",
    "nav.deposit": "Depositar",
    "nav.withdraw": "Sacar",
    "nav.myBets": "Minhas apostas",
    "nav.myProfile": "Meu perfil",
    "nav.admin": "Painel Admin",
    "nav.signIn": "Entrar",
    "nav.signUp": "Criar conta",
    "nav.signOut": "Sair",
    "nav.darkMode": "Modo escuro",
    "nav.lightMode": "Modo claro",
    "nav.language": "Idioma",
    "nav.terms": "Termos de Uso",
    "nav.support": "Suporte",
    "nav.balance": "Saldo",
    "nav.search": "Buscar mercados...",
    "nav.search.btn": "Buscar",
    "nav.myBets.link": "Minhas apostas",
    "nav.profile.link": "Meu perfil",
  },
  "en": {
    "nav.markets": "Markets",
    "nav.howItWorks": "How it works",
    "nav.deposit": "Deposit",
    "nav.withdraw": "Withdraw",
    "nav.myBets": "My bets",
    "nav.myProfile": "My profile",
    "nav.admin": "Admin Panel",
    "nav.signIn": "Sign in",
    "nav.signUp": "Create account",
    "nav.signOut": "Sign out",
    "nav.darkMode": "Dark mode",
    "nav.lightMode": "Light mode",
    "nav.language": "Language",
    "nav.terms": "Terms of Use",
    "nav.support": "Support",
    "nav.balance": "Balance",
    "nav.search": "Search markets...",
    "nav.search.btn": "Search",
    "nav.myBets.link": "My bets",
    "nav.profile.link": "My profile",
  },
  "es": {
    "nav.markets": "Mercados",
    "nav.howItWorks": "Cómo funciona",
    "nav.deposit": "Depositar",
    "nav.withdraw": "Retirar",
    "nav.myBets": "Mis apuestas",
    "nav.myProfile": "Mi perfil",
    "nav.admin": "Panel Admin",
    "nav.signIn": "Iniciar sesión",
    "nav.signUp": "Crear cuenta",
    "nav.signOut": "Salir",
    "nav.darkMode": "Modo oscuro",
    "nav.lightMode": "Modo claro",
    "nav.language": "Idioma",
    "nav.terms": "Términos de Uso",
    "nav.support": "Soporte",
    "nav.balance": "Saldo",
    "nav.search": "Buscar mercados...",
    "nav.search.btn": "Buscar",
    "nav.myBets.link": "Mis apuestas",
    "nav.profile.link": "Mi perfil",
  },
}

type TCtx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string }

const TranslationContext = createContext<TCtx>({
  lang: "pt-BR",
  setLang: () => {},
  t: (k) => k,
})

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt-BR")

  useEffect(() => {
    const saved = localStorage.getItem("previx-lang") as Lang | null
    if (saved && T[saved]) setLangState(saved)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem("previx-lang", l)
  }

  function t(key: string): string {
    return T[lang]?.[key] ?? T["pt-BR"][key] ?? key
  }

  return (
    <TranslationContext.Provider value={{ lang, setLang, t }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  return useContext(TranslationContext)
}
