import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sightings, users, localFollows, sightingPhotos, likes } from "@/lib/db/schema"
import { and, count, desc, eq, inArray, lt } from "drizzle-orm"
import { apUrls } from "@/lib/ap/urls"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get("cursor")
  const limit = 20

  const following = await db
    .select({ followingId: localFollows.followingId })
    .from(localFollows)
    .where(eq(localFollows.followerId, session.user.id))

  const followingIds = following.map((f) => f.followingId)
  if (followingIds.length === 0) return Response.json({ items: [], photos: [], likeCounts: [], nextCursor: null })

  const where = and(
    inArray(sightings.userId, followingIds),
    eq(sightings.visibility, "public"),
    cursor ? lt(sightings.sightedAt, new Date(cursor)) : undefined
  )

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
    .where(where)
    .orderBy(desc(sightings.sightedAt))
    .limit(limit + 1)

  const hasMore = feed.length > limit
  const items = hasMore ? feed.slice(0, limit) : feed
  const nextCursor = hasMore ? items[items.length - 1].sightedAt.toISOString() : null

  const sightingIds = items.map((s) => s.id)
  const myActorUrl = apUrls.actor(session.user.username)
  const [photos, likeCounts, myLikes] = sightingIds.length === 0 ? [[], [], []] : await Promise.all([
    db.select().from(sightingPhotos).where(inArray(sightingPhotos.sightingId, sightingIds)),
    db.select({ sightingId: likes.sightingId, count: count() })
      .from(likes).where(inArray(likes.sightingId, sightingIds)).groupBy(likes.sightingId),
    db.select({ sightingId: likes.sightingId })
      .from(likes).where(and(inArray(likes.sightingId, sightingIds), eq(likes.actorUrl, myActorUrl))),
  ])

  return Response.json({ items, photos, likeCounts, myLikes, nextCursor })
}
