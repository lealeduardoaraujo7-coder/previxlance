// Fix market images — tries multiple Wikipedia title variants
// Run: node scripts/fix-images.mjs
import { createClient } from "@libsql/client"

const db = createClient({ url: "file:dev.db" })

async function wikiImg(title, lang = "en", size = 600) {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&pithumbsize=${size}&titles=${encodeURIComponent(title)}&origin=*`
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const data = await res.json()
    const page = Object.values(data?.query?.pages ?? {})[0]
    const img = page?.thumbnail?.source ?? null
    if (img) console.log(`    ✓ ${lang}.wikipedia: "${title}"`)
    return img
  } catch (e) {
    return null
  }
}

// Try multiple title variants, first match wins
async function findImg(variants) {
  for (const [title, lang] of variants) {
    await new Promise(r => setTimeout(r, 150))
    const img = await wikiImg(title, lang)
    if (img) return img
  }
  return null
}

// Markets to update: [ [titleFragment, [[wikiTitle, lang], ...], fallbackUnsplash] ]
const UPDATES = [
  // ── FUTEBOL ────────────────────────────────────────────────────────────
  ["Rodrygo vai sair do Real Madrid", [
    ["Rodrygo", "pt"],
    ["Rodrygo Goes", "en"],
  ], null],

  // ── UFC / LUTAS ────────────────────────────────────────────────────────
  ["Alex Poatan", [
    ["Alex Pereira (lutador de artes marciais mistas)", "pt"],
    ["Alex Pereira (fighter)", "en"],
    ["Alex Pereira", "en"],
  ], null],

  ["Renato Moicano", [
    ["Renato Moicano", "pt"],
    ["Renato Moicano", "en"],
  ], null],

  ["Conor McGregor", [
    ["Conor McGregor", "pt"],
    ["Conor McGregor", "en"],
  ], null],

  ["Jon Jones vai se aposentar", [
    ["Jon Jones (lutador)", "pt"],
    ["Jon Jones (fighter)", "en"],
    ["Jon Jones", "en"],
  ], null],

  ["Tyson Fury", [
    ["Tyson Fury", "pt"],
    ["Tyson Fury", "en"],
  ], null],

  ["campeão peso-leve do UFC no fim de 2026", [
    ["Islam Makhachev", "pt"],
    ["Islam Makhachev", "en"],
  ], null],

  // ── POLÍTICA ───────────────────────────────────────────────────────────
  ["Trump vai sofrer um processo de impeachment", [
    ["Donald Trump", "pt"],
    ["Donald Trump", "en"],
  ], null],

  ["Putin vai continuar no poder", [
    ["Vladimir Putin", "pt"],
    ["Vladimir Putin", "en"],
  ], null],

  ["Lula vai terminar seu mandato", [
    ["Luiz Inácio Lula da Silva", "pt"],
    ["Lula", "pt"],
  ], null],

  ["Zelensky vai continuar como presidente", [
    ["Volodymyr Zelensky", "pt"],
    ["Volodymyr Zelenskyy", "en"],
  ], null],

  ["Elon Musk vai sair do governo", [
    ["Elon Musk", "pt"],
    ["Elon Musk", "en"],
  ], null],

  // ── ENTRETENIMENTO ─────────────────────────────────────────────────────
  ["GTA 6 vai ser lançado", [
    ["Grand Theft Auto VI", "en"],
    ["Grand Theft Auto VI", "pt"],
  ], null],

  ["Anitta vai ganhar um Grammy", [
    ["Anitta", "pt"],
    ["Anitta (singer)", "en"],
  ], null],

  ["Sabrina Carpenter vai fazer show", [
    ["Sabrina Carpenter", "en"],
    ["Sabrina Carpenter", "pt"],
  ], null],

  ["Stranger Things Temporada 5", [
    ["Stranger Things", "pt"],
    ["Stranger Things", "en"],
  ], null],

  // ── TECNOLOGIA ─────────────────────────────────────────────────────────
  ["OpenAI vai lançar o GPT-5", [
    ["OpenAI", "en"],
    ["ChatGPT", "en"],
  ], null],

  ["Starship da SpaceX", [
    ["SpaceX Starship", "en"],
    ["Starship (spacecraft)", "en"],
  ], null],

  ["Tesla vai lançar o Robotaxi", [
    ["Tesla, Inc.", "en"],
    ["Tesla, Inc.", "pt"],
  ], null],
]

async function main() {
  console.log(`\n🔧 Corrigindo imagens de ${UPDATES.length} mercados...\n`)

  let fixed = 0
  let failed = 0

  for (const [fragment, variants, fallback] of UPDATES) {
    // Find the market
    const res = await db.execute({
      sql: "SELECT id, title, imageUrl FROM Market WHERE title LIKE ?",
      args: [`%${fragment}%`],
    })
    if (!res.rows.length) {
      console.log(`  ⚠  Não encontrado: "${fragment}"`)
      failed++
      continue
    }

    const row = res.rows[0]
    console.log(`\n  🔍 "${(row.title ?? "").toString().slice(0, 55)}"`)

    const img = await findImg(variants)
    const finalImg = img ?? fallback ?? row.imageUrl

    if (img) {
      await db.execute({
        sql: "UPDATE Market SET imageUrl = ? WHERE id = ?",
        args: [img, row.id],
      })
      console.log(`  ✅ Imagem atualizada`)
      fixed++
    } else {
      console.log(`  ⚠  Nenhuma imagem encontrada (mantendo a atual)`)
      failed++
    }
  }

  console.log(`\n✨ ${fixed} imagens corrigidas, ${failed} não encontradas\n`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
