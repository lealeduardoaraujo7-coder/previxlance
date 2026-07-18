// Fix remaining market images using Wikipedia REST API
// Run: node scripts/fix-images-2.mjs
import { createClient } from "@libsql/client"

const db = createClient({ url: "file:dev.db" })

// Wikipedia REST API — mais confiável que pageimages
async function wikiRest(title, lang = "en") {
  try {
    const encoded = encodeURIComponent(title.replace(/ /g, "_"))
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encoded}`
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "PrevixLance/1.0 (educational prediction market)" },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.thumbnail?.source ?? data?.originalimage?.source ?? null
  } catch {
    return null
  }
}

async function findImg(variants) {
  for (const [title, lang] of variants) {
    await new Promise(r => setTimeout(r, 250))
    const img = await wikiRest(title, lang)
    if (img) {
      console.log(`    ✓ ${lang}.wiki REST: "${title}"`)
      return img
    }
  }
  return null
}

// Direct Unsplash fallbacks específicos por assunto (quando Wiki falhar)
const SPECIFIC_FALLBACKS = {
  trump:     "https://images.unsplash.com/photo-1580130601254-05fa235abeab?auto=format&fit=crop&w=800&q=80",
  putin:     "https://images.unsplash.com/photo-1574280395952-e679a3e6e62e?auto=format&fit=crop&w=800&q=80",
  zelensky:  "https://images.unsplash.com/photo-1646141988459-12a7c61aba1a?auto=format&fit=crop&w=800&q=80",
  lula:      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=800&q=80",
  musk:      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=800&q=80",
  gta:       "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=800&q=80",
  anitta:    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80",
  sabrina:   "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80",
  stranger:  "https://images.unsplash.com/photo-1518655048521-f130df041f66?auto=format&fit=crop&w=800&q=80",
  openai:    "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=800&q=80",
  starship:  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80",
  tesla:     "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80",
  makhachev: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80",
}

const UPDATES = [
  // Política
  ["Trump vai sofrer", [["Donald Trump", "en"], ["Donald Trump", "pt"]], SPECIFIC_FALLBACKS.trump],
  ["Putin vai continuar", [["Vladimir Putin", "en"], ["Vladimir Putin", "pt"]], SPECIFIC_FALLBACKS.putin],
  ["Lula vai terminar", [["Luiz Inácio Lula da Silva", "pt"], ["Lula", "en"]], SPECIFIC_FALLBACKS.lula],
  ["Zelensky vai continuar", [["Volodymyr Zelenskyy", "en"], ["Volodymyr Zelensky", "pt"]], SPECIFIC_FALLBACKS.zelensky],
  ["Elon Musk vai sair", [["Elon Musk", "en"], ["Elon Musk", "pt"]], SPECIFIC_FALLBACKS.musk],

  // UFC campeão peso-leve (Islam)
  ["campeão peso-leve do UFC no fim", [["Islam Makhachev", "en"]], SPECIFIC_FALLBACKS.makhachev],

  // Entretenimento
  ["GTA 6 vai ser lançado", [["Grand Theft Auto VI", "en"]], SPECIFIC_FALLBACKS.gta],
  ["Anitta vai ganhar", [["Anitta", "pt"], ["Anitta (singer)", "en"]], SPECIFIC_FALLBACKS.anitta],
  ["Sabrina Carpenter", [["Sabrina Carpenter", "en"]], SPECIFIC_FALLBACKS.sabrina],
  ["Stranger Things Temporada 5", [["Stranger Things", "en"]], SPECIFIC_FALLBACKS.stranger],

  // Tecnologia
  ["OpenAI vai lançar", [["OpenAI", "en"]], SPECIFIC_FALLBACKS.openai],
  ["Starship da SpaceX", [["SpaceX Starship", "en"], ["Starship (spacecraft)", "en"]], SPECIFIC_FALLBACKS.starship],
  ["Tesla vai lançar o Robotaxi", [["Tesla, Inc.", "en"]], SPECIFIC_FALLBACKS.tesla],
]

async function main() {
  console.log(`\n🔧 Corrigindo ${UPDATES.length} imagens via REST API...\n`)
  let fixed = 0

  for (const [fragment, variants, fallback] of UPDATES) {
    const res = await db.execute({
      sql: "SELECT id, title FROM Market WHERE title LIKE ?",
      args: [`%${fragment}%`],
    })
    if (!res.rows.length) {
      console.log(`  ⚠  Não encontrado: "${fragment}"`)
      continue
    }

    const row = res.rows[0]
    console.log(`\n  🔍 "${(row.title ?? "").toString().slice(0, 55)}"`)

    const img = await findImg(variants)
    const finalImg = img ?? fallback

    if (finalImg) {
      await db.execute({
        sql: "UPDATE Market SET imageUrl = ? WHERE id = ?",
        args: [finalImg, row.id],
      })
      console.log(`  ✅ ${img ? "Wikipedia" : "Unsplash fallback"}`)
      fixed++
    }
  }

  console.log(`\n✨ ${fixed} imagens atualizadas\n`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
