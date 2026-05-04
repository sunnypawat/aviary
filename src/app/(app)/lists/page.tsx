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
        <h1 className="text-2xl font-bold text-gray-900">My Lists</h1>
      </div>

      <div className="grid gap-4 mb-8">
        {userLists.length === 0 ? (
          <p className="text-gray-400 text-sm">No lists yet. Create one below.</p>
        ) : (
          userLists.map((list) => (
            <Link
              key={list.id}
              href={`/lists/${list.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-green-300 transition-colors block"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{list.name}</h2>
                  {list.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{list.description}</p>
                  )}
                </div>
                <span className="text-sm text-gray-400 shrink-0 ml-4">
                  {list.itemCount} {list.itemCount === 1 ? "bird" : "birds"}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Create a new list</h2>
        <CreateListForm />
      </div>
    </div>
  )
}
