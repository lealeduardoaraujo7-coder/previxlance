import crypto from "crypto"

/**
 * Stateless e-mail verification code, signed with HMAC and carried in an
 * httpOnly cookie (so the browser can't read the code). Avoids a DB table.
 * Payload = { email, code, exp }. Used by /api/auth/send-code and register.
 */
const SECRET = process.env.NEXTAUTH_SECRET || "previx-dev-secret"
export const EVC_COOKIE = "previx_evc"

export function signCode(email: string, code: string, ttlMs = 10 * 60_000): string {
  const payload = { email: email.toLowerCase(), code, exp: Date.now() + ttlMs }
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url")
  return `${body}.${sig}`
}

export function verifyCode(token: string | undefined, email: string, code: string): boolean {
  if (!token) return false
  const [body, sig] = token.split(".")
  if (!body || !sig) return false
  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url")
  const a = Buffer.from(sig), b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString())
    if (typeof p.exp !== "number" || p.exp < Date.now()) return false
    return p.email === email.toLowerCase() && String(p.code) === String(code)
  } catch {
    return false
  }
}
