"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function updateProfile(_prev: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated.", success: false }

  const name = (formData.get("name") as string)?.trim() || null
  const bio = (formData.get("bio") as string)?.trim() || null

  await db
    .update(users)
    .set({ name, bio })
    .where(eq(users.id, session.user.id))

  revalidatePath(`/profile/${session.user.username}`)
  revalidatePath("/feed")

  return { success: true, error: "" }
}

export async function deleteAccount() {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated." }

  await db.delete(users).where(eq(users.id, session.user.id))
  return { success: true }
}
