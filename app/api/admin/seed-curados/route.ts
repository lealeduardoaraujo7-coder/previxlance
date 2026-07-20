import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * One-click curated seed (admin only). Creates a themed set of markets with
 * photos, one multi-outcome EVENT, binary (SIM/NÃO) and MULTIPLE markets, spread
 * across "this week" and "next weeks/months". Idempotent: existing events (by
 * slug) and markets (by title) are skipped, so it's safe to run more than once.
 *
 * closesAt is computed relative to NOW (days from click) so the buckets are
 * always correct regardless of when the button is pressed.
 */

const DAY = 86_400_000
const at = (days: number) => new Date(Date.now() + days * DAY)

// Categories the seed relies on. upsert with update:{} so existing categories
// (and the admin's own settings) are never overwritten — only missing ones are
// created, satisfying the Market.category foreign key.
const CATEGORIES: { slug: string; name: string; color: string; showInNav: boolean; order: number }[] = [
  { slug: "futebol",        name: "Futebol",        color: "#16a34a", showInNav: true,  order: 1 },
  { slug: "esportes",       name: "Esportes",       color: "#0ea5e9", showInNav: true,  order: 2 },
  { slug: "economia",       name: "Economia",       color: "#f59e0b", showInNav: true,  order: 3 },
  { slug: "entretenimento", name: "Entretenimento", color: "#a855f7", showInNav: true,  order: 4 },
  { slug: "tecnologia",     name: "Tecnologia",     color: "#14b8a6", showInNav: true,  order: 5 },
  { slug: "outros",         name: "Outros",         color: "#6b7280", showInNav: false, order: 9 },
]

const IMG = {
  ball:     "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&q=80",
  stadium:  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&q=80",
  stadium2: "https://images.unsplash.com/photo-1552318965-6e6be7484ada?w=600&q=80",
  racing:   "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?w=600&q=80",
  bitcoin:  "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&q=80",
  crypto:   "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&q=80",
  money:    "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=600&q=80",
  cinema:   "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80",
  concert:  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80",
  rain:     "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&q=80",
  phone:    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80",
  data:     "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
}

// ── One multi-outcome EVENT (each child is a binary SIM/NÃO market) ──────────
const EVENTS = [
  {
    slug: "brasileirao-2026-campeao",
    title: "Brasileirão 2026 · Quem será o campeão?",
    description: "Mercado de evento: escolha o clube que você acredita que vai levantar a taça do Campeonato Brasileiro de 2026. Cada opção é negociada de forma independente.",
    category: "futebol",
    imageUrl: IMG.stadium,
    closesInDays: 140,
    children: [
      { team: "Flamengo",   img: IMG.stadium2 },
      { team: "Palmeiras",  img: IMG.stadium },
      { team: "Cruzeiro",   img: IMG.stadium2 },
      { team: "Botafogo",   img: IMG.stadium },
    ],
  },
]

// ── Standalone markets ───────────────────────────────────────────────────────
type SeedMarket = {
  title: string; description: string; category: string; imageUrl: string
  type: "BINARY" | "MULTIPLE"; closesInDays: number; options: string[]
}

