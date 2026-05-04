"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sightings, actors, followers, users, sightingPhotos } from "@/lib/db/schema"
import { fuzzyCoords } from "@/lib/fuzzy"
import { and, eq } from "drizzle-orm"
import { serializeNote, serializeCreate } from "@/lib/ap/serializers"
import { deliverActivity } from "@/lib/ap/deliver"
import { apUrls } from "@/lib/ap/urls"

export async function logSighting(_prev: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated.", success: false }

  const speciesName = (formData.get("speciesName") as string)?.trim()
  const commonName = (formData.get("commonName") as string)?.trim() || null
  const ratingRaw = parseInt(formData.get("rating") as string, 10)
  const notes = (formData.get("notes") as string)?.trim() || null
  const locationName = (formData.get("locationName") as string)?.trim() || null
  const latRaw = parseFloat(formData.get("lat") as string)
  const lngRaw = parseFloat(formData.get("lng") as string)
  const visibility = (formData.get("visibility") as string) || "public"
  const sightedAtRaw = formData.get("sightedAt") as string
  const photoUrls = formData.getAll("photoUrls").map(String).filter(Boolean)

  if (!speciesName) return { error: "Species name is required.", success: false }
  if (isNaN(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
    return { error: "Rating must be between 1 and 5.", success: false }
  }

  const hasCoords = !isNaN(latRaw) && !isNaN(lngRaw)
  const fuzzy = hasCoords ? fuzzyCoords(latRaw, lngRaw) : null

  const [sighting] = await db
    .insert(sightings)
    .values({
      userId: session.user.id,
      speciesName,
      commonName,
      rating: ratingRaw,
      notes,
      locationName,
      latExact: hasCoords ? latRaw : null,
      lngExact: hasCoords ? lngRaw : null,
      latFuzzy: fuzzy?.latFuzzy ?? null,
      lngFuzzy: fuzzy?.lngFuzzy ?? null,
      visibility,
      sightedAt: sightedAtRaw ? new Date(sightedAtRaw) : new Date(),
    })
    .returning()

  if (photoUrls.length > 0) {
    await db.insert(sightingPhotos).values(
      photoUrls.map((url, i) => ({ sightingId: sighting.id, url, position: i }))
    )
  }

  revalidatePath("/feed")

  // Fan out to Fediverse followers for public sightings (fire-and-forget)
  if (visibility === "public") {
    fanoutToFollowers(session.user.id, [sighting], photoUrls.map((url) => ({ url }))).catch(console.error)
  }

  return { success: true, error: "" }
}

async function fanoutToFollowers(userId: string, newSightings: typeof sightings.$inferSelect[], photos: { url: string }[] = []) {
  const [actor] = await db
    .select({ id: actors.id, privateKey: actors.privateKey, username: users.username })
    .from(actors)
    .innerJoin(users, eq(actors.userId, users.id))
    .where(eq(actors.userId, userId))

  if (!actor) return

  const actorFollowers = await db
    .select({ followerInboxUrl: followers.followerInboxUrl })
    .from(followers)
    .where(eq(followers.actorId, actor.id))

  if (actorFollowers.length === 0) return

  const keyId = apUrls.publicKey(actor.username!)

  await Promise.all(
    newSightings.map((s) => {
      const note = serializeNote(s, actor.username!, photos)
      const activity = serializeCreate(note, actor.username!)
      return Promise.all(
        actorFollowers.map((f) =>
          deliverActivity(activity, f.followerInboxUrl, actor.privateKey, keyId)
        )
      )
    })
  )
}

export async function updateSighting(_prev: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated.", success: false }

  const sightingId = formData.get("sightingId") as string
  if (!sightingId) return { error: "Missing sighting ID.", success: false }

  const speciesName = (formData.get("speciesName") as string)?.trim()
  const commonName = (formData.get("commonName") as string)?.trim() || null
  const ratingRaw = parseInt(formData.get("rating") as string, 10)
  const notes = (formData.get("notes") as string)?.trim() || null
  const locationName = (formData.get("locationName") as string)?.trim() || null
  const latRaw = parseFloat(formData.get("lat") as string)
  const lngRaw = parseFloat(formData.get("lng") as string)
  const visibility = (formData.get("visibility") as string) || "public"
  const sightedAtRaw = formData.get("sightedAt") as string

  if (!speciesName) return { error: "Species name is required.", success: false }
  if (isNaN(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
    return { error: "Rating must be between 1 and 5.", success: false }
  }

  const hasCoords = !isNaN(latRaw) && !isNaN(lngRaw)
  const fuzzy = hasCoords ? fuzzyCoords(latRaw, lngRaw) : null

  const [updated] = await db
    .update(sightings)
    .set({
      speciesName,
      commonName,
      rating: ratingRaw,
      notes,
      locationName,
      latExact: hasCoords ? latRaw : null,
      lngExact: hasCoords ? lngRaw : null,
      latFuzzy: fuzzy?.latFuzzy ?? null,
      lngFuzzy: fuzzy?.lngFuzzy ?? null,
      visibility,
      sightedAt: sightedAtRaw ? new Date(sightedAtRaw) : undefined,
    })
    .where(and(eq(sightings.id, sightingId), eq(sightings.userId, session.user.id)))
    .returning()

  if (!updated) return { error: "Sighting not found.", success: false }

  revalidatePath("/feed")
  revalidatePath("/lifelist")

  return { success: true, error: "" }
}

export async function deleteSighting(sightingId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated." }

  const [deleted] = await db
    .delete(sightings)
    .where(and(eq(sightings.id, sightingId), eq(sightings.userId, session.user.id)))
    .returning({ visibility: sightings.visibility })

  revalidatePath("/feed")
  revalidatePath("/lifelist")

  if (deleted?.visibility === "public") {
    fanoutDelete(session.user.id, sightingId).catch(console.error)
  }

  return { success: true }
}

async function fanoutDelete(userId: string, sightingId: string) {
  const [actor] = await db
    .select({ id: actors.id, privateKey: actors.privateKey, username: users.username })
    .from(actors)
    .innerJoin(users, eq(actors.userId, users.id))
    .where(eq(actors.userId, userId))

  if (!actor) return

  const actorFollowers = await db
    .select({ followerInboxUrl: followers.followerInboxUrl })
    .from(followers)
    .where(eq(followers.actorId, actor.id))

  if (actorFollowers.length === 0) return

  const deleteActivity = {
    "@context": "https://www.w3.org/ns/activitystreams",
    type: "Delete",
    id: apUrls.activity(crypto.randomUUID()),
    actor: apUrls.actor(actor.username!),
    object: apUrls.sighting(sightingId),
    to: ["https://www.w3.org/ns/activitystreams#Public"],
  }

  const keyId = apUrls.publicKey(actor.username!)
  await Promise.all(
    actorFollowers.map((f) =>
      deliverActivity(deleteActivity, f.followerInboxUrl, actor.privateKey, keyId)
    )
  )
}
