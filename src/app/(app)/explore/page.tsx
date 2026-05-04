import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sightings, users, sightingPhotos, likes } from "@/lib/db/schema"
import { count, desc, eq, inArray } from "drizzle-orm"
import type { SightingPhoto } from "@/lib/db/schema"
import { ExploreLoadMore } from "./load-more"

const PAGE_SIZE = 20

export default async function ExplorePage() {
  const session = await auth()

  const feed = await db
    .select({
      id: sightings.id,
      speciesName: sightings.speciesName,
      commonName: sightings.commonName,
      rating: sightings.rating,
      notes: sightings.notes,
      locationName: sightings.locationName,
      sightedAt: sightings.sightedAt,
      authorName: users.name,
      authorUsername: users.username,
    })
    .from(sightings)
    .innerJoin(users, eq(sightings.userId, users.id))
    .where(eq(sightings.visibility, "public"))
    .orderBy(desc(sightings.sightedAt))
    .limit(PAGE_SIZE)

  const sightingIds = feed.map((s) => s.id)
  const [photos, likeCounts] = sightingIds.length === 0 ? [[], []] : await Promise.all([
    db.select().from(sightingPhotos).where(inArray(sightingPhotos.sightingId, sightingIds)),
    db.select({ sightingId: likes.sightingId, count: count() })
      .from(likes).where(inArray(likes.sightingId, sightingIds)).groupBy(likes.sightingId),
  ])

  const photosBySighting = (photos as SightingPhoto[]).reduce<Record<string, SightingPhoto[]>>(
    (acc, p) => ({ ...acc, [p.sightingId]: [...(acc[p.sightingId] ?? []), p] }), {}
  )
  const likesBySighting = (likeCounts as { sightingId: string; count: number }[]).reduce<Record<string, number>>(
    (acc, l) => ({ ...acc, [l.sightingId]: Number(l.count) }), {}
  )

  const hasMore = feed.length === PAGE_SIZE
  const nextCursor = hasMore ? feed[feed.length - 1].sightedAt.toISOString() : null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Explore</h1>
        <p className="text-sm text-gray-500 mt-1">Recent public sightings from everyone</p>
      </div>

      {feed.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🌍</p>
          <p className="text-lg font-medium text-gray-600">No public sightings yet</p>
          <p className="text-sm mt-1"><Link href="/log" className="text-green-700 hover:underline">Log one</Link> to get things started.</p>
        </div>
      ) : (
        <ExploreLoadMore
          initialItems={feed}
          initialPhotosBySighting={photosBySighting}
          initialLikesBySighting={likesBySighting}
          initialNextCursor={nextCursor}
          currentUserId={session?.user?.id ?? null}
        />
      )}
    </div>
  )
}