const MARKETS: SeedMarket[] = [
  // ---- Esportes ----
  {
    title: "Verstappen será campeão da Fórmula 1 em 2026?",
    description: "Max Verstappen busca mais um título mundial na temporada 2026 da F1. Ele leva o campeonato?",
    category: "esportes", imageUrl: IMG.racing, type: "BINARY", closesInDays: 125, options: ["SIM", "NÃO"],
  },
  {
    title: "O Palmeiras vence a Libertadores de 2026?",
    description: "O Verdão é sempre um dos favoritos ao maior título da América. O Palmeiras conquista a Libertadores 2026?",
    category: "futebol", imageUrl: IMG.stadium2, type: "BINARY", closesInDays: 130, options: ["SIM", "NÃO"],
  },
  {
    title: "Neymar será convocado para a Seleção Brasileira em 2026?",
    description: "Após a recuperação de lesão, Neymar tenta voltar aos planos da Seleção. Ele volta a ser convocado ainda em 2026?",
    category: "futebol", imageUrl: IMG.ball, type: "BINARY", closesInDays: 150, options: ["SIM", "NÃO"],
  },

  // ---- Essa semana ----
  {
    title: "O Bitcoin fecha esta semana acima de US$120 mil?",
    description: "O preço do Bitcoin no fechamento de domingo vai estar acima de US$120.000?",
    category: "economia", imageUrl: IMG.bitcoin, type: "BINARY", closesInDays: 6, options: ["SIM", "NÃO"],
  },
  {
    title: "O dólar fecha esta sexta-feira abaixo de R$5,40?",
    description: "Na cotação de fechamento de sexta, o dólar comercial estará abaixo de R$5,40?",
    category: "economia", imageUrl: IMG.money, type: "BINARY", closesInDays: 4, options: ["SIM", "NÃO"],
  },
  {
    title: "Qual filme lidera a bilheteria brasileira neste fim de semana?",
    description: "Escolha o filme que terá a maior bilheteria nos cinemas do Brasil no próximo fim de semana.",
    category: "entretenimento", imageUrl: IMG.cinema, type: "MULTIPLE", closesInDays: 7,
    options: ["Superman: Legado", "Jurassic World: Recomeço", "Quarteto Fantástico", "Outro"],
  },
  {
    title: "Vai chover na cidade de São Paulo neste sábado?",
    description: "Segundo a previsão oficial, haverá registro de chuva na capital paulista no próximo sábado?",
    category: "outros", imageUrl: IMG.rain, type: "BINARY", closesInDays: 5, options: ["SIM", "NÃO"],
  },
  {
    title: "A Seleção Brasileira vence seu próximo jogo desta semana?",
    description: "No próximo compromisso da Seleção nesta semana, o Brasil sai com a vitória?",
    category: "futebol", imageUrl: IMG.stadium, type: "BINARY", closesInDays: 6, options: ["SIM", "NÃO"],
  },

  // ---- Semanas / meses ----
  {
    title: "O Bitcoin atinge US$150 mil até o fim de 2026?",
    description: "Em algum momento até 31 de dezembro de 2026, o Bitcoin vai negociar acima de US$150.000?",
    category: "economia", imageUrl: IMG.crypto, type: "BINARY", closesInDays: 164, options: ["SIM", "NÃO"],
  },
  {
    title: "Em qual faixa o dólar termina o ano de 2026?",
    description: "Qual será a faixa de cotação do dólar comercial no último dia útil de 2026?",
    category: "economia", imageUrl: IMG.money, type: "MULTIPLE", closesInDays: 164,
    options: ["Abaixo de R$5,00", "R$5,00 – R$5,50", "R$5,50 – R$6,00", "Acima de R$6,00"],
  },
  {
    title: "A Apple lança um iPhone dobrável até dezembro de 2026?",
    description: "Rumores apontam para um iPhone com tela dobrável. A Apple anuncia oficialmente esse modelo ainda em 2026?",
    category: "tecnologia", imageUrl: IMG.phone, type: "BINARY", closesInDays: 150, options: ["SIM", "NÃO"],
  },
  {
    title: "A inflação (IPCA) de 2026 fica abaixo de 4,5%?",
    description: "O IPCA acumulado de 2026, divulgado pelo IBGE, vai fechar abaixo de 4,5%?",
    category: "economia", imageUrl: IMG.data, type: "BINARY", closesInDays: 164, options: ["SIM", "NÃO"],
  },
  {
    title: "Anitta lança um álbum de estúdio até o fim de 2026?",
    description: "A cantora Anitta vai lançar um novo álbum de estúdio completo ainda em 2026?",
    category: "entretenimento", imageUrl: IMG.concert, type: "BINARY", closesInDays: 160, options: ["SIM", "NÃO"],
  },
]

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  // Ensure categories exist (never overwrite existing ones).
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { slug: c.slug, name: c.name, color: c.color, showInNav: c.showInNav, order: c.order },
    })
  }

  const created: string[] = []
  const skipped: string[] = []

  // Events + their child markets.
  for (const e of EVENTS) {
    const exists = await prisma.event.findUnique({ where: { slug: e.slug } })
    if (exists) { skipped.push(`evento: ${e.title}`); continue }
    await prisma.event.create({
      data: {
        slug: e.slug,
        title: e.title,
        description: e.description,
        category: e.category,
        imageUrl: e.imageUrl,
        closesAt: at(e.closesInDays),
        markets: {
          create: e.children.map((ch) => ({
            title: `${ch.team} será campeão do Brasileirão 2026?`,
            category: e.category,
            type: "BINARY",
            closesAt: at(e.closesInDays),
            shortLabel: ch.team,
            shortImageUrl: ch.img,
            imageUrl: ch.img,
            options: { create: [{ label: "SIM" }, { label: "NÃO" }] },
          })),
        },
      },
    })
    created.push(`evento: ${e.title} (${e.children.length} opções)`)
  }

  // Standalone markets.
  for (const m of MARKETS) {
    const exists = await prisma.market.findFirst({ where: { title: m.title } })
    if (exists) { skipped.push(m.title); continue }
    await prisma.market.create({
      data: {
        title: m.title,
        description: m.description,
        category: m.category,
        imageUrl: m.imageUrl,
        type: m.type,
        closesAt: at(m.closesInDays),
        options: { create: m.options.map((label) => ({ label })) },
      },
    })
    created.push(m.title)
  }

  return NextResponse.json({ ok: true, created, skipped })
}
