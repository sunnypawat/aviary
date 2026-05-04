import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, sightings, localFollows, sightingPhotos, likes, actors, followers } from "@/lib/db/schema"
import { and, count, desc, eq, inArray } from "drizzle-orm"
import { FollowButton } from "@/components/follow-button"
import { SightingsMap } from "@/components/sightings-map"

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const session = await auth()

  const [profile] = await db
    .select({ id: users.id, name: users.name, username: users.username, bio: users.bio })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))

  if (!profile) notFound()

  const isOwnProfile = session?.user?.id === profile.id

  // Get actor for Fediverse follower count
  const [actor] = await db
    .select({ id: actors.id })
    .from(actors)
    .where(eq(actors.userId, profile.id))

  const [
    localFollowerCount,
    fediverseFollowerCount,
    followingCount,
    isFollowing,
    userSightings,
  ] = await Promise.all([
    db.select({ count: count() }).from(localFollows).where(eq(localFollows.followingId, profile.id)),
    actor
      ? db.select({ count: count() }).from(followers).where(eq(followers.actorId, actor.id))
      : Promise.resolve([{ count: 0 }]),
    db.select({ count: count() }).from(localFollows).where(eq(localFollows.followerId, profile.id)),
    session && !isOwnProfile
      ? db.select({ id: localFollows.id }).from(localFollows).where(
          and(
            eq(localFollows.followerId, session.user.id),
            eq(localFollows.followingId, profile.id)
          )
        )
      : Promise.resolve([]),
    db
      .select()
      .from(sightings)
      .where(
        and(
          eq(sightings.userId, profile.id),
          isOwnProfile ? undefined : eq(sightings.visibility, "public")
        )
      )
      .orderBy(desc(sightings.sightedAt))
      .limit(20),
  ])

  const totalFollowers =
    Number(localFollowerCount[0].count) + Number(fediverseFollowerCount[0].count)

  const sightingIds = userSightings.map((s) => s.id)
  const [photos, likeCounts] =
    sightingIds.length > 0
      ? await Promise.all([
          db.select().from(sightingPhotos).where(inArray(sightingPhotos.sightingId, sightingIds)),
          db
            .select({ sightingId: likes.sightingId, count: count() })
            .from(likes)
            .where(inArray(likes.sightingId, sightingIds))
            .groupBy(likes.sightingId),
        ])
      : [[], []]

  const photosBySighting = photos.reduce<Record<string, typeof photos>>(
    (acc, p) => ({ ...acc, [p.sightingId]: [...(acc[p.sightingId] ?? []), p] }),
    {}
  )
  const likesBySighting = (likeCounts as { sightingId: string; count: number }[]).reduce<Record<string, number>>(
    (acc, l) => ({ ...acc, [l.sightingId]: Number(l.count) }),
    {}
  )

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-lg">
                {(profile.name ?? profile.username ?? "?")[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {profile.name ?? profile.username}
                </h1>
                <p className="text-sm text-gray-500">@{profile.username}</p>
              </div>
            </div>
            {profile.bio && (
              <p className="mt-3 text-sm text-gray-700">{profile.bio}</p>
            )}
            <div className="flex gap-4 mt-3 text-sm text-gray-600">
              <span>
                <strong className="text-gray-900">{totalFollowers}</strong>{" "}
                followers
                {Number(fediverseFollowerCount[0].count) > 0 && (
                  <span className="text-xs text-gray-400 ml-1">
                    (incl. {fediverseFollowerCount[0].count} from Fediverse)
                  </span>
                )}
              </span>
              <span>
                <strong className="text-gray-900">{followingCount[0].count}</strong>{" "}
                following
              </span>
              <span>
                <strong className="text-gray-900">{userSightings.length}</strong>{" "}
                sightings
              </span>
            </div>
          </div>
          {!isOwnProfile && session && (
            <FollowButton
              targetUserId={profile.id}
              isFollowing={isFollowing.length > 0}
            />
          )}
        </div>
      </div>

      {(() => {
        const mapPoints = userSightings
          .filter((s) => s.latFuzzy != null && s.lngFuzzy != null)
          .map((s) => ({
            id: s.id,
            lat: s.latFuzzy!,
            lng: s.lngFuzzy!,
            speciesName: s.speciesName,
            commonName: s.commonName,
          }))
        return mapPoints.length > 0 ? (
          <div className="mb-6">
            <SightingsMap points={mapPoints} />
          </div>
        ) : null
      })()}

      <div className="space-y-4">
        {userSightings.map((s) => {
          const sPhotos = (photosBySighting[s.id] ?? []).sort(
            (a, b) => a.position - b.position
          )
          const likeCount = likesBySighting[s.id] ?? 0
          return (
            <article key={s.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-gray-900">{s.speciesName}</h2>
                  {s.commonName && (
                    <p className="text-sm text-gray-500">{s.commonName}</p>
                  )}
                </div>
                <span className="text-amber-400 shrink-0">
                  {"★".repeat(s.rating)}{"☆".repeat(5 - s.rating)}
                </span>
              </div>
              {sPhotos.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {sPhotos.map((p) => (
                    <img
                      key={p.id}
                      src={p.url}
                      alt={s.speciesName}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-100"
                    />
                  ))}
                </div>
              )}
              {s.notes && (
                <p className="mt-2 text-sm text-gray-700 leading-relaxed">{s.notes}</p>
              )}
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                {s.locationName && <span>📍 {s.locationName}</span>}
                <span>
                  {new Date(s.sightedAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </span>
                {likeCount > 0 && <span>♥ {likeCount}</span>}
                {s.visibility !== "public" && (
                  <span className="bg-gray-100 rounded px-1.5 py-0.5">{s.visibility}</span>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
