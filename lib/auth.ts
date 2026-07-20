import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

// Providers are enabled only when their credentials exist, so the app boots
// (and the e-mail flow works) even before Google/Apple are configured.
const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Senha", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null
      const user = await prisma.user.findUnique({ where: { email: credentials.email } })
      if (!user || !user.password) return null
      const valid = await bcrypt.compare(credentials.password, user.password)
      if (!valid) return null
      return { id: user.id, name: user.name, email: user.email, role: user.role, balance: user.balance } as any
    },
  }),
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Let a Google sign-in attach to an existing account with the same e-mail.
      allowDangerousEmailAccountLinking: true,
    }),
  )
}

// Apple needs a paid Apple Developer account (Services ID + a clientSecret JWT
// generated from the .p8 key). Enabled only when those env vars are present.
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  providers.push(
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  )
}

/**
 * Give a user a unique provisional @handle (user_xxxx) the first time they sign
 * in without one. Never increments usernameChanges — the 2 free changes are for
 * the user's own picks, not this auto-generated placeholder.
 */
async function ensureProvisionalUsername(id: string): Promise<string> {
  const base = "user_" + id.slice(-8).toLowerCase().replace(/[^a-z0-9]/g, "")
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base}${Math.floor(Math.random() * 1000)}`
    const taken = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } })
    if (!taken || taken.id === id) {
      await prisma.user.update({ where: { id }, data: { username: candidate } })
      return candidate
    }
  }
  const fallback = "user_" + Math.random().toString(36).slice(2, 10)
  await prisma.user.update({ where: { id }, data: { username: fallback } })
  return fallback
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        // Read role/balance/username from the DB so OAuth (Google/Apple) sign-ins
        // — whose `user` object may not carry them — still get correct values.
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, balance: true, username: true, image: true },
        })
        token.role = dbUser?.role ?? (user as any).role ?? "USER"
        token.balance = dbUser?.balance ?? (user as any).balance ?? 0
        // Ensure every user has a public @handle. First login without one → a
        // provisional user_xxxx is generated (does NOT consume free changes).
        token.username = dbUser?.username ?? (await ensureProvisionalUsername(user.id))
        token.picture = dbUser?.image ?? (user as any).image ?? null
      }
      if (trigger === "update" && session) {
        if (session.balance !== undefined) token.balance = session.balance
        if (session.username !== undefined) token.username = session.username
        if (session.image !== undefined) token.picture = session.image
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.balance = token.balance as number
        session.user.username = (token.username as string) ?? null
        session.user.image = (token.picture as string) ?? session.user.image ?? null
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
