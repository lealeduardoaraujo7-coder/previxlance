import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import EventEditor from "./EventEditor"

export default async function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/")
  const { id } = await params

  const event = await prisma.event.findUnique({
    where: { id },
    include: { markets: { orderBy: { totalPool: "desc" }, include: { _count: { select: { bets: true } } } } },
  })
  if (!event) notFound()

  return <EventEditor initial={JSON.parse(JSON.stringify(event))} />
}
