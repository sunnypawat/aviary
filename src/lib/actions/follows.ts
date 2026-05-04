"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { localFollows, users } from "@/lib/db/schema"

export async function followUser(targetUserId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated." }
  if (session.user.id === targetUserId) return { error: "Cannot follow yourself." }

  await db
    .insert(localFollows)
    .values({ followerId: session.user.id, followingId: targetUserId })
    .onConflictDoNothing()

  const [target] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, targetUserId))

  revalidatePath(`/profile/${target?.username}`)
  revalidatePath("/home")
  return { success: true }
}

export async function unfollowUser(targetUserId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated." }

  await db
    .delete(localFollows)
    .where(
      and(
        eq(localFollows.followerId, session.user.id),
        eq(localFollows.followingId, targetUserId)
      )
    )

  const [target] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, targetUserId))

  revalidatePath(`/profile/${target?.username}`)
  revalidatePath("/home")
  return { success: true }
}
