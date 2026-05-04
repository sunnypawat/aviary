import { db } from "@/lib/db"
import { users, actors, followers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { apUrls } from "@/lib/ap/urls"

export async function GET(
  _req: Request,
  ctx: RouteContext<"/users/[username]/followers">
) {
  const { username } = await ctx.params

  const [actor] = await db
    .select({ id: actors.id })
    .from(actors)
    .innerJoin(users, eq(actors.userId, users.id))
    .where(eq(users.username, username.toLowerCase()))

  if (!actor) return new Response("Not Found", { status: 404 })

  const followerList = await db
    .select({ followerActorUrl: followers.followerActorUrl })
    .from(followers)
    .where(eq(followers.actorId, actor.id))

  const body = JSON.stringify({
    "@context": "https://www.w3.org/ns/activitystreams",
    type: "OrderedCollection",
    id: apUrls.followers(username),
    totalItems: followerList.length,
    orderedItems: followerList.map((f) => f.followerActorUrl),
  })

  return new Response(body, {
    headers: { "Content-Type": "application/activity+json" },
  })
}
