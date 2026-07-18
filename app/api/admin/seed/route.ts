import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MARKETS = [
  {
    title: "O Brasil vai ser campeão da Copa do Mundo 2026?",
    description: "A Copa do Mundo de 2026 será realizada nos EUA, Canadá e México. O Brasil chega como um dos favoritos. A Seleção vai conquistar o hexa?",
    category: "futebol",
    type: "BINARY",
    closesAt: "2026-07-18T23:59:00Z",
    options: ["SIM", "NÃO"],
  },
  {
    title: "Quem vai ser campeão da Copa do Mundo 2026?",
    description: "Escolha o país que você acredita que vai levantar a taça em julho de 2026.",
    category: "futebol",
    type: "MULTIPLE",
    closesAt: "2026-07-18T23:59:00Z",
    options: ["Brasil", "Argentina", "França", "Outro"],
  },
  {
    title: "Vinicius Jr. vai ganhar a Bola de Ouro 2026?",
    description: "O atacante do Real Madrid é um dos maiores favoritos ao prêmio individual mais importante do futebol. Ele vai conquistar em 2026?",
    category: "futebol",
    type: "BINARY",
    closesAt: "2026-10-28T23:59:00Z",
    options: ["SIM", "NÃO"],
  },
  {
    title: "O Flamengo vai ser campeão do Brasileirão 2026?",
    description: "O Flamengo é o time com mais títulos recentes no Campeonato Brasileiro. Eles vão vencer mais uma vez em 2026?",
    category: "futebol",
    type: "BINARY",
    closesAt: "2026-12-05T23:59:00Z",
    options: ["SIM", "NÃO"],
  },
  {
    title: "Lula vai concorrer à reeleição nas eleições de 2026?",
    description: "As eleições presidenciais brasileiras acontecem em outubro de 2026. O presidente Lula vai se candidatar à reeleição?",
    category: "politica",
    type: "BINARY",
    closesAt: "2026-08-15T23:59:00Z",
    options: ["SIM", "NÃO"],
  },
  {
    title: "Quem vai vencer a eleição presidencial do Brasil em 2026?",
    description: "O Brasil vai às urnas em outubro de 2026. Quem você acredita que será o próximo presidente?",
    category: "politica",
    type: "MULTIPLE",
    closesAt: "2026-10-05T23:59:00Z",
    options: ["Lula (PT)", "Bolsonaro (PL)", "Outro candidato da esquerda", "Outro candidato da direita"],
  },
  {
    title: "O Bitcoin vai atingir US$200.000 em 2026?",
    description: "Após o halving de 2024 e a aprovação dos ETFs nos EUA, muitos analistas preveem novos recordes. O BTC vai chegar a $200k ainda em 2026?",
    category: "economia",
    type: "BINARY",
    closesAt: "2026-12-31T23:59:00Z",
    options: ["SIM", "NÃO"],
  },
  {
    title: "Qual será o preço do Bitcoin no final de 2026?",
    description: "Em qual faixa de preço o Bitcoin vai terminar o ano de 2026?",
    category: "economia",
    type: "MULTIPLE",
    closesAt: "2026-12-31T23:59:00Z",
    options: ["Abaixo de US$80.000", "US$80k–US$130k", "US$130k–US$200k", "Acima de US$200k"],
  },
  {
    title: "O Ethereum vai superar US$5.000 em 2026?",
    description: "O Ethereum passou por grandes atualizações e tem forte adoção em DeFi e NFTs. Vai atingir $5k em 2026?",
    category: "economia",
    type: "BINARY",
    closesAt: "2026-12-31T23:59:00Z",
    options: ["SIM", "NÃO"],
  },
  {
    title: "O dólar vai passar de R$7,00 até dezembro de 2026?",
    description: "Com o cenário fiscal e político brasileiro, o dólar pode continuar pressionando a moeda nacional. Vai bater R$7 ainda em 2026?",
    category: "economia",
    type: "BINARY",
    closesAt: "2026-12-31T23:59:00Z",
    options: ["SIM", "NÃO"],
  },
  {
    title: "Neymar vai voltar ao futebol profissional em 2026?",
    description: "Neymar sofreu grave lesão no joelho e ficou afastado por longo período. Ele vai retornar aos gramados em 2026?",
    category: "entretenimento",
    type: "BINARY",
    closesAt: "2026-12-31T23:59:00Z",
    options: ["SIM", "NÃO"],
  },
  {
    title: "Anitta vai lançar um álbum de estúdio em 2026?",
    description: "A cantora é uma das maiores artistas brasileiras e tem conquistado o mercado internacional. Ela vai lançar um álbum completo ainda em 2026?",
    category: "entretenimento",
    type: "BINARY",
    closesAt: "2026-12-31T23:59:00Z",
    options: ["SIM", "NÃO"],
  },
]

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const existing = await prisma.market.count()
  if (existing >= 5) {
    return NextResponse.json({ error: "Já existem mercados suficientes. Seed ignorado." }, { status: 400 })
  }

  const created: string[] = []

  for (const m of MARKETS) {
    const market = await prisma.market.create({
      data: {
        title: m.title,
        description: m.description,
        category: m.category,
        type: m.type,
        closesAt: new Date(m.closesAt),
        options: {
          create: m.options.map((label) => ({ label })),
        },
      },
    })
    created.push(market.title)
  }

  return NextResponse.json({ ok: true, created })
}
