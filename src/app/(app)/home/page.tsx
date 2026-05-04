import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sightings, users, localFollows, sightingPhotos, likes } from "@/lib/db/schema"
import { and, count, desc, eq, inArray } from "drizzle-orm"
import type { SightingPhoto } from "@/lib/db/schema"
import { apUrls } from "@/lib/ap/urls"
import { HomeLoadMore } from "./load-more"

const PAGE_SIZE = 20

export default async function HomePage() {
  const session = await auth()

  const following = await db
    .select({ followingId: localFollows.followingId })
    .from(localFollows)
    .where(eq(localFollows.followerId, session!.user.id))

  const followingIds = following.map((f) => f.followingId)

  const feed = followingIds.length === 0 ? [] : await db
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
    .where(and(inArray(sightings.userId, followingIds), eq(sightings.visibility, "public")))
    .orderBy(desc(sightings.sightedAt))
    .limit(PAGE_SIZE)

  const sightingIds = feed.map((s) => s.id)
  const myActorUrl = apUrls.actor(session!.user.username)
  const [photos, likeCounts, myLikes] = sightingIds.length === 0 ? [[], [], []] : await Promise.all([
    db.select().from(sightingPhotos).where(inArray(sightingPhotos.sightingId, sightingIds)),
    db.select({ sightingId: likes.sightingId, count: count() })
      .from(likes).where(inArray(likes.sightingId, sightingIds)).groupBy(likes.sightingId),
    db.select({ sightingId: likes.sightingId })
      .from(likes).where(and(inArray(likes.sightingId, sightingIds), eq(likes.actorUrl, myActorUrl))),
  ])

  const photosBySighting = (photos as SightingPhoto[]).reduce<Record<string, SightingPhoto[]>>(
    (acc, p) => ({ ...acc, [p.sightingId]: [...(acc[p.sightingId] ?? []), p] }), {}
  )
  const likesBySighting = (likeCounts as { sightingId: string; count: number }[]).reduce<Record<string, number>>(
    (acc, l) => ({ ...acc, [l.sightingId]: Number(l.count) }), {}
  )
  const likedByMe = new Set((myLikes as { sightingId: string }[]).map((l) => l.sightingId))

  const hasMore = feed.length === PAGE_SIZE
  const nextCursor = hasMore ? feed[feed.length - 1].sightedAt.toISOString() : null

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Home</h1>
      {followingIds.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🌿</p>
          <p className="text-lg font-medium text-gray-600">Your feed is empty</p>
          <p className="text-sm mt-1">Find birders to follow via <Link href="/search" className="text-green-700 hover:underline">search</Link>.</p>
        </div>
      ) : feed.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🌿</p>
          <p className="text-lg font-medium text-gray-600">Nothing to show yet</p>
          <p className="text-sm mt-1">The people you follow haven't posted any public sightings.</p>
        </div>
      ) : (
        <HomeLoadMore
          initialItems={feed}
          initialPhotosBySighting={photosBySighting}
          initialLikesBySighting={likesBySighting}
          initialLikedByMe={Array.from(likedByMe)}
          initialNextCursor={nextCursor}
        />
      )}
    </div>
  )
}
