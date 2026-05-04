import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { SettingsForm } from "./settings-form"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [user] = await db
    .select({ name: users.name, bio: users.bio, username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id))

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <SettingsForm currentName={user?.name ?? ""} currentBio={user?.bio ?? ""} username={user?.username ?? ""} />
    </div>
  )
}
