"use server"

import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function markNotificationsRead(userId: string) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, userId))
}
