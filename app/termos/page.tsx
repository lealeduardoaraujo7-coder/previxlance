export default function TermosPage() {
  const H = "text-base font-semibold text-gray-900 dark:text-white mb-2"
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Termos de Uso e Regras</h1>
      <p className="text-gray-500 dark:text-zinc-400 mb-10">Última atualização: julho de 2026</p>

      <div className="space-y-8 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
        <section>
          <h2 className={H}>1. Sobre a plataforma</h2>
          <p>O PrevixLance é uma plataforma de mercados de previsão voltada ao público brasileiro. Ao se cadastrar, você concorda com estes Termos e se compromete a usar a plataforma de forma responsável, honesta e legal.</p>
        </section>

        <section>
          <h2 className={H}>2. Elegibilidade</h2>
          <p>Você deve ter no mínimo <strong>18 anos</strong> e estar em conformidade com as leis do seu país. Contas que violem este requisito podem ser encerradas a qualquer momento.</p>
        </section>

        <section>
          <h2 className={H}>3. Conta e cadastro</h2>
          <p>Cada pessoa pode manter <strong>apenas uma conta</strong>, com dados verdadeiros e atualizados. Você é o único responsável por manter sua senha em segurança e por toda atividade feita na sua conta. É proibido criar, comprar, vender ou emprestar contas.</p>
        </section>

        <section>
          <h2 className={H}>4. Como funcionam os mercados</h2>
          <p>Cada mercado negocia contratos de resultado (ex.: SIM / NÃO) com <strong>preço ao vivo</strong> entre 0 e 100 centavos, que varia conforme a negociação. Você pode comprar e vender contratos antes do encerramento. É cobrada uma <strong>taxa de 2% por operação</strong>. Ao resolver, cada contrato do lado vencedor paga <strong>R$ 1,00</strong> e o lado perdedor vale R$ 0,00.</p>
        </section>

        <section>
          <h2 className={H}>5. Resolução dos mercados</h2>
          <p>Os mercados param de aceitar apostas na data de encerramento e são resolvidos pela equipe do PrevixLance com base em <strong>fontes públicas e verificáveis</strong> descritas em cada mercado. Nos casos de resultado ambíguo, adiado ou sem fonte confiável, a equipe pode <strong>cancelar</strong> o mercado — e então todas as operações são reembolsadas pelo valor líquido investido, sem taxa.</p>
        </section>

        <section>
          <h2 className={H}>6. Depósitos e saques</h2>
          <p>Os valores depositados viram saldo na plataforma. O saque é feito via <strong>PIX</strong>, sujeito a aprovação da equipe e a uma taxa de 1%. Depósito mínimo: R$ 5,00. Saque mínimo: R$ 20,00. Podemos solicitar <strong>verificação de identidade (KYC)</strong> antes de liberar saques, e reter saques com indício de fraude enquanto investigamos.</p>
        </section>

        <section>
          <h2 className={H}>7. Bônus e recompensas</h2>
          <p>Recompensas, como o crédito por propor mercados aprovados, são <strong>concedidas a critério exclusivo da equipe</strong>. Tentar farmar recompensas (propostas repetidas, de baixa qualidade, duplicadas ou por múltiplas contas) resulta na perda do bônus e pode levar à suspensão da conta.</p>
        </section>

        <section className="rounded-2xl border border-red-200 dark:border-red-800/40 bg-red-50/60 dark:bg-red-500/5 p-5">
          <h2 className="text-base font-semibold text-red-700 dark:text-red-400 mb-2">8. Condutas proibidas ⚠️</h2>
          <p className="mb-2">Para proteger todos os usuários, é <strong>terminantemente proibido</strong>:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Criar ou operar <strong>múltiplas contas</strong> (multi-contas), inclusive em nome de terceiros;</li>
            <li><strong>Manipular preços</strong> ou combinar operações entre contas para transferir saldo ou distorcer o mercado;</li>
            <li>Usar <strong>robôs, scripts ou automações</strong> para negociar ou abusar da plataforma;</li>
            <li>Explorar <strong>bugs, falhas ou brechas</strong> em vez de reportá-los à equipe;</li>
            <li>Negociar com <strong>informação privilegiada</strong> sobre o resultado de um evento;</li>
            <li>Usar a plataforma para <strong>lavagem de dinheiro</strong>, fraude ou qualquer atividade ilícita;</li>
            <li>Realizar <strong>estornos (chargebacks)</strong> indevidos ou usar meios de pagamento de terceiros sem autorização.</li>
          </ul>
        </section>

        <section>
          <h2 className={H}>9. Penalidades</h2>
          <p>O descumprimento destas regras pode resultar, a critério da equipe, em: <strong>congelamento do saldo</strong>, <strong>confisco de ganhos obtidos de forma ilícita</strong>, <strong>reversão de operações</strong>, <strong>suspensão</strong> ou <strong>encerramento definitivo da conta</strong>. Casos graves podem ser comunicados às autoridades competentes.</p>
        </section>

        <section>
          <h2 className={H}>10. Jogo responsável</h2>
          <p>O PrevixLance não se responsabiliza por perdas decorrentes de operações feitas na plataforma. Aposte apenas o que puder perder. Se sentir que tem um problema com jogos de azar, procure ajuda profissional — no Brasil, você pode ligar para o <strong>CVV (188)</strong>.</p>
        </section>

        <section>
          <h2 className={H}>11. Alterações</h2>
          <p>Podemos atualizar estes Termos a qualquer momento. O uso contínuo da plataforma após alterações implica aceitação dos novos Termos.</p>
        </section>

        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-5">
          <p className="text-xs text-gray-400 dark:text-zinc-500">Dúvidas? Entre em contato: <a href="mailto:contato@previxlance.com.br" className="text-emerald-600 dark:text-emerald-400 hover:underline">contato@previxlance.com.br</a></p>
        </div>
      </div>
    </div>
  )
}
