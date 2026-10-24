import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { lists, listItems, sightings } from "@/lib/db/schema"
import { and, asc, eq } from "drizzle-orm"
import { RemoveFromListButton } from "./remove-button"

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const [list] = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, id), eq(lists.userId, session!.user.id)))

  if (!list) notFound()

  const items = await db
    .select({
      id: listItems.id,
      position: listItems.position,
      speciesName: sightings.speciesName,
      commonName: sightings.commonName,
      rating: sightings.rating,
      notes: sightings.notes,
      sightedAt: sightings.sightedAt,
    })
    .from(listItems)
    .innerJoin(sightings, eq(listItems.sightingId, sightings.id))
    .where(eq(listItems.listId, id))
    .orderBy(asc(listItems.position))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">{list.name}</h1>
        {list.description && (
          <p className="text-gray-500 text-sm mt-1">{list.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-2">{items.length} sightings</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">This list is empty.</p>
          <p className="text-xs mt-1">
            Use the ··· menu on any sighting in your{" "}
            <a href="/feed" className="text-black hover:underline">feed</a>{" "}
            to add it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="border border-black p-5 flex gap-4"
            >
              <span className="text-gray-400 font-mono text-sm w-6 shrink-0 pt-0.5">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-black text-sm">
                      {item.speciesName}
                    </h2>
                    {item.commonName && (
                      <p className="text-xs text-gray-500">{item.commonName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-amber-400 text-sm">
                      {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
                    </span>
                    <RemoveFromListButton listItemId={item.id} />
                  </div>
                </div>
                {item.notes && (
                  <p className="mt-1.5 text-xs text-gray-600 line-clamp-2">
                    {item.notes}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(item.sightedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
