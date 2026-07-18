import { prisma } from "@/lib/prisma"

export type TickerItemDTO = {
  id: string
  label: string
  text: string
  color: string
  enabled: boolean
  order: number
}

// Seeded once if the table is empty, so the ticker is never blank on first run.
const DEFAULT_ITEMS: Omit<TickerItemDTO, "id" | "enabled">[] = [
  { label: "COMPRA",    text: "Carlos comprou R$500 em SIM · Lula reeleição 2026", color: "#00c076", order: 0 },
  { label: "RESOLVIDO", text: "Mercado resolvido · Flamengo venceu o Brasileirão", color: "#60a5fa", order: 1 },
  { label: "ALTA",      text: "Vini Jr. Bola de Ouro subiu +5% em 1 hora",         color: "#a855f7", order: 2 },
  { label: "NOVO",      text: "Novo mercado · Neymar retorna ao futebol brasileiro?", color: "#fb923c", order: 3 },
]

/** All enabled ticker items in display order, seeding defaults on first access. */
export async function getEnabledTickerItems(): Promise<TickerItemDTO[]> {
  const total = await prisma.tickerItem.count()
  if (total === 0) {
    await prisma.tickerItem.createMany({
      data: DEFAULT_ITEMS.map((d) => ({ ...d, enabled: true })),
    })
  }
  return prisma.tickerItem.findMany({
    where: { enabled: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  })
}

/** All items (enabled or not) for the admin screen. */
export async function getAllTickerItems(): Promise<TickerItemDTO[]> {
  return prisma.tickerItem.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  })
}
