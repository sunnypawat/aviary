import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sightings, users, lists, likes, sightingPhotos } from "@/lib/db/schema"
import { count, desc, eq, inArray, and } from "drizzle-orm"
import { SightingActions } from "@/components/sighting-actions"
import { LikeButton } from "@/components/like-button"
import { apUrls } from "@/lib/ap/urls"
import type { SightingPhoto } from "@/lib/db/schema"
import { FeedLoadMore } from "./load-more"

const PAGE_SIZE = 20

export default async function FeedPage() {
  const session = await auth()

  const [feed, userLists] = await Promise.all([
    db
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
      .innerJoin(users, eq(sightings.userId, users.id))
      .where(eq(sightings.userId, session!.user.id))
      .orderBy(desc(sightings.sightedAt))
      .limit(PAGE_SIZE),
    db
      .select({ id: lists.id, name: lists.name })
      .from(lists)
      .where(eq(lists.userId, session!.user.id)),
  ])

  const sightingIds = feed.map((s) => s.id)
  const myActorUrl = apUrls.actor(session!.user.username)

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

  const photosBySighting = (photos as SightingPhoto[]).reduce<Record<string, SightingPhoto[]>>(
    (acc, p) => ({ ...acc, [p.sightingId]: [...(acc[p.sightingId] ?? []), p] }),
    {}
  )
  const likesBySighting = (likeCounts as { sightingId: string; count: number }[]).reduce<Record<string, number>>(
    (acc, l) => ({ ...acc, [l.sightingId]: Number(l.count) }),
    {}
  )
  const likedByMe = new Set((myLikes as { sightingId: string }[]).map((l) => l.sightingId))

  const hasMore = feed.length === PAGE_SIZE
  const nextCursor = hasMore ? feed[feed.length - 1].sightedAt.toISOString() : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-black">My Sightings</h1>
        <Link
          href="/log"
          className="border-2 border-black bg-black hover:bg-[#1a3a2a] hover:border-[#1a3a2a] text-white text-sm font-medium px-4 py-2 transition-colors"
        >
          + Log Sighting
        </Link>
      </div>

      {feed.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🔭</p>
          <p className="text-lg font-medium text-gray-600">No sightings yet</p>
          <p className="text-sm mt-1">
            Head outside and{" "}
            <Link href="/log" className="text-black hover:underline border-b border-black">
              log your first bird
            </Link>
            .
          </p>
        </div>
      ) : (
        <FeedLoadMore
          initialItems={feed}
          initialPhotosBySighting={photosBySighting}
          initialLikesBySighting={likesBySighting}
          initialLikedByMe={Array.from(likedByMe)}
          initialNextCursor={nextCursor}
          lists={userLists}
        />
      )}
    </div>
  )
}
