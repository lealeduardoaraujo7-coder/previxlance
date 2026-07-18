"use client"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { TranslationProvider } from "./components/TranslationProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TranslationProvider>
        <SessionProvider>{children}</SessionProvider>
      </TranslationProvider>
    </ThemeProvider>
  )
}
