import Link from "next/link"
import { getLeaderboard } from "@/lib/leaderboard"
import DefaultAvatar from "@/app/components/DefaultAvatar"

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

// Structure supports the top 100; only the top 10 is shown for now.
const VISIBLE = 10

export default async function ClassificacaoPage() {
  const rows = await getLeaderboard(VISIBLE)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--text-0)" }}>
        Tabela de classificação
      </h1>
      <p className="mt-1.5 text-sm" style={{ color: "var(--text-2)" }}>
        Os maiores em volume negociado. As posições se preenchem conforme as pessoas apostam.
      </p>

      {/* Column header */}
      <div className="mt-7 flex items-center gap-4 px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-2)", borderBottom: "1px solid var(--border)" }}>
        <span className="w-6 text-center">#</span>
        <span className="flex-1">Trader</span>
        <span className="w-32 text-right hidden sm:block">Lucro / Prejuízo</span>
        <span className="w-32 text-right">Volume</span>
      </div>

      {/* Rows */}
      <div>
        {rows.map((row) => {
          const pnlColor = row.pnl > 0 ? "var(--green)" : row.pnl < 0 ? "var(--red)" : "var(--text-2)"
          const pnlText = row.placeholder
            ? "—"
            : `${row.pnl > 0 ? "+" : ""}${brl(row.pnl)}`

          const nameEl = (
            <span className="font-semibold truncate" style={{ color: row.placeholder ? "var(--text-2)" : "var(--text-0)" }}>
              {row.name}
            </span>
          )

          return (
            <div key={row.rank} className="flex items-center gap-4 px-4 py-3.5"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="w-6 text-center text-sm font-bold tabular-nums" style={{ color: "var(--text-2)" }}>
                {row.rank}
              </span>

              <div className="flex-1 flex items-center gap-3 min-w-0">
                {row.image && !row.placeholder ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.image} alt="" className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <DefaultAvatar size={40} muted={row.placeholder} />
                )}
                {row.placeholder || !row.userId ? nameEl : (
                  <Link href={`/perfil`} className="min-w-0 hover:underline">{nameEl}</Link>
                )}
              </div>

              <span className="w-32 text-right text-sm font-semibold tabular-nums hidden sm:block" style={{ color: pnlColor }}>
                {pnlText}
              </span>
              <span className="w-32 text-right text-sm font-bold tabular-nums"
                style={{ color: row.placeholder ? "var(--text-2)" : "var(--text-0)" }}>
                {brl(row.volume)}
              </span>
            </div>
          )
        })}
      </div>

      <p className="mt-6 text-center text-xs" style={{ color: "var(--text-2)" }}>
        Mostrando o top {VISIBLE}. A classificação vai até o top 100 conforme a plataforma cresce.
      </p>
    </div>
  )
}
