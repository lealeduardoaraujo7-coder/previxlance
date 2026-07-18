// Seed script v2 — busca imagens reais da Wikipedia para cada mercado
// Run: node scripts/seed-markets-v2.mjs
import { createClient } from "@libsql/client"
import { randomUUID } from "crypto"

const db = createClient({ url: "file:dev.db" })
const uid = () => randomUUID()
const now = () => new Date().toISOString()

// ── Wikipedia image API ────────────────────────────────────────────────────
async function wikiImg(title, lang = "pt", size = 600) {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&pithumbsize=${size}&titles=${encodeURIComponent(title)}&origin=*`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    const data = await res.json()
    const page = Object.values(data?.query?.pages ?? {})[0]
    return page?.thumbnail?.source ?? null
  } catch {
    return null
  }
}

// ── Fallback Unsplash images por categoria ────────────────────────────────
const FB = {
  futebol:  "https://images.unsplash.com/photo-1551958219-acbc595d4a1a?auto=format&fit=crop&w=800&q=80",
  mma:      "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80",
  boxing:   "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80",
  politica: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=800&q=80",
  tech:     "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=800&q=80",
  crypto:   "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=800&q=80",
  space:    "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80",
  entert:   "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80",
  gaming:   "https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=800&q=80",
  guerra:   "https://images.unsplash.com/photo-1646141988459-12a7c61aba1a?auto=format&fit=crop&w=800&q=80",
  stadion:  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
  economia: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
}

// ── Lista de mercados ──────────────────────────────────────────────────────
// wiki: { title, lang? } — o script busca a imagem da Wikipedia automaticamente
// imageUrl: URL direta (quando não é de pessoa/Wikipedia)
const MARKETS = [

  /* ════════════════════ FUTEBOL ════════════════════ */
  {
    title: "Vinicius Jr. vai ganhar a Bola de Ouro 2026?",
    description: "Após mais uma temporada dominante com o Real Madrid e pela Seleção, o brasileiro é o grande favorito ao prêmio individual mais importante do futebol. Ele vai conquistar a Bola de Ouro 2026?",
    category: "FUTEBOL", type: "BINARY", closesAt: "2026-10-28T23:59:00Z",
    wiki: { title: "Vinícius Júnior", lang: "pt" }, fallback: FB.futebol,
    options: ["SIM", "NÃO"],
  },
  {
    title: "Neymar vai se aposentar do futebol em 2026?",
    description: "Neymar Jr. acumula lesões graves e ficou afastado por longos períodos. Com 34 anos em 2026, o craque vai anunciar sua aposentadoria do futebol profissional?",
    category: "FUTEBOL", type: "BINARY", closesAt: "2026-12-31T23:59:00Z",
    wiki: { title: "Neymar", lang: "pt" }, fallback: FB.futebol,
    options: ["SIM", "NÃO"],
  },
  {
    title: "Endrick vai marcar mais de 15 gols pelo Real Madrid em 2026?",
    description: "A joia brasileira chegou ao Real Madrid com grande expectativa. Aos 20 anos, Endrick vai explodir na temporada e marcar mais de 15 gols com a camisa merengue em 2026?",
    category: "FUTEBOL", type: "BINARY", closesAt: "2026-07-31T23:59:00Z",
    wiki: { title: "Endrick", lang: "pt" }, fallback: FB.futebol,
    options: ["SIM", "NÃO"],
  },
  {
    title: "Cristiano Ronaldo vai marcar mais de 30 gols em 2026?",
    description: "Aos 41 anos, CR7 segue quebrando recordes na Al-Nassr. O português vai superar a marca de 30 gols em todas as competições durante o ano de 2026?",
    category: "FUTEBOL", type: "BINARY", closesAt: "2026-12-31T23:59:00Z",
    wiki: { title: "Cristiano Ronaldo", lang: "pt" }, fallback: FB.futebol,
    options: ["SIM", "NÃO"],
  },
  {
    title: "Lionel Messi vai se aposentar do futebol em 2026?",
    description: "Messi joga no Inter Miami e foi destaque da Copa do Mundo 2022. Com 39 anos em 2026, o astro argentino vai anunciar o fim da carreira durante o Mundial 2026?",
    category: "FUTEBOL", type: "BINARY", closesAt: "2026-07-20T23:59:00Z",
    wiki: { title: "Lionel Messi", lang: "pt" }, fallback: FB.futebol,
    options: ["SIM", "NÃO"],
  },
  {
    title: "O Brasil vai ser campeão da Copa do Mundo 2026?",
    description: "A Copa do Mundo de 2026 será realizada nos EUA, Canadá e México. Com Vinicius, Rodrygo, Endrick e Militão, a Seleção vai conquistar o hexacampeonato tão sonhado?",
    category: "FUTEBOL", type: "BINARY", closesAt: "2026-07-19T23:59:00Z",
    wiki: { title: "Copa do Mundo FIFA de 2026", lang: "pt" }, fallback: FB.stadion,
    options: ["SIM", "NÃO"],
  },
  {
    title: "Quem vai ganhar o Brasileirão 2026?",
    description: "O Campeonato Brasileiro de 2026 promete ser disputado. Entre os grandes clubes, quem você acredita que vai ser campeão desta edição?",
    category: "FUTEBOL", type: "MULTIPLE", closesAt: "2026-12-08T23:59:00Z",
    wiki: { title: "Campeonato Brasileiro Série A", lang: "pt" }, fallback: FB.stadion,
    options: ["Flamengo", "Palmeiras", "Corinthians", "Outro clube"],
  },
  {
    title: "Rodrygo vai sair do Real Madrid em 2026?",
    description: "Rodrygo Goes está sendo monitorado por gigantes europeus, incluindo Manchester City e PSG. O atacante brasileiro vai deixar o Real Madrid durante a janela de 2026?",
    category: "FUTEBOL", type: "BINARY", closesAt: "2026-09-01T23:59:00Z",
    wiki: { title: "Rodrygo Goes", lang: "pt" }, fallback: FB.futebol,
    options: ["SIM", "NÃO"],
  },

  /* ════════════════════ UFC / LUTAS / BOXE ════════════════════ */
  {
    title: "Charles Oliveira vai reconquistar o cinturão peso-leve do UFC?",
    description: "Do Bronx perdeu o cinturão para Islam Makhachev e busca a revanche. O lutador de Guarulhos vai voltar ao topo da divisão peso-leve e se tornar campeão novamente em 2026?",
    category: "ENTRETENIMENTO", type: "BINARY", closesAt: "2026-12-31T23:59:00Z",
    wiki: { title: "Charles Oliveira", lang: "pt" }, fallback: FB.mma,
    options: ["SIM", "NÃO"],
  },
  {
    title: "Alex Poatan vai manter o cinturão médio-pesado em 2026?",
    description: "Alex Pereira, o Poatan, domina a divisão 205 libras do UFC com finalizações impressionantes. Ele vai continuar invicto e manter o cinturão durante todo o ano de 2026?",
    category: "ENTRETENIMENTO", type: "BINARY", closesAt: "2026-12-31T23:59:00Z",
    wiki: { title: "Alex Pereira (lutador)", lang: "pt" }, fallback: FB.mma,
    options: ["SIM", "NÃO"],
  },
  {
    title: "Renato Moicano vai chegar a uma disputa de cinturão no UFC em 2026?",
    description: "Renato Moicano vem em sequência impressionante de vitórias no UFC e já está entre os top 5 do ranking peso-leve. Ele vai ganhar o direito de disputar o cinturão em 2026?",
    category: "ENTRETENIMENTO", type: "BINARY", closesAt: "2026-12-31T23:59:00Z",
    wiki: { title: "Renato Moicano", lang: "pt" }, fallback: FB.mma,
    options: ["SIM", "NÃO"],
  },
  {
    title: "Conor McGregor vai voltar a lutar no UFC em 2026?",
    description: "McGregor ficou parado por quase dois anos após grave lesão na perna. O irlandês vai fazer seu retorno ao octágono e lutar no UFC em algum momento de 2026?",
    category: "ENTRETENIMENTO", type: "BINARY", closesAt: "2026-12-31T23:59:00Z",
    wiki: { title: "Conor McGregor", lang: "pt" }, fallback: FB.mma,
    options: ["SIM", "NÃO"],
  },
  {
    title: "Jon Jones vai se aposentar do MMA em 2026?",
    description: "Jon Jones, considerado o maior peso-pesado da história do UFC, enfrenta problemas físicos e segue sem data para lutar. O lendário campeão vai anunciar aposentadoria em 2026?",
    category: "ENTRETENIMENTO", type: "BINARY", closesAt: "2026-12-31T23:59:00Z",
    wiki: { title: "Jon Jones", lang: "en" }, fallback: FB.mma,
    options: ["SIM", "NÃO"],
  },
  {
    title: "Tyson Fury vai lutar mais de uma vez em 2026?",
    description: "The Gypsy King retornou ao boxe após sua derrota para Oleksandr Usyk. O britânico vai realizar pelo menos duas lutas durante o ano de 2026?",
    category: "ENTRETENIMENTO", type: "BINARY", closesAt: "2026-12-31T23:59:00Z",
    wiki: { title: "Tyson Fury", lang: "en" }, fallback: FB.boxing,
    options: ["SIM", "NÃO"],
  },
  {
    title: "Quem vai ser o campeão peso-leve do UFC no fim de 2026?",
    description: "A divisão 155 libras do UFC é a mais disputada do mundo. Islam Makhachev domina, mas Charles Oliveira e Arman Tsarukyan estão à espreita. Quem vai segurar o cinturão?",
    category: "ENTRETENIMENTO", type: "MULTIPLE", closesAt: "2026-12-31T23:59:00Z",
    wiki: { title: "Islam Makhachev", lang: "en" }, fallback: FB.mma,
    options: ["Islam Makhachev", "Charles Oliveira", "Arman Tsarukyan", "Outro lutador"],
  },

  /* ════════════════════ POLÍTICA / ELEIÇÕES ════════════════════ */
  {
    title: "Trump vai sofrer um processo de impeachment em 2026?",
    description: "Com a retomada do controle democrata na Câmara esperada para 2026, os opositores de Trump discutem novas formas de responsabilizá-lo. Os democratas vão iniciar um processo de impeachment?",
    category: "POLITICA", type: "BINARY", closesAt: "2026-12-31T23:59:00Z",
    wiki: { title: "Donald Trump", lang: "pt" }, fallback: FB.politica,
    options: ["SIM", "NÃO"],
  },
  {
    title: "Putin vai continuar no poder na Rússia até 2027?",
    description: "Vladimir Putin governa a Rússia há mais de 20 anos e foi reeleito em 2024 para mais 6 anos. Mas com a guerra na Ucrânia e pressão interna, ele vai continuar como presidente até 2027?",
    category: "POLITICA", type: "BINARY", closesAt: "2027-01-01T23:59:00Z",
    wiki: { title: "Vladimir Putin", lang: "pt" }, fallback: FB.politica,
    options: ["SIM", "NÃO"],
  },
  {
    title: "Lula vai terminar seu mandato em 2027?",
    description: "O presidente Luiz Inácio Lula da Silva enfrenta problemas de saúde e queda de popularidade. Diante dos desafios políticos e de saúde, Lula vai cumprir seu mandato até o final em janeiro de 2027?",
    category: "POLITICA", type: "BINARY", closesAt: "2027-01-01T23:59:00Z",
    wiki: { title: "Luiz Inácio Lula da Silva", lang: "pt" }, fallback: FB.politica,
    options: ["SIM", "NÃO"],
  },
  {
    title: "Zelensky vai continuar como presidente da Ucrânia em 2026?",
    description: "Volodymyr Zelensky lidera a Ucrânia durante a guerra com a Rússia. Com pressões internas e negociações de paz em andamento, ele vai permanecer no cargo durante todo o ano de 2026?",
    category: "POLITICA", type: "BINARY", closesAt: "2026-12-31T23:59:00Z",
    wiki: { title: "Volodymyr Zelensky", lang: "pt" }, fallback: FB.politica,
    options: ["SIM", "NÃO"],
  },
  {
    title: "Elon Musk vai sair do governo Trump em 2026?",
    description: "Elon Musk foi nomeado para liderar o DOGE (Departamento de Eficiência Governamental) por Trump. Com conflitos crescentes e críticas públicas, Musk vai deixar o cargo antes do final de 2026?",
    category: "POLITICA", type: "BINARY", closesAt: "2026-12-31T23:59:00Z",
    wiki: { title: "Elon Musk", lang: "pt" }, fallback: FB.politica,
    options: ["SIM", "NÃO"],
  },

  /* ════════════════════ ENTRETENIMENTO ════════════════════ */
  {
    title: "GTA 6 vai ser lançado em 2026?",
    description: "A Rockstar Games anunciou GTA 6 para 2025, mas com possíveis atrasos, o jogo mais aguardado da história pode escapar para 2026. O game vai chegar às lojas em 2026 definitivamente?",
    category: "ENTRETENIMENTO", type: "BINARY", closesAt: "2026-12-31T23:59:00Z",
    wiki: { title: "Grand Theft Auto VI", lang: "en" }, fallback: FB.gaming,
    options: ["SIM", "NÃO"],
  },
  {
    title: "Anitta vai ganhar um Grammy em 2026?",
    description: "Anitta é a artista brasileira mais ouvida do mundo e tem música nas paradas internacionais. Ela vai conquistar sua primeira estatueta do Grammy em 2026, seguindo os passos de seu histórico no Billboard?",
    category: "ENTRETENIMENTO", type: "BINARY", closesAt: "2026-02-10T23:59:00Z",
    wiki: { title: "Anitta (cantora)", lang: "pt" }, fallback: FB.entert,
    options: ["SIM", "NÃO"],
  },
  {
    title: "Sabrina Carpenter vai fazer show no Brasil em 2026?",
    description: "A cantora americana Sabrina Carpenter é um dos maiores fenômenos pop do mundo em 2025/26. Com seu Short n' Sweet Tour em andamento, ela vai incluir o Brasil em sua turnê internacional?",
    category: "ENTRETENIMENTO", type: "BINARY", closesAt: "2026-12-31T23:59:00Z",
    wiki: { title: "Sabrina Carpenter", lang: "en" }, fallback: FB.entert,
    options: ["SIM", "NÃO"],
  },
  {
    title: "Stranger Things Temporada 5 vai superar a 4 em audiência?",
    description: "A 4ª temporada de Stranger Things bateu recordes na Netflix. A temporada final, prometida para 2026, vai superar os números históricos da anterior e se tornar a mais assistida da série?",
    category: "ENTRETENIMENTO", type: "BINARY", closesAt: "2026-12-31T23:59:00Z",
    wiki: { title: "Stranger Things", lang: "pt" }, fallback: FB.entert,
    options: ["SIM", "NÃO"],
  },

  /* ════════════════════ TECNOLOGIA ════════════════════ */
  {
    title: "A OpenAI vai lançar o GPT-5 em 2026?",
    description: "O ChatGPT com GPT-4 revolucionou a IA. A OpenAI tem trabalhado em modelos ainda mais poderosos. O GPT-5, com capacidades multimodais avançadas, vai ser lançado ao público em 2026?",
    category: "OUTROS", type: "BINARY", closesAt: "2026-12-31T23:59:00Z",
    wiki: { title: "OpenAI", lang: "en" }, fallback: FB.tech,
    options: ["SIM", "NÃO"],
  },
  {
    title: "O Starship da SpaceX vai chegar à Lua em 2026?",
    description: "A NASA selecionou o Starship da SpaceX como o módulo lunar para a missão Artemis. Após os testes bem-sucedidos, o foguete mais poderoso da história vai levar humanos (ou pousar) na Lua em 2026?",
    category: "OUTROS", type: "BINARY", closesAt: "2026-12-31T23:59:00Z",
    wiki: { title: "SpaceX Starship", lang: "en" }, fallback: FB.space,
    options: ["SIM", "NÃO"],
  },
  {
    title: "A Tesla vai lançar o Robotaxi comercialmente em 2026?",
    description: "Elon Musk prometeu diversas vezes o Robotaxi completamente autônomo. Com o Cybercab anunciado, os veículos sem motorista da Tesla vão estar disponíveis comercialmente para o público em 2026?",
    category: "OUTROS", type: "BINARY", closesAt: "2026-12-31T23:59:00Z",
    wiki: { title: "Tesla, Inc.", lang: "pt" }, fallback: FB.tech,
    options: ["SIM", "NÃO"],
  },
]

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Criando ${MARKETS.length} mercados com imagens da Wikipedia...\n`)

  let created = 0
  let skipped = 0

  for (const m of MARKETS) {
    // Skip if already exists
    const existing = await db.execute({
      sql: "SELECT id FROM Market WHERE title = ?",
      args: [m.title],
    })
    if (existing.rows.length > 0) {
      console.log(`  ⏭  Já existe: "${m.title.slice(0, 55)}"`)
      skipped++
      continue
    }

    // Fetch image from Wikipedia
    let imageUrl = m.imageUrl ?? null
    if (m.wiki) {
      const img = await wikiImg(m.wiki.title, m.wiki.lang ?? "pt")
      imageUrl = img ?? m.fallback ?? null
      const src = img ? `Wikipedia (${m.wiki.title})` : "Fallback Unsplash"
      process.stdout.write(`  📸 ${src}\n`)
      // small delay to avoid hammering Wikipedia API
      await new Promise(r => setTimeout(r, 120))
    }

    const marketId = uid()
    const ts = now()

    await db.execute({
      sql: `INSERT INTO Market (id, title, description, imageUrl, category, type, status, totalPool, closesAt, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, 'OPEN', 0, ?, ?, ?)`,
      args: [marketId, m.title, m.description, imageUrl, m.category, m.type, m.closesAt, ts, ts],
    })

    for (const label of m.options) {
      await db.execute({
        sql: `INSERT INTO MarketOption (id, marketId, label, totalBet) VALUES (?, ?, ?, 0)`,
        args: [uid(), marketId, label],
      })
    }

    console.log(`  ✅ [${m.category.padEnd(15)}] ${m.title.slice(0, 55)}`)
    created++
  }

  console.log(`\n✨ Concluído: ${created} criados, ${skipped} ignorados\n`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
