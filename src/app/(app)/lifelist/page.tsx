import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sightings } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

const PAGE_SIZE = 100

export default async function LifelistPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await auth()
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1)

  const [lifelist, totalResult] = await Promise.all([
    db
      .select({
        speciesName: sightings.speciesName,
        commonName: sql<string>`max(${sightings.commonName})`,
        firstSeen: sql<Date>`min(${sightings.sightedAt})`,
        bestRating: sql<number>`max(${sightings.rating})`,
        count: sql<number>`count(*)`,
      })
      .from(sightings)
      .where(eq(sightings.userId, session!.user.id))
      .groupBy(sightings.speciesName)
      .orderBy(sql`min(${sightings.sightedAt})`)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ total: sql<number>`count(distinct ${sightings.speciesName})` })
      .from(sightings)
      .where(eq(sightings.userId, session!.user.id)),
  ])

  const total = Number(totalResult[0].total)
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const offset = (page - 1) * PAGE_SIZE

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black">Lifelist</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} {total === 1 ? "species" : "species"} observed
          </p>
        </div>
        {total > 0 && (
          <a
            href="/api/export/lifelist"
            download
            className="text-sm border-2 border-black text-black hover:bg-black hover:text-white px-3 py-1.5 transition-colors"
          >
            ↓ Export CSV
          </a>
        )}
      </div>

      {lifelist.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🦅</p>
          <p className="text-lg font-medium text-gray-600">Your lifelist is empty</p>
          <p className="text-sm mt-1">Log a sighting to start building it.</p>
        </div>
      ) : (
        <>
          <div className="border border-black divide-y divide-black">
            {lifelist.map((bird, idx) => (
              <div key={bird.speciesName} className="flex items-center gap-3 px-4 py-3.5">
                <span className="text-gray-400 font-mono text-sm w-7 shrink-0 text-right">
                  {offset + idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-black text-sm truncate">{bird.speciesName}</p>
                  {bird.commonName && (
                    <p className="text-xs text-gray-500 truncate">{bird.commonName}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-amber-400 text-xs">{"★".repeat(bird.bestRating)}{"☆".repeat(5 - bird.bestRating)}</span>
                    {Number(bird.count) > 1 && (
                      <span className="text-xs text-gray-300">{bird.count}×</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 text-xs text-gray-400">
                  {new Date(bird.firstSeen).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 text-sm">
              {page > 1 && (
                <Link href={`/lifelist?page=${page - 1}`} className="px-3 py-1.5 border border-black hover:bg-black hover:text-white transition-colors">
                  ← Prev
                </Link>
              )}
              <span className="text-gray-500">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`/lifelist?page=${page + 1}`} className="px-3 py-1.5 border border-black hover:bg-black hover:text-white transition-colors">
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
