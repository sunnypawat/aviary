import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sightings, likes, sightingPhotos } from "@/lib/db/schema"
import { count, desc, eq, inArray, lt, and } from "drizzle-orm"
import { apUrls } from "@/lib/ap/urls"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get("cursor") // ISO date string
  const limit = 20

  const where = cursor
    ? and(eq(sightings.userId, session.user.id), lt(sightings.sightedAt, new Date(cursor)))
    : eq(sightings.userId, session.user.id)

  const feed = await db
    .select({
      id: sightings.id,
      speciesName: sightings.speciesName,
      commonName: sightings.commonName,
      rating: sightings.rating,
      notes: sightings.notes,
      locationName: sightings.locationName,
      visibility: sightings.visibility,
      sightedAt: sightings.sightedAt,
    })
    .from(sightings)
    .where(where)
    .orderBy(desc(sightings.sightedAt))
    .limit(limit + 1)

  const hasMore = feed.length > limit
  const items = hasMore ? feed.slice(0, limit) : feed
  const nextCursor = hasMore ? items[items.length - 1].sightedAt.toISOString() : null

  const sightingIds = items.map((s) => s.id)
  const myActorUrl = apUrls.actor(session.user.username)

  const [photos, likeCounts, myLikes] =
    sightingIds.length === 0
      ? [[], [], []]
      : await Promise.all([
          db.select().from(sightingPhotos).where(inArray(sightingPhotos.sightingId, sightingIds)),
          db
            .select({ sightingId: likes.sightingId, count: count() })
            .from(likes)
            .where(inArray(likes.sightingId, sightingIds))
            .groupBy(likes.sightingId),
          db
            .select({ sightingId: likes.sightingId })
            .from(likes)
            .where(and(inArray(likes.sightingId, sightingIds), eq(likes.actorUrl, myActorUrl))),
        ])

  return Response.json({ items, photos, likeCounts, myLikes, nextCursor })
}
