import Link from "next/link"

const FAQS = [
  {
    q: "Como deposito saldo?",
    a: "Acesse \"Depositar\" no menu, informe o valor (mínimo R$ 5,00) e siga as instruções de pagamento via PIX. O saldo é creditado imediatamente após confirmação.",
  },
  {
    q: "Como solicito um saque?",
    a: "Acesse \"Sacar\" no menu, informe o valor desejado (mínimo R$ 20,00) e sua chave PIX. O saque é processado em até 24h após aprovação da equipe. Uma taxa de 1% é aplicada.",
  },
  {
    q: "Como funciona o cálculo dos prêmios?",
    a: "O PrevixLance usa um modelo de pool compartilhado. Seu prêmio é calculado proporcionalmente ao quanto você apostou em relação ao total apostado na opção vencedora, sobre o pool total menos 2% de taxa.",
  },
  {
    q: "O que acontece se um mercado for cancelado?",
    a: "Todas as apostas são 100% reembolsadas ao saldo de cada usuário, sem cobranças.",
  },
  {
    q: "Posso apostas em mais de uma opção no mesmo mercado?",
    a: "Sim, você pode fazer múltiplas apostas em opções diferentes dentro do mesmo mercado.",
  },
  {
    q: "Quanto tempo leva para receber meu PIX?",
    a: "Em geral até 24 horas após a aprovação pela equipe. Nos horários de pico pode levar um pouco mais.",
  },
  {
    q: "Como entro em contato com o suporte?",
    a: "Envie um e-mail para contato@previxlance.com.br. Respondemos em até 48 horas úteis.",
  },
]

export default function SuportePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Suporte</h1>
      <p className="text-gray-500 dark:text-zinc-400 mb-10">Perguntas frequentes e formas de contato.</p>

      <div className="space-y-4 mb-12">
        {FAQS.map((faq, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{faq.q}</p>
            <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-500/10 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Não achou o que precisava?</h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Nossa equipe responde em até 48 horas úteis.</p>
        <a href="mailto:contato@previxlance.com.br"
          className="inline-block rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors">
          Enviar e-mail
        </a>
      </div>

      <p className="mt-6 text-center text-sm text-gray-400 dark:text-zinc-500">
        Também confira{" "}
        <Link href="/como-funciona" className="text-emerald-600 dark:text-emerald-400 hover:underline">como a plataforma funciona</Link>{" "}
        e{" "}
        <Link href="/termos" className="text-emerald-600 dark:text-emerald-400 hover:underline">nossos termos de uso</Link>.
      </p>
    </div>
  )
}
