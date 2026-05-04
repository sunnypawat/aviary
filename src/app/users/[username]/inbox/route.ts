import { db } from "@/lib/db"
import { users, actors, followers, likes, sightings, notifications } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { apUrls } from "@/lib/ap/urls"
import { serializeAccept } from "@/lib/ap/serializers"
import { deliverActivity, fetchRemoteActor } from "@/lib/ap/deliver"
import { verifySignature } from "@/lib/ap/sign"

export async function POST(
  request: Request,
  ctx: RouteContext<"/users/[username]/inbox">
) {
  const { username } = await ctx.params

  const [localActor] = await db
    .select({ id: actors.id, userId: users.id, privateKey: actors.privateKey, publicKey: actors.publicKey })
    .from(actors)
    .innerJoin(users, eq(actors.userId, users.id))
    .where(eq(users.username, username.toLowerCase()))

  if (!localActor) return new Response("Not Found", { status: 404 })

  let activity: Record<string, unknown>
  try {
    activity = await request.json()
  } catch {
    return new Response("Bad Request", { status: 400 })
  }

  // Verify HTTP Signature
  const headerEntries = Object.fromEntries(request.headers.entries())
  const senderActorUrl =
    typeof activity.actor === "string" ? activity.actor : null

  if (senderActorUrl) {
    const remoteActor = await fetchRemoteActor(senderActorUrl)
    const pubKeyPem =
      (remoteActor?.publicKey as Record<string, string> | undefined)
        ?.publicKeyPem ?? null

    if (pubKeyPem) {
      const valid = verifySignature(
        "POST",
        `${process.env.NEXT_PUBLIC_APP_URL}/users/${username}/inbox`,
        headerEntries,
        pubKeyPem
      )
      if (!valid) {
        console.warn("[AP] Invalid signature from", senderActorUrl)
        // Allow through in dev — in prod set this to return 401
      }
    }
  }

  const type = activity.type as string

  // ── Follow ────────────────────────────────────────────────────────────────
  if (type === "Follow") {
    const followerUrl = activity.actor as string
    const remoteActor = await fetchRemoteActor(followerUrl)
    if (!remoteActor) return new Response("Could not fetch actor", { status: 422 })

    const inboxUrl =
      (remoteActor.inbox as string) ??
      (remoteActor.endpoints as Record<string, string> | undefined)?.sharedInbox

    if (!inboxUrl) return new Response("No inbox found", { status: 422 })

    // Upsert follower
    await db
      .insert(followers)
      .values({
        actorId: localActor.id,
        followerActorUrl: followerUrl,
        followerInboxUrl: inboxUrl,
      })
      .onConflictDoNothing()

    // Notify the local user
    await db.insert(notifications).values({
      userId: localActor.userId,
      type: "follow",
      fromActorUrl: followerUrl,
      fromName: (remoteActor.name as string) ?? (remoteActor.preferredUsername as string) ?? followerUrl,
    }).onConflictDoNothing()

    // Send Accept
    const accept = serializeAccept(activity, username)
    await deliverActivity(
      accept,
      inboxUrl,
      localActor.privateKey,
      apUrls.publicKey(username)
    )

    return new Response(null, { status: 202 })
  }

  // ── Undo Follow ───────────────────────────────────────────────────────────
  if (type === "Undo") {
    const inner = activity.object as Record<string, unknown> | undefined
    if (inner?.type === "Follow") {
      const followerUrl = activity.actor as string
      await db
        .delete(followers)
        .where(
          and(
            eq(followers.actorId, localActor.id),
            eq(followers.followerActorUrl, followerUrl)
          )
        )
      return new Response(null, { status: 202 })
    }
  }

  // ── Like ──────────────────────────────────────────────────────────────────
  if (type === "Like") {
    const objectUrl = activity.object as string
    const actorUrl = activity.actor as string

    // objectUrl should match one of our sighting URLs: /sightings/[id]
    const sightingId = objectUrl?.split("/sightings/")[1]
    if (sightingId) {
      const [sighting] = await db
        .select({ id: sightings.id })
        .from(sightings)
        .where(eq(sightings.id, sightingId))

      if (sighting) {
        await db
          .insert(likes)
          .values({ sightingId: sighting.id, actorUrl })
          .onConflictDoNothing()

        const remoteActor = await fetchRemoteActor(actorUrl)
        await db.insert(notifications).values({
          userId: localActor.userId,
          type: "like",
          fromActorUrl: actorUrl,
          fromName: (remoteActor?.name as string) ?? (remoteActor?.preferredUsername as string) ?? actorUrl,
          sightingId: sighting.id,
        }).onConflictDoNothing()
      }
    }
    return new Response(null, { status: 202 })
  }

  // Unknown activity — accept gracefully
  return new Response(null, { status: 202 })
}
