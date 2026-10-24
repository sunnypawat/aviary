import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { markNotificationsRead } from "./actions"

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50)

  // Mark all as read (fire-and-forget)
  markNotificationsRead(session.user.id).catch(console.error)

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-black mb-6">Notifications</h1>

      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-black font-medium">No notifications yet</p>
          <p className="text-sm mt-1">You'll see likes and follows from the Fediverse here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 border p-4 ${
                n.read ? "border-black" : "border-black border-l-4"
              }`}
            >
              <span className="text-xl mt-0.5">{n.type === "like" ? "♥" : "👤"}</span>
              <div className="min-w-0">
                <p className="text-sm text-black">
                  <strong className="font-medium">{n.fromName ?? n.fromActorUrl}</strong>{" "}
                  {n.type === "like" ? "liked one of your sightings" : "followed you"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(n.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
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
