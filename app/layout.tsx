import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Navbar } from "./components/Navbar"
import { Footer } from "./components/Footer"
import AuthModal from "./components/AuthModal"

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "PrevixLance — Mercado de Previsões",
  description: "Aposte em eventos brasileiros e ganhe com suas previsões.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased" style={{ background: "var(--bg)", color: "var(--text-0)" }}>
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <AuthModal />
        </Providers>
      </body>
    </html>
  )
}
