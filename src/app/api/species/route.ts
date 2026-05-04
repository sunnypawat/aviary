import { NextRequest } from "next/server"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

type Species = { sciName: string; comName: string }

let _cache: Species[] | null = null

function loadTaxonomy(): Species[] {
  if (_cache) return _cache
  const path = join(process.cwd(), "src/data/taxonomy.json")
  if (!existsSync(path)) return []
  _cache = JSON.parse(readFileSync(path, "utf8")) as Species[]
  return _cache
}

export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? ""
  if (q.length < 2) return Response.json([])

  const taxonomy = loadTaxonomy()
  const results: Species[] = []

  for (const s of taxonomy) {
    const com = s.comName.toLowerCase()
    const sci = s.sciName.toLowerCase()
    if (com.startsWith(q) || sci.startsWith(q)) {
      results.push(s)
      if (results.length === 8) return Response.json(results)
    }
  }
  for (const s of taxonomy) {
    if (results.length >= 8) break
    const com = s.comName.toLowerCase()
    const sci = s.sciName.toLowerCase()
    if (
      !results.includes(s) &&
      (com.includes(q) || sci.includes(q))
    ) {
      results.push(s)
    }
  }

  return Response.json(results.slice(0, 8))
}
