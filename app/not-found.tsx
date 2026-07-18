import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-gray-200 dark:text-zinc-800">404</p>
      <h1 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Página não encontrada</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">O endereço que você acessou não existe ou foi removido.</p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors"
      >
        Ir para Mercados
      </Link>
    </div>
  )
}
