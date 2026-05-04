import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sightings } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const lifelist = await db
    .select({
      speciesName: sightings.speciesName,
      commonName: sql<string>`max(${sightings.commonName})`,
      locationName: sql<string>`max(${sightings.locationName})`,
      latFuzzy: sql<number>`min(${sightings.latFuzzy})`,
      lngFuzzy: sql<number>`min(${sightings.lngFuzzy})`,
      firstSeen: sql<Date>`min(${sightings.sightedAt})`,
      count: sql<number>`count(*)`,
    })
    .from(sightings)
    .where(eq(sightings.userId, session.user.id))
    .groupBy(sightings.speciesName)
    .orderBy(sql`min(${sightings.sightedAt})`)

  // eBird Record Format columns
  const headers = [
    "Common Name",
    "Scientific Name",
    "Number",
    "Date",
    "Time",
    "State/Province",
    "Country Code",
    "Protocol",
    "Duration (min)",
    "All Obs Reported",
    "Distance Traveled (km)",
    "Area Covered (ha)",
    "Number of Observers",
    "Checklist Comments",
    "Species Comments",
  ]

  const rows = lifelist.map((b) => {
    const date = new Date(b.firstSeen)
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")
    const yyyy = date.getFullYear()
    return [
      b.commonName ?? "",
      b.speciesName,
      String(b.count),
      `${mm}/${dd}/${yyyy}`,
      "",  // Time
      "",  // State/Province
      "",  // Country Code
      "Casual",
      "",  // Duration
      "N",
      "",  // Distance
      "",  // Area
      "1",
      "",  // Checklist comments
      "",  // Species comments
    ]
      .map((v) => `"${v.replace(/"/g, '""')}"`)
      .join(",")
  })

  const csv = [headers.join(","), ...rows].join("\r\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="aviary-lifelist.csv"`,
    },
  })
}
