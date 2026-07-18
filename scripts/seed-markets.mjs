// Seed script — run with: node scripts/seed-markets.mjs
import { createClient } from "@libsql/client"
import { randomUUID } from "crypto"

const db = createClient({ url: "file:dev.db" })

function id() { return randomUUID() }

function now() { return new Date().toISOString() }

const MARKETS = [
  /* ─── ECONOMIA ─────────────────────────────────────────────────────────── */
  {
    title: "O Bitcoin vai atingir US$200.000 até dezembro de 2026?",
    description: "Após o halving de 2024 e a aprovação dos ETFs nos EUA, muitos analistas preveem novos recordes históricos. O BTC vai chegar a US$200k ainda em 2026?",
    category: "ECONOMIA",
    type: "BINARY",
    closesAt: "2026-12-31T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=800&q=80",
    options: ["SIM", "NÃO"],
  },
  {
    title: "Qual será o preço do Bitcoin no fim de 2026?",
    description: "Em qual faixa de preço o BTC vai fechar o ano de 2026? Selecione a faixa que você acredita ser mais provável.",
    category: "ECONOMIA",
    type: "MULTIPLE",
    closesAt: "2026-12-31T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?auto=format&fit=crop&w=800&q=80",
    options: ["Abaixo de US$80.000", "US$80k – US$130k", "US$130k – US$200k", "Acima de US$200k"],
  },
  {
    title: "O dólar vai ultrapassar R$7,00 em 2026?",
    description: "Com o cenário fiscal e político brasileiro, o dólar segue pressionando o real. A moeda americana vai cruzar a barreira de R$7 em algum momento de 2026?",
    category: "ECONOMIA",
    type: "BINARY",
    closesAt: "2026-12-31T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=80",
    options: ["SIM", "NÃO"],
  },
  {
    title: "A taxa Selic vai cair abaixo de 10% ao ano em 2026?",
    description: "O Banco Central do Brasil vem ajustando a Selic em resposta à inflação e câmbio. A taxa básica de juros vai recuar para menos de 10% ainda em 2026?",
    category: "ECONOMIA",
    type: "BINARY",
    closesAt: "2026-12-31T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
    options: ["SIM", "NÃO"],
  },
  {
    title: "O Ethereum vai superar US$5.000 em 2026?",
    description: "Com a adoção crescente em DeFi, NFTs e camada 2, o Ethereum busca novo ciclo de alta. O ETH vai bater US$5k ainda em 2026?",
    category: "ECONOMIA",
    type: "BINARY",
    closesAt: "2026-12-31T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1639762681057-408e52192e55?auto=format&fit=crop&w=800&q=80",
    options: ["SIM", "NÃO"],
  },

  /* ─── LUTAS (UFC / BOXE) ─────────────────────────────────────────────── */
  {
    title: "Islam Makhachev vai manter o cinturão peso-leve em 2026?",
    description: "O campeão peso-leve do UFC, Islam Makhachev, entra no ano como dominante absoluto da divisão. Ele vai segurar o cinturão por todo o ano de 2026?",
    category: "ENTRETENIMENTO",
    type: "BINARY",
    closesAt: "2026-12-31T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80",
    options: ["SIM", "NÃO"],
  },
  {
    title: "O Brasil vai ter um novo campeão no UFC em 2026?",
    description: "O Brasil tem vários contenders próximos de disputar cinturões. Alex Poatan, Renato Moicano e outros podem ser os próximos campeões. Vai sair campeão brasileiro em 2026?",
    category: "ENTRETENIMENTO",
    type: "BINARY",
    closesAt: "2026-12-31T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?auto=format&fit=crop&w=800&q=80",
    options: ["SIM", "NÃO"],
  },
  {
    title: "Quem vai ser campeão peso-pesado do UFC no fim de 2026?",
    description: "A divisão peso-pesado está em disputa acirrada entre Jon Jones, Tom Aspinall e outros. Quem vai segurar o ouro ao fim do ano?",
    category: "ENTRETENIMENTO",
    type: "MULTIPLE",
    closesAt: "2026-12-31T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80",
    options: ["Jon Jones", "Tom Aspinall", "Stipe Miocic", "Outro"],
  },
  {
    title: "Canelo Álvarez vai perder alguma luta em 2026?",
    description: "Canelo é considerado o melhor libra por libra do boxe. Com as lutas previstas para 2026, o mexicano vai sofrer sua primeira derrota em anos?",
    category: "ENTRETENIMENTO",
    type: "BINARY",
    closesAt: "2026-12-31T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=800&q=80",
    options: ["SIM", "NÃO"],
  },
  {
    title: "Alex Poatan vai ser campeão peso-médio-pesado do UFC em 2026?",
    description: "Alex Pereira (Poatan) domina a divisão peso-médio-pesado. Após defender o cinturão várias vezes, ele vai manter o título durante todo o ano de 2026?",
    category: "ENTRETENIMENTO",
    type: "BINARY",
    closesAt: "2026-12-31T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    options: ["SIM", "NÃO"],
  },

  /* ─── ELEIÇÕES ───────────────────────────────────────────────────────── */
  {
    title: "Lula vai concorrer à reeleição nas eleições de 2026?",
    description: "As eleições presidenciais brasileiras acontecem em outubro de 2026. Com baixa aprovação e problemas de saúde, o presidente Lula vai se candidatar à reeleição?",
    category: "POLITICA",
    type: "BINARY",
    closesAt: "2026-08-15T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80",
    options: ["SIM", "NÃO"],
  },
  {
    title: "Quem vai vencer a eleição presidencial do Brasil em 2026?",
    description: "O Brasil decide seu presidente em outubro de 2026. Com Lula, Tarcísio e Bolsonaro como possíveis candidatos, quem vai ser o próximo presidente?",
    category: "POLITICA",
    type: "MULTIPLE",
    closesAt: "2026-10-25T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=800&q=80",
    options: ["Lula (PT)", "Tarcísio de Freitas (Republicanos)", "Bolsonaro (PL)", "Outro candidato"],
  },
  {
    title: "Tarcísio de Freitas vai ser candidato a presidente em 2026?",
    description: "O governador de São Paulo é apontado como o favorito da direita para 2026. Ele vai oficializar sua candidatura à presidência?",
    category: "POLITICA",
    type: "BINARY",
    closesAt: "2026-07-01T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1575654613379-6a01bf78c0c3?auto=format&fit=crop&w=800&q=80",
    options: ["SIM", "NÃO"],
  },
  {
    title: "Bolsonaro vai ser condenado e ficar inelegível em 2026?",
    description: "Jair Bolsonaro responde a vários processos no Brasil. Ele vai receber condenação definitiva e ser considerado inelegível antes das eleições de 2026?",
    category: "POLITICA",
    type: "BINARY",
    closesAt: "2026-09-01T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?auto=format&fit=crop&w=800&q=80",
    options: ["SIM", "NÃO"],
  },
  {
    title: "O segundo turno em 2026 vai ser Lula vs. Tarcísio?",
    description: "A maioria das pesquisas aponta para um segundo turno entre Lula e Tarcísio de Freitas nas eleições presidenciais de outubro de 2026. Isso vai se concretizar?",
    category: "POLITICA",
    type: "BINARY",
    closesAt: "2026-10-05T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1501776192086-602832fae6e6?auto=format&fit=crop&w=800&q=80",
    options: ["SIM", "NÃO"],
  },

  /* ─── GEOPOLÍTICA ─────────────────────────────────────────────────────── */
  {
    title: "A guerra na Ucrânia vai terminar em 2026?",
    description: "O conflito entre Rússia e Ucrânia entrou em seu terceiro ano. Com pressão diplomática de Trump e negociações em curso, haverá um cessar-fogo ou acordo de paz em 2026?",
    category: "POLITICA",
    type: "BINARY",
    closesAt: "2026-12-31T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1646141988459-12a7c61aba1a?auto=format&fit=crop&w=800&q=80",
    options: ["SIM", "NÃO"],
  },
  {
    title: "Trump vai conseguir um acordo de paz Rússia-Ucrânia em 2026?",
    description: "O presidente dos EUA prometeu encerrar a guerra em 24 horas. Já meses depois, as negociações seguem complexas. Trump vai entregar um acordo formal em 2026?",
    category: "POLITICA",
    type: "BINARY",
    closesAt: "2026-12-31T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1580130601254-05fa235abeab?auto=format&fit=crop&w=800&q=80",
    options: ["SIM", "NÃO"],
  },
  {
    title: "A China vai tomar medidas militares contra Taiwan até 2027?",
    description: "As tensões no estreito de Taiwan estão no nível mais alto das últimas décadas. A China vai executar alguma ação militar significativa contra Taiwan até o fim de 2027?",
    category: "POLITICA",
    type: "BINARY",
    closesAt: "2027-01-01T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1569288063643-5d29ad64df09?auto=format&fit=crop&w=800&q=80",
    options: ["SIM", "NÃO"],
  },
  {
    title: "Os EUA vão entrar em recessão técnica em 2026?",
    description: "Com tarifas, juros elevados e incerteza política, a economia americana dá sinais de desaceleração. Os EUA vão registrar dois trimestres consecutivos de PIB negativo em 2026?",
    category: "ECONOMIA",
    type: "BINARY",
    closesAt: "2026-12-31T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    options: ["SIM", "NÃO"],
  },
  {
    title: "Qual potência vai dominar a IA até 2027?",
    description: "A corrida pela inteligência artificial entre EUA e China está esquentando. Qual país vai ser a potência dominante em IA até o final de 2027?",
    category: "POLITICA",
    type: "MULTIPLE",
    closesAt: "2027-01-01T23:59:00Z",
    imageUrl: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=800&q=80",
    options: ["Estados Unidos", "China", "Empate técnico", "Outro país"],
  },
]

