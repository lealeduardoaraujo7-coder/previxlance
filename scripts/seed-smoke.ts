/* Seed a minimal market for smoke-testing the redesigned pages. Run: DATABASE_URL="file:./dev.db" npx tsx scripts/seed-smoke.ts */
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { DEFAULT_LIQUIDITY } from "../lib/amm"

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./dev.db" })
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.category.upsert({ where: { slug: "outros" }, update: {}, create: { slug: "outros", name: "Outros", color: "#7c5cff" } })

  let m = await prisma.market.findFirst({ where: { title: "SMOKE: Bitcoin acima de US$200k em 2026?" }, include: { options: true } })
  if (!m) {
    m = await prisma.market.create({
      data: {
        title: "SMOKE: Bitcoin acima de US$200k em 2026?",
        description: "Mercado de teste para o smoke test do redesenho.",
        category: "outros", type: "BINARY", liquidity: DEFAULT_LIQUIDITY,
        closesAt: new Date(Date.now() + 30 * 86_400_000),
        options: { create: [{ label: "SIM" }, { label: "NÃO" }] },
      },
      include: { options: true },
    })
  }
  console.log("MARKET_ID=" + m.id)
  await prisma.$disconnect()
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
