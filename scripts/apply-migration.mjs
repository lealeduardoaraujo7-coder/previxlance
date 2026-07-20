// Idempotent, NON-DESTRUCTIVE schema upgrade for the AMM engine.
// Runs during the Vercel build (where DATABASE_URL + TURSO_AUTH_TOKEN exist as
// injected env vars, even though they are "sensitive" and cannot be pulled locally).
//
// Only ADDS the Position table and the new columns (liquidity, shares, side, price).
// It never drops or rewrites a table, so existing markets/users/balances are safe.
// Each step is guarded, so re-running (every build) is a no-op once applied.
//
// If it fails, the build fails and Vercel keeps the current deployment live.
import { createClient } from "@libsql/client"

const url = process.env.DATABASE_URL
if (!url || url.includes("[SENSITIVE]")) {
  console.log("[apply-migration] no usable DATABASE_URL — skipping (local build).")
  process.exit(0)
}

const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined })

async function tableExists(name) {
  const r = await db.execute({ sql: "SELECT name FROM sqlite_master WHERE type='table' AND name=?", args: [name] })
  return r.rows.length > 0
}
async function indexExists(name) {
  const r = await db.execute({ sql: "SELECT name FROM sqlite_master WHERE type='index' AND name=?", args: [name] })
  return r.rows.length > 0
}
async function hasColumn(table, col) {
  const r = await db.execute(`PRAGMA table_info("${table}")`)
  return r.rows.some((row) => row.name === col)
}
async function addColumn(table, col, ddl) {
  if (await hasColumn(table, col)) { console.log(`[apply-migration] ${table}.${col} already present.`); return }
  console.log(`[apply-migration] + ${table}.${col}`)
  await db.execute(`ALTER TABLE "${table}" ADD COLUMN ${ddl}`)
}

async function main() {
  console.log("[apply-migration] checking AMM schema…")

  // Base tables must exist (existing app). If not, this DB isn't initialized — don't touch it.
  if (!(await tableExists("Market"))) {
    console.log("[apply-migration] base schema missing — skipping.")
    return
  }

  await addColumn("Market", "liquidity", `"liquidity" REAL NOT NULL DEFAULT 100`)
  await addColumn("MarketOption", "shares", `"shares" REAL NOT NULL DEFAULT 0`)
  await addColumn("Bet", "side", `"side" TEXT NOT NULL DEFAULT 'BUY'`)
  await addColumn("Bet", "shares", `"shares" REAL NOT NULL DEFAULT 0`)
  await addColumn("Bet", "price", `"price" INTEGER NOT NULL DEFAULT 0`)

  // Public @handle fields on User (add_username migration).
  await addColumn("User", "username", `"username" TEXT`)
  await addColumn("User", "usernameChanges", `"usernameChanges" INTEGER NOT NULL DEFAULT 0`)
  await addColumn("User", "usernameChangedAt", `"usernameChangedAt" DATETIME`)
  if (!(await indexExists("User_username_key"))) {
    console.log("[apply-migration] + unique index User.username")
    await db.execute(`CREATE UNIQUE INDEX "User_username_key" ON "User"("username")`)
  }

  if (!(await tableExists("Position"))) {
    console.log("[apply-migration] + Position table")
    await db.execute(`CREATE TABLE "Position" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "marketId" TEXT NOT NULL,
      "optionId" TEXT NOT NULL,
      "shares" REAL NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Position_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Position_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "MarketOption" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`)
    await db.execute(`CREATE INDEX "Position_marketId_idx" ON "Position"("marketId")`)
    await db.execute(`CREATE INDEX "Position_userId_idx" ON "Position"("userId")`)
    await db.execute(`CREATE UNIQUE INDEX "Position_userId_optionId_key" ON "Position"("userId", "optionId")`)
  } else {
    console.log("[apply-migration] Position table already present.")
  }

  console.log("[apply-migration] done ✅")
}

main().then(() => db.close()).catch((e) => { console.error("[apply-migration] FAILED:", e); process.exit(1) })
