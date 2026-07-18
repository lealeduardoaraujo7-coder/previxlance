// Seed viral — 60+ mercados premium com imagens + volume inicial fake
// Run: node scripts/seed-viral.mjs
import { createClient } from "@libsql/client"
import { randomUUID } from "crypto"

const db = createClient({ url: "file:dev.db" })
const uid = () => randomUUID()
const now = () => new Date().toISOString()

// ── Wikipedia REST ─────────────────────────────────────────────────────────
async function wikiImg(title, lang = "pt", size = 600) {
  try {
    const enc = encodeURIComponent(title.replace(/ /g, "_"))
    const res = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${enc}`,
      { signal: AbortSignal.timeout(10000), headers: { "User-Agent": "PrevixLance/1.0" } }
    )
    if (!res.ok) return null
    const d = await res.json()
    return d?.thumbnail?.source ?? null
  } catch { return null }
}

async function img(variants) {
  for (const [t, l] of variants) {
    await sleep(180)
    const i = await wikiImg(t, l)
    if (i) { process.stdout.write(`    📸 ${l}.wiki: ${t}\n`); return i }
  }
  return null
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── Fallbacks Unsplash por tema ────────────────────────────────────────────
const F = {
  futebol:   "https://images.unsplash.com/photo-1551958219-acbc595d4a1a?auto=format&fit=crop&w=800&q=80",
  estadio:   "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
  copa:      "https://images.unsplash.com/photo-1509130872995-86c1159e4f66?auto=format&fit=crop&w=800&q=80",
  mma:       "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80",
  boxe:      "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80",
  politica:  "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=800&q=80",
  guerra:    "https://images.unsplash.com/photo-1646141988459-12a7c61aba1a?auto=format&fit=crop&w=800&q=80",
  bitcoin:   "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=800&q=80",
  crypto:    "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?auto=format&fit=crop&w=800&q=80",
  chart:     "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
  tech:      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=800&q=80",
  internet:  "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=800&q=80",
  celebr:    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80",
  bbb:       "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=800&q=80",
  taiwan:    "https://images.unsplash.com/photo-1569288063643-5d29ad64df09?auto=format&fit=crop&w=800&q=80",
  espaco:    "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80",
}

// ── Mercados ───────────────────────────────────────────────────────────────
// pool: valor total inicial em reais (multiplicado por 100 = centavos)
// opts: [label, pct_inicial]   pct define distribuição proporcional do pool
const M = [

  /* ═══════════════════════════ FUTEBOL ════════════════════════════════════ */
  {
    t: "Neymar vai ser convocado para a Copa do Mundo 2026?",
    d: "Após longas lesões e temporadas irregulares no Al-Hilal, Neymar ainda é uma incógnita para o Mundial. Dorival Júnior vai arriscar convocar o camisa 10 para a Copa em solo americano?",
    cat: "FUTEBOL", type: "BINARY", closes: "2026-05-20",
    wiki: [["Neymar","pt"]], fb: F.futebol,
    pool: 28000, opts: [["SIM",38],["NÃO",62]],
  },
  {
    t: "Messi vai jogar a Copa do Mundo 2026?",
    d: "Lionel Messi pode disputar seu último Mundial com a camisa da Argentina. Com 38 anos em 2026, o maior de todos os tempos vai estar em campo no torneio que acontece nos EUA, Canadá e México?",
    cat: "FUTEBOL", type: "BINARY", closes: "2026-05-20",
    wiki: [["Lionel Messi","pt"]], fb: F.futebol,
    pool: 45000, opts: [["SIM",61],["NÃO",39]],
  },
  {
    t: "Cristiano Ronaldo vai jogar a Copa do Mundo 2026?",
    d: "CR7 tem 41 anos durante a Copa de 2026 e Portugal se classificou. O português lendário vai estar em campo no seu provavelmente último Mundial? A motivação de Ronaldo é quase inabalável.",
    cat: "FUTEBOL", type: "BINARY", closes: "2026-05-20",
    wiki: [["Cristiano Ronaldo","pt"]], fb: F.futebol,
    pool: 38000, opts: [["SIM",57],["NÃO",43]],
  },
  {
    t: "Quem vai vencer a Champions League 2025/26?",
    d: "A Liga dos Campeões da Europa promete batalhas épicas entre os maiores clubes do mundo. Real Madrid, Manchester City, PSG e Barcelona são os maiores favoritos. Quem vai levantar a taça em 2026?",
    cat: "FUTEBOL", type: "MULTIPLE", closes: "2026-06-01",
    wiki: [["UEFA Champions League","en"],["Liga dos Campeões da UEFA","pt"]], fb: F.estadio,
    pool: 72000, opts: [["Real Madrid",41],["Manchester City",22],["PSG",17],["Barcelona",12],["Bayern Munich",8]],
  },
  {
    t: "O Flamengo vai vencer a Copa Libertadores 2026?",
    d: "O Flamengo é o clube brasileiro com maior investimento e elenco mais estrelado. Após conquistas recentes, o Mengão tem tudo para ser campeão da América novamente em 2026?",
    cat: "FUTEBOL", type: "BINARY", closes: "2026-11-28",
    wiki: [["Club de Regatas do Flamengo","pt"],["Flamengo","pt"]], fb: F.estadio,
    pool: 31000, opts: [["SIM",31],["NÃO",69]],
  },
  {
    t: "O Brasil vai chegar à final da Copa do Mundo 2026?",
    d: "A Seleção Canarinho carrega o peso de quase 24 anos sem título mundial. Com Vinicius, Rodrygo e Endrick no elenco, a equipe vai pelo menos chegar à grande final do torneio?",
    cat: "FUTEBOL", type: "BINARY", closes: "2026-07-15",
    wiki: [["Seleção Brasileira de Futebol","pt"]], fb: F.copa,
    pool: 52000, opts: [["SIM",48],["NÃO",52]],
  },
  {
    t: "Quem vai ser artilheiro da Copa do Mundo 2026?",
    d: "A bota de ouro da Copa do Mundo 2026 é um dos prêmios mais cobiçados do futebol. Entre os favoritos estão Vinicius Jr., Mbappé, Haaland e outros craques de elite. Quem vai marcar mais gols?",
    cat: "FUTEBOL", type: "MULTIPLE", closes: "2026-07-19",
    wiki: [["Copa do Mundo FIFA de 2026","pt"]], fb: F.copa,
    pool: 41000, opts: [["Vinicius Jr.",29],["Kylian Mbappé",26],["Erling Haaland",22],["Cristiano Ronaldo",14],["Outro jogador",9]],
  },
  {
    t: "O Real Madrid vai vencer a LaLiga 2025/26?",
    d: "O Real Madrid é o clube mais vitorioso da história do futebol mundial. Com Vinicius, Mbappé e Bellingham no ataque, a equipe merengue vai confirmar mais um título espanhol em 2026?",
    cat: "FUTEBOL", type: "BINARY", closes: "2026-05-24",
    wiki: [["Real Madrid Club de Fútbol","pt"],["Real Madrid CF","en"]], fb: F.estadio,
    pool: 25000, opts: [["SIM",52],["NÃO",48]],
  },
  {
    t: "O Corinthians vai ser rebaixado no Brasileirão 2026?",
    d: "O Corinthians vive uma crise financeira sem precedentes e luta para se manter na Série A. Com dívidas bilionárias e elenco desfalcado, o clube alvinegro corre o risco de cair para a segunda divisão?",
    cat: "FUTEBOL", type: "BINARY", closes: "2026-12-08",
    wiki: [["Sport Club Corinthians Paulista","pt"]], fb: F.estadio,
    pool: 18000, opts: [["SIM",29],["NÃO",71]],
  },
  {
    t: "Endrick vai ser titular da Seleção Brasileira na Copa?",
    d: "Com apenas 20 anos durante a Copa do Mundo 2026, Endrick é a grande promessa do Brasil. O atacante do Real Madrid vai ter responsabilidade de titular na campanha do hexacampeonato?",
    cat: "FUTEBOL", type: "BINARY", closes: "2026-06-11",
    wiki: [["Endrick","pt"]], fb: F.futebol,
    pool: 22000, opts: [["SIM",56],["NÃO",44]],
  },
  {
    t: "O Palmeiras vai ser campeão da Copa Libertadores 2026?",
    d: "O Palmeiras é o clube com mais conquistas na América nos últimos anos. Com Abel Ferreira no comando e elenco competitivo, o Verdão pode conquistar mais um título continental em 2026?",
    cat: "FUTEBOL", type: "BINARY", closes: "2026-11-28",
    wiki: [["Sociedade Esportiva Palmeiras","pt"]], fb: F.estadio,
    pool: 19000, opts: [["SIM",27],["NÃO",73]],
  },
  {
    t: "Kylian Mbappé vai ser o melhor jogador do mundo em 2026?",
    d: "Após a saída para o Real Madrid, Mbappé busca confirmar seu status como herdeiro de Messi e Ronaldo. O francês vai ganhar a Bola de Ouro 2026 e se consagrar como o melhor do planeta?",
    cat: "FUTEBOL", type: "BINARY", closes: "2026-10-28",
    wiki: [["Kylian Mbappé","pt"]], fb: F.futebol,
    pool: 34000, opts: [["SIM",44],["NÃO",56]],
  },

  /* ═════════════════════════ FAMOSOS DO BRASIL ════════════════════════════ */
  {
    t: "Virgínia Fonseca vai anunciar mais um filho em 2026?",
    d: "A influencer mais seguida do Brasil já tem três filhos com Zé Felipe. Com 25 anos e família numerosa, Virgínia vai anunciar mais uma gravidez durante o ano de 2026?",
    cat: "ENTRETENIMENTO", type: "BINARY", closes: "2026-12-31",
    wiki: [["Virgínia Fonseca","pt"]], fb: F.celebr,
    pool: 14000, opts: [["SIM",34],["NÃO",66]],
  },
  {
    t: "Felipe Neto vai abandonar o YouTube em 2026?",
    d: "Felipe Neto tem falado sobre esgotamento e mudança de carreira. Com mais de 45 milhões de inscritos, o youtuber vai realmente deixar a plataforma ou reduzir significativamente os conteúdos em 2026?",
    cat: "ENTRETENIMENTO", type: "BINARY", closes: "2026-12-31",
    wiki: [["Felipe Neto","pt"]], fb: F.celebr,
    pool: 9000, opts: [["SIM",22],["NÃO",78]],
  },
  {
    t: "Whindersson Nunes vai voltar à stand-up comedy em 2026?",
    d: "Após focar em lutas e outros projetos, Whindersson se afastou do stand-up. O comediante piauiense vai fazer sua grande volta ao humor com shows presenciais em 2026?",
    cat: "ENTRETENIMENTO", type: "BINARY", closes: "2026-12-31",
    wiki: [["Whindersson Nunes","pt"]], fb: F.celebr,
    pool: 7500, opts: [["SIM",63],["NÃO",37]],
  },
  {
    t: "Gusttavo Lima vai ter algum problema judicial em 2026?",
    d: "O Embaixador esteve envolvido em polêmicas com cassinos ilegais. Com investigações em andamento, Gusttavo Lima vai enfrentar alguma consequência judicial formal em 2026?",
    cat: "ENTRETENIMENTO", type: "BINARY", closes: "2026-12-31",
    wiki: [["Gusttavo Lima","pt"]], fb: F.celebr,
    pool: 16000, opts: [["SIM",41],["NÃO",59]],
  },
  {
    t: "MC Daniel vai ser o artista mais ouvido do Brasil em 2026?",
    d: "MC Daniel domina as paradas brasileiras e plataformas de streaming. Com hits consecutivos e enorme base de fãs, ele vai superar todos os concorrentes e ser o número 1 do Brasil em 2026?",
    cat: "ENTRETENIMENTO", type: "BINARY", closes: "2026-12-31",
    wiki: [["MC Daniel","pt"]], fb: F.celebr,
    pool: 11000, opts: [["SIM",44],["NÃO",56]],
  },
  {
    t: "Quem vai ganhar o BBB 27?",
    d: "O Big Brother Brasil é o maior reality show do país e movimenta bilhões em apostas e engajamento. Quem será o vencedor da 27ª edição e levará o prêmio de R$1,5 milhão?",
    cat: "ENTRETENIMENTO", type: "MULTIPLE", closes: "2027-04-01",
    wiki: [["Big Brother Brasil","pt"]], fb: F.bbb,
    pool: 33000, opts: [["Participante do Nordeste",38],["Participante do Sudeste",31],["Participante do Sul",18],["Participante de outra região",13]],
  },
  {
    t: "Casimiro vai assinar contrato com alguma emissora de TV em 2026?",
    d: "Casimiro Miguel revolucionou o jornalismo esportivo no streaming e é disputado por grandes canais. O streamer vai fechar algum contrato com Globo, Band, SBT ou outra emissora de TV em 2026?",
    cat: "ENTRETENIMENTO", type: "BINARY", closes: "2026-12-31",
    wiki: [["Casimiro Miguel","pt"]], fb: F.celebr,
    pool: 12000, opts: [["SIM",39],["NÃO",61]],
  },
  {
    t: "Anitta vai se casar em 2026?",
    d: "Anitta tem vivido intensa vida amorosa às olhos do público. Após diversos relacionamentos, a Poderosa vai oficializar algum amor e se casar em cerimônia oficial durante o ano de 2026?",
    cat: "ENTRETENIMENTO", type: "BINARY", closes: "2026-12-31",
    wiki: [["Anitta","pt"]], fb: F.celebr,
    pool: 8500, opts: [["SIM",21],["NÃO",79]],
  },
  {
    t: "Zé Felipe vai lançar álbum de estúdio em 2026?",
    d: "Zé Felipe consolidou seu status de grande nome do sertanejo universitário ao lado de Virgínia. O cantor vai lançar um álbum inédito completo em 2026 para consolidar ainda mais sua carreira?",
    cat: "ENTRETENIMENTO", type: "BINARY", closes: "2026-12-31",
    wiki: [["Zé Felipe","pt"]], fb: F.celebr,
    pool: 6000, opts: [["SIM",58],["NÃO",42]],
  },
  {
    t: "O Carlinhos Maia vai ter mais de 50 milhões de seguidores em 2026?",
    d: "Carlinhos Maia é um dos maiores influenciadores do Brasil. Com crescimento constante, ele vai atingir a marca histórica de 50 milhões de seguidores no Instagram em algum momento de 2026?",
    cat: "ENTRETENIMENTO", type: "BINARY", closes: "2026-12-31",
    wiki: [["Carlinhos Maia","pt"]], fb: F.celebr,
    pool: 5500, opts: [["SIM",47],["NÃO",53]],
  },

  /* ═══════════════════════════ POLÍTICA ═══════════════════════════════════ */
  {
    t: "Trump vai impor tarifas acima de 100% à China em 2026?",
    d: "Donald Trump já impôs tarifas históricas à China em seu segundo mandato. Com a guerra comercial escalando, o presidente americano vai elevar as tarifas a mais de 100% para produtos chineses em 2026?",
    cat: "POLITICA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Donald Trump","en"]], fb: F.politica,
    pool: 42000, opts: [["SIM",67],["NÃO",33]],
  },
  {
    t: "Bolsonaro vai ser preso em 2026?",
    d: "Jair Bolsonaro é alvo de múltiplos inquéritos, incluindo o da tentativa de golpe de Estado. O STF ou a Justiça Federal vai determinar a prisão do ex-presidente antes das eleições de outubro de 2026?",
    cat: "POLITICA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Jair Bolsonaro","pt"]], fb: F.politica,
    pool: 58000, opts: [["SIM",43],["NÃO",57]],
  },
  {
    t: "Netanyahu vai ser preso por crimes de guerra?",
    d: "O Tribunal Penal Internacional emitiu mandado de prisão contra Benjamin Netanyahu. Algum país vai efetivamente prender o líder israelense por crimes de guerra em Gaza em 2026?",
    cat: "POLITICA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Benjamin Netanyahu","en"]], fb: F.politica,
    pool: 29000, opts: [["SIM",12],["NÃO",88]],
  },
  {
    t: "Kim Jong-un vai testar uma bomba nuclear em 2026?",
    d: "A Coreia do Norte tem acelerado seu programa nuclear. Kim Jong-un vai ordenar um novo teste de bomba nuclear, provocando crise diplomática global em 2026?",
    cat: "POLITICA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Kim Jong-un","pt"]], fb: F.politica,
    pool: 24000, opts: [["SIM",34],["NÃO",66]],
  },
  {
    t: "A OTAN vai entrar em conflito direto com a Rússia em 2026?",
    d: "Com a guerra na Ucrânia sem solução e incidentes se multiplicando, existe o risco real de confronto entre tropas da OTAN e forças russas em solo europeu?",
    cat: "POLITICA", type: "BINARY", closes: "2026-12-31",
    wiki: [["OTAN","pt"],["NATO","en"]], fb: F.guerra,
    pool: 35000, opts: [["SIM",18],["NÃO",82]],
  },
  {
    t: "Xi Jinping vai se reunir com Trump em 2026?",
    d: "Com a guerra comercial e tensões sobre Taiwan, a relação China-EUA é das mais tensas da história. Os dois líderes vão realizar uma cúpula bilateral presencial em algum momento de 2026?",
    cat: "POLITICA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Xi Jinping","pt"]], fb: F.politica,
    pool: 19000, opts: [["SIM",61],["NÃO",39]],
  },
  {
    t: "O Brasil vai quebrar a meta fiscal em 2026?",
    d: "Com gastos crescentes e pressão sobre o arcabouço fiscal, o governo Lula enfrenta desafio enorme para manter as contas no azul. O Brasil vai descumprir a meta fiscal estabelecida para 2026?",
    cat: "POLITICA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Luiz Inácio Lula da Silva","pt"]], fb: F.politica,
    pool: 23000, opts: [["SIM",62],["NÃO",38]],
  },
  {
    t: "Trump vai tentar comprar a Groenlândia formalmente?",
    d: "Trump já manifestou interesse na Groenlândia como território estratégico dos EUA. O presidente americano vai fazer uma proposta formal ou ação diplomática concreta para adquirir a ilha em 2026?",
    cat: "POLITICA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Donald Trump","en"]], fb: F.politica,
    pool: 17000, opts: [["SIM",53],["NÃO",47]],
  },

  /* ═══════════════════════════ CRYPTO ═════════════════════════════════════ */
  {
    t: "Bitcoin vai atingir $150.000 antes de junho de 2026?",
    d: "Com os ETFs de Bitcoin acumulando bilhões e o halving de 2024 no retrovisor, o BTC tem todos os fundamentos para uma corrida épica. O valor vai cruzar a barreira dos $150k ainda no primeiro semestre?",
    cat: "ECONOMIA", type: "BINARY", closes: "2026-06-01",
    wiki: [["Bitcoin","pt"]], fb: F.bitcoin,
    pool: 89000, opts: [["SIM",54],["NÃO",46]],
  },
  {
    t: "Bitcoin vai cair abaixo de $50.000 em 2026?",
    d: "O mercado de cripto é extremamente volátil. Mesmo em ciclo de alta, o BTC pode ter correções severas. Algum evento macro, regulatório ou de mercado vai derrubar o Bitcoin abaixo dos $50k em 2026?",
    cat: "ECONOMIA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Bitcoin","pt"]], fb: F.bitcoin,
    pool: 61000, opts: [["SIM",19],["NÃO",81]],
  },
  {
    t: "Qual será o preço do Bitcoin em 31 de dezembro de 2026?",
    d: "O Bitcoin termina mais um ciclo histórico. Analistas divergem entre otimismo extremo e cautela. Em qual faixa de preço o BTC vai fechar o último dia de 2026?",
    cat: "ECONOMIA", type: "MULTIPLE", closes: "2026-12-31",
    wiki: [["Bitcoin","en"]], fb: F.chart,
    pool: 134000, opts: [["Abaixo de $80.000",11],["$80k – $130k",28],["$130k – $200k",38],["Acima de $200k",23]],
  },
  {
    t: "Solana vai atingir novo ATH em 2026?",
    d: "Solana ultrapassou $200 e se consolida como a principal alternativa ao Ethereum para DeFi e NFTs. A rede rápida e barata vai atingir um novo máximo histórico superando seu ATH em 2026?",
    cat: "ECONOMIA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Solana (blockchain platform)","en"],["Solana","pt"]], fb: F.crypto,
    pool: 47000, opts: [["SIM",61],["NÃO",39]],
  },
  {
    t: "Dogecoin vai atingir $1,00 em 2026?",
    d: "O Dogecoin, a moeda dos memes, já atingiu $0.74 em seu pico. Com Elon Musk no governo americano e o mercado em alta, a DOGE vai finalmente quebrar a barreira psicológica de $1 dólar?",
    cat: "ECONOMIA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Dogecoin","en"]], fb: F.crypto,
    pool: 53000, opts: [["SIM",37],["NÃO",63]],
  },
  {
    t: "Um país soberano vai adotar Bitcoin como reserva oficial?",
    d: "El Salvador foi pioneiro no Bitcoin como moeda legal. Mas a adoção do BTC como reserva de um país com economia relevante — similar ao ouro — vai acontecer até dezembro de 2027?",
    cat: "ECONOMIA", type: "BINARY", closes: "2027-01-01",
    wiki: [["Bitcoin","en"]], fb: F.bitcoin,
    pool: 38000, opts: [["SIM",42],["NÃO",58]],
  },
  {
    t: "Qual será a maior criptomoeda por market cap no fim de 2026?",
    d: "O domínio do Bitcoin pode ser desafiado. Ethereum, Solana e outros projetos ganham terreno. Qual token vai liderar o ranking de capitalização de mercado ao fechar 2026?",
    cat: "ECONOMIA", type: "MULTIPLE", closes: "2026-12-31",
    wiki: [["Criptomoeda","pt"]], fb: F.chart,
    pool: 71000, opts: [["Bitcoin (BTC)",68],["Ethereum (ETH)",21],["Solana (SOL)",7],["Outro token",4]],
  },
  {
    t: "XRP (Ripple) vai superar $10 em 2026?",
    d: "O XRP da Ripple ganhou impulso com a vitória parcial contra a SEC e criptomoedas institucionais. O token vai atingir dois dígitos e superar os $10 em algum ponto do ciclo de alta de 2026?",
    cat: "ECONOMIA", type: "BINARY", closes: "2026-12-31",
    wiki: [["XRP (cryptocurrency)","en"],["Ripple Labs","en"]], fb: F.crypto,
    pool: 44000, opts: [["SIM",28],["NÃO",72]],
  },
  {
    t: "Um memecoin vai entrar no top 10 de market cap em 2026?",
    d: "Dogecoin e Shiba Inu já entraram no top 10 antes. Com o ciclo atual favorecendo especulação extrema, algum memecoin vai se consolidar entre as 10 maiores criptomoedas por capitalização em 2026?",
    cat: "ECONOMIA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Memecoin","en"]], fb: F.crypto,
    pool: 29000, opts: [["SIM",49],["NÃO",51]],
  },
  {
    t: "Ethereum vai superar $8.000 em 2026?",
    d: "O Ethereum continua sendo a base do DeFi, NFTs e camada 2. Com o upgrade Pectra e ETFs aprovados, o ETH vai romper o nível histórico de $8k durante o bull market de 2026?",
    cat: "ECONOMIA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Ethereum","pt"]], fb: F.crypto,
    pool: 55000, opts: [["SIM",44],["NÃO",56]],
  },
  {
    t: "A Binance vai ser regulamentada nos EUA formalmente em 2026?",
    d: "A Binance chegou a acordo com o Departamento de Justiça dos EUA. Com CZ saindo da CEO e CriptoFriendly voltando, a maior exchange do mundo vai conseguir operar legalmente nos EUA em 2026?",
    cat: "ECONOMIA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Binance","en"]], fb: F.chart,
    pool: 26000, opts: [["SIM",55],["NÃO",45]],
  },

  /* ══════════════════════ GUERRAS E GEOPOLÍTICA ═══════════════════════════ */
  {
    t: "Israel vai atacar o Irã militarmente em 2026?",
    d: "Após anos de guerra nas sombras, Israel e Irã já trocaram ataques diretos. Com o programa nuclear iraniano avançando, o governo israelense vai executar um ataque militar de grande escala ao Irã em 2026?",
    cat: "POLITICA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Israel","pt"]], fb: F.guerra,
    pool: 41000, opts: [["SIM",31],["NÃO",69]],
  },
  {
    t: "A China vai fazer bloqueio naval a Taiwan em 2026?",
    d: "Exercícios militares chineses ao redor de Taiwan se intensificaram. A China vai executar um bloqueio naval formal ou cerco à ilha em resposta a alguma provocação em 2026?",
    cat: "POLITICA", type: "BINARY", closes: "2026-12-31",
    wiki: [["República da China (Taiwan)","pt"],["Taiwan","en"]], fb: F.taiwan,
    pool: 37000, opts: [["SIM",14],["NÃO",86]],
  },
  {
    t: "O conflito em Gaza vai continuar em 2026?",
    d: "A guerra entre Israel e Hamas completou mais de um ano de combates intensos. Haverá algum cessar-fogo permanente ou acordo de paz que encerre os conflitos em Gaza durante 2026?",
    cat: "POLITICA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Conflito israelense-palestino","pt"],["Israel–Hamas war","en"]], fb: F.guerra,
    pool: 48000, opts: [["Guerra continua",74],["Paz alcançada",26]],
  },
  {
    t: "Os EUA vão entrar em guerra com o Irã em 2026?",
    d: "As tensões no Oriente Médio atingiram seu pico. Com Trump no poder e ataques do Irã a aliados americanos, os Estados Unidos vão iniciar operações militares diretas contra o regime iraniano em 2026?",
    cat: "POLITICA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Irão","pt"],["Iran","en"]], fb: F.guerra,
    pool: 32000, opts: [["SIM",19],["NÃO",81]],
  },
  {
    t: "A Rússia vai conquistar mais território ucraniano em 2026?",
    d: "A guerra na Ucrânia segue com Rússia avançando lentamente. Com pressões de paz e recursos militares sendo testados, a Rússia vai conseguir ampliar seu território controlado na Ucrânia em 2026?",
    cat: "POLITICA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Invasão da Ucrânia pela Rússia","pt"]], fb: F.guerra,
    pool: 39000, opts: [["SIM",58],["NÃO",42]],
  },
  {
    t: "A Venezuela vai invadir a Guiana em 2026?",
    d: "Maduro intensificou as ameaças sobre a região de Essequibo, reivindicando o território guianense. A Venezuela vai executar alguma ação militar ou incursão formal no território da Guiana em 2026?",
    cat: "POLITICA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Venezuela","pt"]], fb: F.guerra,
    pool: 18000, opts: [["SIM",8],["NÃO",92]],
  },

  /* ═══════════════════════ CULTURA E INTERNET ════════════════════════════ */
  {
    t: "O TikTok vai ser banido permanentemente nos EUA?",
    d: "O TikTok sobreviveu ao prazo de desvenda imposto pelo Congresso americano. Mas a ameaça de banimento permanente por questões de segurança nacional ainda existe. A plataforma vai ser banida definitivamente nos EUA?",
    cat: "OUTROS", type: "BINARY", closes: "2026-12-31",
    wiki: [["TikTok","pt"]], fb: F.internet,
    pool: 63000, opts: [["SIM",31],["NÃO",69]],
  },
  {
    t: "Qual modelo de IA vai dominar o mercado em 2026?",
    d: "A guerra pela IA generativa está esquentando com OpenAI, Google, Meta e Anthropic investindo bilhões. Qual empresa vai ter o modelo mais usado e influente no final de 2026?",
    cat: "OUTROS", type: "MULTIPLE", closes: "2026-12-31",
    wiki: [["Inteligência artificial","pt"]], fb: F.tech,
    pool: 55000, opts: [["OpenAI (ChatGPT)",47],["Google (Gemini)",29],["Meta (Llama)",14],["Anthropic (Claude)",10]],
  },
  {
    t: "O Bluesky vai superar 100 milhões de usuários ativos?",
    d: "O Bluesky cresceu explosivamente após êxodos do X/Twitter. A rede social descentralizada vai consolidar 100 milhões de usuários ativos mensais em algum momento de 2026?",
    cat: "OUTROS", type: "BINARY", closes: "2026-12-31",
    wiki: [["Bluesky","en"]], fb: F.internet,
    pool: 14000, opts: [["SIM",38],["NÃO",62]],
  },
  {
    t: "A Meta vai lançar óculos de realidade mista para o público em 2026?",
    d: "A Meta tem apostado bilhões no metaverso e em hardware de realidade mista. Um produto acessível de AR/VR da Meta vai chegar ao mercado de consumo amplo em algum momento de 2026?",
    cat: "OUTROS", type: "BINARY", closes: "2026-12-31",
    wiki: [["Meta Platforms","en"]], fb: F.tech,
    pool: 21000, opts: [["SIM",52],["NÃO",48]],
  },
  {
    t: "A Netflix vai aumentar preços no Brasil em 2026?",
    d: "A Netflix tem ajustado preços globalmente para compensar o fim do compartilhamento de senhas. Com custos de produção crescentes, a plataforma vai anunciar mais um reajuste no Brasil em 2026?",
    cat: "OUTROS", type: "BINARY", closes: "2026-12-31",
    wiki: [["Netflix","pt"]], fb: F.tech,
    pool: 12000, opts: [["SIM",71],["NÃO",29]],
  },
  {
    t: "Um influencer vai ser preso por golpe financeiro no Brasil?",
    d: "Com a proliferação de 'gurus financeiros' e esquemas de pirâmide nas redes sociais, a Polícia Federal tem investigado dezenas de casos. Algum influencer famoso vai ser preso por golpe financeiro em 2026?",
    cat: "OUTROS", type: "BINARY", closes: "2026-12-31",
    wiki: [["Influenciador digital","pt"]], fb: F.celebr,
    pool: 19000, opts: [["SIM",57],["NÃO",43]],
  },
  {
    t: "A Apple vai lançar iPhone com IA nativa avançada em 2026?",
    d: "A Apple Intelligence está sendo integrada ao iPhone. O iPhone 18 ou 19 vai trazer capacidades de IA generativa que rivalizam com o ChatGPT diretamente no dispositivo, sem internet?",
    cat: "OUTROS", type: "BINARY", closes: "2026-12-31",
    wiki: [["Apple Inc.","en"]], fb: F.tech,
    pool: 28000, opts: [["SIM",73],["NÃO",27]],
  },
  {
    t: "O X (antigo Twitter) vai falir ou ser vendido em 2026?",
    d: "Desde a compra de Elon Musk, o X perdeu anunciantes e usuários. Com dívidas bilionárias e receita em queda, a plataforma vai entrar em processo de falência ou ser vendida a outro grupo em 2026?",
    cat: "OUTROS", type: "BINARY", closes: "2026-12-31",
    wiki: [["X (rede social)","pt"],["X Corp.","en"]], fb: F.internet,
    pool: 43000, opts: [["SIM",17],["NÃO",83]],
  },
  {
    t: "Elon Musk vai sair do cargo público nos EUA em 2026?",
    d: "Elon Musk lidera o DOGE mas enfrenta protestos, boicotes e rejeição pública crescente. O empresário vai deixar seu papel no governo Trump antes do final do ano de 2026?",
    cat: "OUTROS", type: "BINARY", closes: "2026-12-31",
    wiki: [["Elon Musk","en"]], fb: F.tech,
    pool: 51000, opts: [["SIM",59],["NÃO",41]],
  },
  {
    t: "Haverá uma recessão global em 2026?",
    d: "Com guerra comercial EUA-China, juros altos por mais tempo e conflitos geopolíticos multiplicados, o FMI e Banco Mundial apontam riscos crescentes. O mundo vai entrar em recessão técnica coordenada em 2026?",
    cat: "ECONOMIA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Recessão econômica","pt"]], fb: F.chart,
    pool: 67000, opts: [["SIM",28],["NÃO",72]],
  },
  {
    t: "O ouro vai superar $4.000 por onça em 2026?",
    d: "O ouro atingiu $3.000 em 2025 pela primeira vez. Com incerteza geopolítica, inflação persistente e compras de bancos centrais em máximas, o metal precioso vai quebrar o nível histórico de $4k em 2026?",
    cat: "ECONOMIA", type: "BINARY", closes: "2026-12-31",
    wiki: [["Ouro","pt"]], fb: F.chart,
    pool: 44000, opts: [["SIM",41],["NÃO",59]],
  },
]

// ── Create markets ─────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Criando ${M.length} mercados virais...\n`)
  let created = 0, skipped = 0

  for (const m of M) {
    // Check duplicate
    const ex = await db.execute({ sql: "SELECT id FROM Market WHERE title = ?", args: [m.t] })
    if (ex.rows.length) { console.log(`  ⏭  ${m.t.slice(0,55)}`); skipped++; continue }

    // Fetch image
    let imageUrl = m.imageUrl ?? null
    if (m.wiki) {
      const fetched = await img(m.wiki)
      imageUrl = fetched ?? m.fb ?? null
      if (!fetched && m.fb) process.stdout.write(`    📸 Unsplash fallback\n`)
    }

    // Compute pool distribution
    const totalCents = (m.pool ?? 5000) * 100
    const optTotal = m.opts.reduce((s, o) => s + o[1], 0)
    const optionsData = m.opts.map(([label, pct]) => ({
      label,
      totalBet: Math.round((pct / optTotal) * totalCents),
    }))

    // Insert market
    const marketId = uid(), ts = now()
    await db.execute({
      sql: `INSERT INTO Market (id, title, description, imageUrl, category, type, status, totalPool, closesAt, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?, ?, ?, ?)`,
      args: [marketId, m.t, m.d, imageUrl, m.cat, m.type,
             totalCents, new Date(m.closes).toISOString(), ts, ts],
    })

    // Insert options
    for (const { label, totalBet } of optionsData) {
      await db.execute({
        sql: `INSERT INTO MarketOption (id, marketId, label, totalBet) VALUES (?, ?, ?, ?)`,
        args: [uid(), marketId, label, totalBet],
      })
    }

    const vol = (totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    console.log(`  ✅ [${m.cat.padEnd(14)}] ${m.t.slice(0,52)} | ${vol}`)
    created++
  }

  console.log(`\n✨ ${created} criados, ${skipped} ignorados\n`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
