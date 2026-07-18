export default function TermosPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Termos de Uso</h1>
      <p className="text-gray-500 dark:text-zinc-400 mb-10">Última atualização: maio de 2026</p>

      <div className="space-y-8 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">1. Sobre a plataforma</h2>
          <p>O PrevixLance é uma plataforma de mercados de previsão voltada ao público brasileiro. Ao se cadastrar, você concorda com estes termos e se compromete a usá-la de forma responsável e legal.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">2. Elegibilidade</h2>
          <p>Para usar a plataforma você deve ter ao menos 18 anos de idade e estar em conformidade com as leis do seu país. O PrevixLance reserva-se o direito de encerrar contas que violem este requisito.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">3. Depósitos e saques</h2>
          <p>Os valores depositados são creditados em saldo virtual na plataforma. O saldo pode ser sacado via PIX, sujeito a aprovação da equipe e a uma taxa de 1%. O valor mínimo de depósito é R$ 5,00 e de saque é R$ 20,00.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">4. Mercados e apostas</h2>
          <p>Os mercados são criados e moderados pela equipe do PrevixLance. O resultado de cada mercado é definido com base em fontes públicas verificáveis. A plataforma cobra 2% do pool total como taxa de operação ao resolver um mercado.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">5. Cancelamento de mercados</h2>
          <p>Em caso de cancelamento de um mercado, todas as apostas são integralmente reembolsadas ao saldo dos participantes, sem cobrança de taxas.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">6. Responsabilidade</h2>
          <p>O PrevixLance não se responsabiliza por perdas decorrentes de apostas feitas na plataforma. Aposte com responsabilidade. Se você sentir que tem um problema com jogos de azar, procure ajuda profissional.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">7. Alterações</h2>
          <p>Podemos atualizar estes termos a qualquer momento. O uso contínuo da plataforma após alterações implica aceitação dos novos termos.</p>
        </section>

        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-5">
          <p className="text-xs text-gray-400 dark:text-zinc-500">Dúvidas? Entre em contato: <a href="mailto:contato@previxlance.com.br" className="text-emerald-600 dark:text-emerald-400 hover:underline">contato@previxlance.com.br</a></p>
        </div>
      </div>
    </div>
  )
}
