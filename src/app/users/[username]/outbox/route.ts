import { db } from "@/lib/db"
import { users, sightings, sightingPhotos } from "@/lib/db/schema"
import { and, desc, eq, inArray } from "drizzle-orm"
import { apUrls } from "@/lib/ap/urls"
import { serializeNote, serializeCreate } from "@/lib/ap/serializers"

export async function GET(
  req: Request,
  ctx: RouteContext<"/users/[username]/outbox">
) {
  const { username } = await ctx.params
  const { searchParams } = new URL(req.url)
  const page = searchParams.get("page") === "true"

  const [user] = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))

  if (!user) return new Response("Not Found", { status: 404 })

  const outboxUrl = apUrls.outbox(user.username!)

  // Collection root — Mastodon fetches this first, then follows `first`
  if (!page) {
    const [{ count }] = await db
      .select({ count: db.$count(sightings) })
      .from(sightings)
      .where(and(eq(sightings.userId, user.id), eq(sightings.visibility, "public")))

    const body = JSON.stringify({
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "OrderedCollection",
      id: outboxUrl,
      totalItems: Number(count),
      first: `${outboxUrl}?page=true`,
    })

    return new Response(body, {
      headers: { "Content-Type": "application/activity+json" },
    })
  }

  // Collection page — the actual items
  const publicSightings = await db
    .select()
    .from(sightings)
    .where(and(eq(sightings.userId, user.id), eq(sightings.visibility, "public")))
    .orderBy(desc(sightings.sightedAt))
    .limit(20)

  const sightingIds = publicSightings.map((s) => s.id)
  const photos = sightingIds.length > 0
    ? await db.select().from(sightingPhotos).where(inArray(sightingPhotos.sightingId, sightingIds))
    : []
  const photosBySighting = photos.reduce<Record<string, typeof photos>>(
    (acc, p) => ({ ...acc, [p.sightingId]: [...(acc[p.sightingId] ?? []), p] }),
    {}
  )

  const items = publicSightings.map((s) =>
    serializeCreate(serializeNote(s, user.username!, photosBySighting[s.id] ?? []), user.username!)
  )

  const body = JSON.stringify({
    "@context": "https://www.w3.org/ns/activitystreams",
    type: "OrderedCollectionPage",
    id: `${outboxUrl}?page=true`,
    partOf: outboxUrl,
    orderedItems: items,
  })

  return new Response(body, {
    headers: { "Content-Type": "application/activity+json" },
  })
}
