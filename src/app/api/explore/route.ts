import { db } from "@/lib/db"
import { sightings, users, sightingPhotos, likes } from "@/lib/db/schema"
import { count, desc, eq, inArray, lt } from "drizzle-orm"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get("cursor")
  const limit = 20

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
    .where(cursor
      ? eq(sightings.visibility, "public")
      : eq(sightings.visibility, "public"))
    .orderBy(desc(sightings.sightedAt))
    .limit(limit + 1)

  // Simple cursor filter — drizzle doesn't support dynamic where easily so re-query with lt
  const filtered = cursor
    ? await db
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
        .where(lt(sightings.sightedAt, new Date(cursor)))
        .orderBy(desc(sightings.sightedAt))
        .limit(limit + 1)
    : feed

  const hasMore = filtered.length > limit
  const items = hasMore ? filtered.slice(0, limit) : filtered
  const nextCursor = hasMore ? items[items.length - 1].sightedAt.toISOString() : null

  const sightingIds = items.map((s) => s.id)
  const [photos, likeCounts] = sightingIds.length === 0 ? [[], []] : await Promise.all([
    db.select().from(sightingPhotos).where(inArray(sightingPhotos.sightingId, sightingIds)),
    db.select({ sightingId: likes.sightingId, count: count() })
      .from(likes).where(inArray(likes.sightingId, sightingIds)).groupBy(likes.sightingId),
  ])

  return Response.json({ items, photos, likeCounts, nextCursor })
}
