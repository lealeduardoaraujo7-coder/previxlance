export default function ComoFuncionaPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Como funciona</h1>
      <p className="text-gray-500 dark:text-zinc-400 mb-12">Entenda como apostar e ganhar no PrevixLance.</p>

      <div className="space-y-10">
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-sm font-bold text-emerald-600 dark:text-emerald-400">1</span>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Crie sua conta e deposite</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed pl-11">
            Cadastre-se gratuitamente e deposite saldo via PIX. O valor mínimo é R$ 5,00.
            Em ambiente de testes, o crédito é imediato após a confirmação.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-sm font-bold text-emerald-600 dark:text-emerald-400">2</span>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Escolha um mercado</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed pl-11">
            Navegue pelos mercados abertos sobre política, futebol, economia e outros eventos brasileiros.
            Cada mercado tem uma pergunta com opções SIM ou NÃO (ou múltipla escolha) e uma data de fechamento.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-sm font-bold text-emerald-600 dark:text-emerald-400">3</span>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Faça sua aposta</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed pl-11">
            Escolha uma opção, informe o valor e confirme. O sistema calcula automaticamente
            quanto você receberia se ganhar, com base no pool de apostas atual. Quanto mais pessoas
            apostam no lado contrário, maior seu retorno potencial.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-sm font-bold text-emerald-600 dark:text-emerald-400">4</span>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Aguarde o resultado</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed pl-11">
            Quando o evento acontecer, nosso time resolve o mercado com o resultado correto.
            Os vencedores recebem sua parte proporcional do pool total, com desconto de 2% de taxa da plataforma.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-sm font-bold text-emerald-600 dark:text-emerald-400">5</span>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Saque seus ganhos</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed pl-11">
            Solicite um saque a qualquer momento. O valor mínimo é R$ 20,00 e há uma taxa de 1%.
            O PIX é enviado em até 24h após aprovação da equipe.
          </p>
        </section>

        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Como o retorno é calculado?</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed mb-3">
            O PrevixLance usa um modelo de <span className="text-gray-900 dark:text-white font-medium">pool compartilhado</span>.
            Todo o dinheiro apostado forma um pool. Após 2% de taxa, o restante é dividido proporcionalmente
            entre os vencedores, de acordo com quanto cada um apostou.
          </p>
          <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800 p-4 text-xs font-mono text-gray-500 dark:text-zinc-400 space-y-1">
            <p>Pool total: R$ 1.000 → Prêmio: R$ 980 (após taxa 2%)</p>
            <p>Você apostou R$ 100 em SIM (total SIM: R$ 400)</p>
            <p>Seu retorno: (100 / 400) × 980 = <span className="text-emerald-600 dark:text-emerald-400 font-semibold">R$ 245</span></p>
            <p>Lucro: R$ 245 − R$ 100 = <span className="text-emerald-600 dark:text-emerald-400 font-semibold">R$ 145</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
