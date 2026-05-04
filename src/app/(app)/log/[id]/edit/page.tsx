import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sightings } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { EditSightingForm } from "./edit-form"

export default async function EditSightingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { id } = await params
  const [sighting] = await db
    .select()
    .from(sightings)
    .where(and(eq(sightings.id, id), eq(sightings.userId, session.user.id)))

  if (!sighting) notFound()

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Sighting</h1>
      <EditSightingForm sighting={sighting} />
    </div>
  )
}
