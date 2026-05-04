"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { lists, listItems } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

export async function createList(_prev: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated.", success: false, listId: "" }

  const name = (formData.get("name") as string)?.trim()
  const description = (formData.get("description") as string)?.trim() || null

  if (!name) return { error: "List name is required.", success: false, listId: "" }

  const [list] = await db
    .insert(lists)
    .values({ userId: session.user.id, name, description })
    .returning({ id: lists.id })

  revalidatePath("/lists")
  return { success: true, listId: list.id, error: "" }
}

export async function addToList(listId: string, sightingId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated." }

  // Verify the list belongs to this user
  const [list] = await db
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, session.user.id)))

  if (!list) return { error: "List not found." }

  // Get current max position
  const existing = await db
    .select({ position: listItems.position })
    .from(listItems)
    .where(eq(listItems.listId, listId))

  const maxPos = existing.reduce(
    (max, item) => Math.max(max, item.position ?? 0),
    0
  )

  await db
    .insert(listItems)
    .values({ listId, sightingId, position: maxPos + 1 })
    .onConflictDoNothing()

  revalidatePath(`/lists/${listId}`)
  revalidatePath("/feed")
  return { success: true }
}

export async function removeFromList(listItemId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated." }

  const [item] = await db
    .select({ listId: listItems.listId, lists: { userId: lists.userId } })
    .from(listItems)
    .innerJoin(lists, eq(listItems.listId, lists.id))
    .where(and(eq(listItems.id, listItemId), eq(lists.userId, session.user.id)))

  if (!item) return { error: "Item not found." }

  await db.delete(listItems).where(eq(listItems.id, listItemId))

  revalidatePath(`/lists/${item.listId}`)
  return { success: true }
}
