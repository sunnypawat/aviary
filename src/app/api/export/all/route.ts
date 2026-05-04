import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sightings, sightingPhotos, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { desc } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const [user] = await db
    .select({ username: users.username, name: users.name, bio: users.bio, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, session.user.id))

  const allSightings = await db
    .select()
    .from(sightings)
    .where(eq(sightings.userId, session.user.id))
    .orderBy(desc(sightings.sightedAt))

  const allPhotos = await db
    .select()
    .from(sightingPhotos)
    .where(
      eq(
        sightingPhotos.sightingId,
        // subquery-style: only photos belonging to user's sightings
        // We'll filter in JS since sightingPhotos has no userId column
        sightingPhotos.sightingId
      )
    )

  const sightingIds = new Set(allSightings.map((s) => s.id))
  const userPhotos = allPhotos.filter((p) => sightingIds.has(p.sightingId))

  const photosBySighting = userPhotos.reduce<Record<string, typeof userPhotos>>((acc, p) => {
    acc[p.sightingId] = [...(acc[p.sightingId] ?? []), p]
    return acc
  }, {})

  const payload = {
    exportedAt: new Date().toISOString(),
    appVersion: "aviary-1.0",
    user: {
      username: user?.username,
      name: user?.name,
      bio: user?.bio,
      memberSince: user?.createdAt,
    },
    sightings: allSightings.map((s) => ({
      id: s.id,
      speciesName: s.speciesName,
      commonName: s.commonName,
      rating: s.rating,
      notes: s.notes,
      locationName: s.locationName,
      // Exact coords only in private export — they are yours
      lat: s.latExact,
      lng: s.lngExact,
      visibility: s.visibility,
      sightedAt: s.sightedAt,
      createdAt: s.createdAt,
      photos: (photosBySighting[s.id] ?? [])
        .sort((a, b) => a.position - b.position)
        .map((p) => ({ url: p.url, position: p.position })),
    })),
    _note: "This file contains all your Aviary data. It is yours — import it into any compatible app or keep it as a personal archive.",
  }

  const date = new Date().toISOString().split("T")[0]
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="aviary-export-${date}.json"`,
    },
  })
}