async function main() {
  console.log(`\n🚀 Criando ${MARKETS.length} mercados...\n`)

  let created = 0
  let skipped = 0

  for (const m of MARKETS) {
    // Check if a market with this title already exists
    const existing = await db.execute({
      sql: "SELECT id FROM Market WHERE title = ?",
      args: [m.title],
    })

    if (existing.rows.length > 0) {
      console.log(`  ⏭  Já existe: "${m.title.slice(0, 60)}"`)
      skipped++
      continue
    }

    const marketId = id()
    const ts = now()

    // Insert market
    await db.execute({
      sql: `INSERT INTO Market (id, title, description, imageUrl, category, type, status, totalPool, closesAt, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, 'OPEN', 0, ?, ?, ?)`,
      args: [marketId, m.title, m.description, m.imageUrl, m.category, m.type, m.closesAt, ts, ts],
    })

    // Insert options
    for (const label of m.options) {
      await db.execute({
        sql: `INSERT INTO MarketOption (id, marketId, label, totalBet) VALUES (?, ?, ?, 0)`,
        args: [id(), marketId, label],
      })
    }

    console.log(`  ✅ ${m.category.padEnd(15)} ${m.title.slice(0, 60)}`)
    created++
  }

  console.log(`\n✨ Concluído: ${created} criados, ${skipped} ignorados (já existiam)\n`)
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
