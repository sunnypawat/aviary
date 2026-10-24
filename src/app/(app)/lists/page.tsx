import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { lists, listItems } from "@/lib/db/schema"
import { eq, count } from "drizzle-orm"
import { CreateListForm } from "./create-list-form"

export default async function ListsPage() {
  const session = await auth()

  const userLists = await db
    .select({
      id: lists.id,
      name: lists.name,
      description: lists.description,
      createdAt: lists.createdAt,
      itemCount: count(listItems.id),
    })
    .from(lists)
    .leftJoin(listItems, eq(listItems.listId, lists.id))
    .where(eq(lists.userId, session!.user.id))
    .groupBy(lists.id)
    .orderBy(lists.createdAt)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-black">My Lists</h1>
      </div>

      <div className="grid gap-4 mb-8">
        {userLists.length === 0 ? (
          <p className="text-gray-400 text-sm">No lists yet. Create one below.</p>
        ) : (
          userLists.map((list) => (
            <Link
              key={list.id}
              href={`/lists/${list.id}`}
              className="border border-black p-5 hover:bg-gray-50 transition-colors block"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-black">{list.name}</h2>
                  {list.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{list.description}</p>
                  )}
                </div>
                <span className="text-sm text-gray-500 shrink-0 ml-4">
                  {list.itemCount} {list.itemCount === 1 ? "bird" : "birds"}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="border-2 border-black p-6">
        <h2 className="font-semibold text-black mb-4">Create a new list</h2>
        <CreateListForm />
      </div>
    </div>
  )
}
