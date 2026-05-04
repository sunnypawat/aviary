"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { likes, sightings, users, actors, followers } from "@/lib/db/schema"
import { apUrls } from "@/lib/ap/urls"
import { deliverActivity } from "@/lib/ap/deliver"

async function getActorForUser(userId: string) {
  const [actor] = await db
    .select({ privateKey: actors.privateKey, username: users.username })
    .from(actors)
    .innerJoin(users, eq(actors.userId, users.id))
    .where(eq(actors.userId, userId))
  return actor ?? null
}

async function fanoutLike(actingUserId: string, sightingId: string, undo = false) {
  const actor = await getActorForUser(actingUserId)
  if (!actor) return

  // Find the sighting owner's actor
  const [sighting] = await db
    .select({ userId: sightings.userId })
    .from(sightings)
    .where(eq(sightings.id, sightingId))
  if (!sighting) return

  const ownerActor = await getActorForUser(sighting.userId)
  if (!ownerActor) return

  // Deliver to all followers' inboxes (so Mastodon shows the like)
  const actorFollowers = await db
    .select({ followerInboxUrl: followers.followerInboxUrl })
    .from(followers)
    .innerJoin(actors, eq(followers.actorId, actors.id))
    .where(eq(actors.userId, actingUserId))

  const keyId = apUrls.publicKey(actor.username!)
  const actorUrl = apUrls.actor(actor.username!)
  const objectUrl = apUrls.sighting(sightingId)

  const likeActivity = {
    "@context": "https://www.w3.org/ns/activitystreams",
    type: "Like",
    id: apUrls.activity(crypto.randomUUID()),
    actor: actorUrl,
    object: objectUrl,
  }

  const activity = undo
    ? { "@context": "https://www.w3.org/ns/activitystreams", type: "Undo", id: apUrls.activity(crypto.randomUUID()), actor: actorUrl, object: likeActivity }
    : likeActivity

  await Promise.all(
    actorFollowers.map((f) => deliverActivity(activity, f.followerInboxUrl, actor.privateKey, keyId))
  )
}

export async function likeSighting(sightingId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated." }

  const actorUrl = apUrls.actor(session.user.username)

  await db.insert(likes).values({ sightingId, actorUrl }).onConflictDoNothing()

  revalidatePath("/feed")
  revalidatePath("/home")

  fanoutLike(session.user.id, sightingId, false).catch(console.error)

  return { success: true }
}

export async function unlikeSighting(sightingId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated." }

  const actorUrl = apUrls.actor(session.user.username)

  await db.delete(likes).where(and(eq(likes.sightingId, sightingId), eq(likes.actorUrl, actorUrl)))

  revalidatePath("/feed")
  revalidatePath("/home")

  fanoutLike(session.user.id, sightingId, true).catch(console.error)

  return { success: true }
}
