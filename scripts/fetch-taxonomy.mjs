/**
 * Fetches the eBird/Clements taxonomy and writes a trimmed JSON to src/data/taxonomy.json.
 * Run once: node scripts/fetch-taxonomy.mjs
 *
 * Requires a free eBird API key — get one at https://ebird.org/api/keygen
 * Set it in .env.local as EBIRD_API_KEY=your_key
 */

import { writeFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { config } from "dotenv"

config({ path: ".env.local" })

const apiKey = process.env.EBIRD_API_KEY
if (!apiKey) {
  console.error("Missing EBIRD_API_KEY in .env.local")
  console.error("Get a free key at https://ebird.org/api/keygen")
  process.exit(1)
}

console.log("Fetching eBird taxonomy…")
const res = await fetch("https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json&locale=en", {
  headers: { "x-ebirdapitoken": apiKey },
})

if (!res.ok) {
  console.error(`eBird API error: ${res.status} ${res.statusText}`)
  process.exit(1)
}

const raw = await res.json()

// Keep only species (not subspecies/spuh/slash entries) and trim fields
const species = raw
  .filter((t) => t.category === "species")
  .map((t) => ({ sciName: t.sciName, comName: t.comName }))

const __dir = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dir, "../src/data")
mkdirSync(outDir, { recursive: true })

const outPath = join(outDir, "taxonomy.json")
writeFileSync(outPath, JSON.stringify(species))
console.log(`Wrote ${species.length} species to src/data/taxonomy.json`)
