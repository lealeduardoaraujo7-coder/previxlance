import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getAllTickerItems } from "@/lib/ticker"
import TickerEditor from "./TickerEditor"

export default async function ManchetePage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const items = await getAllTickerItems()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link href="/admin" className="text-sm" style={{ color: "var(--text-2)" }}>← Voltar ao painel</Link>
        <h1 className="mt-3 text-2xl font-bold" style={{ color: "var(--text-0)" }}>Manchete</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
          Edite os itens da faixa de notícias que rola no topo da home — texto, rótulo e cor.
        </p>
      </div>

      <TickerEditor initialItems={items} />
    </div>
  )
}
