// Used to sync offline drafts from IndexedDB when connectivity is restored
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sightings } from "@/lib/db/schema"
import { fuzzyCoords } from "@/lib/fuzzy"
import { revalidatePath } from "next/cache"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const formData = await req.formData()

  const speciesName = (formData.get("speciesName") as string)?.trim()
  const commonName = (formData.get("commonName") as string)?.trim() || null
  const ratingRaw = parseInt(formData.get("rating") as string, 10)
  const notes = (formData.get("notes") as string)?.trim() || null
  const locationName = (formData.get("locationName") as string)?.trim() || null
  const latRaw = parseFloat(formData.get("lat") as string)
  const lngRaw = parseFloat(formData.get("lng") as string)
  const visibility = (formData.get("visibility") as string) || "public"
  const sightedAtRaw = formData.get("sightedAt") as string

  if (!speciesName)
    return Response.json({ error: "Species name required" }, { status: 400 })
  if (isNaN(ratingRaw) || ratingRaw < 1 || ratingRaw > 5)
    return Response.json({ error: "Invalid rating" }, { status: 400 })

  const hasCoords = !isNaN(latRaw) && !isNaN(lngRaw)
  const fuzzy = hasCoords ? fuzzyCoords(latRaw, lngRaw) : null

  await db.insert(sightings).values({
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

  revalidatePath("/feed")
  return Response.json({ success: true })
}
