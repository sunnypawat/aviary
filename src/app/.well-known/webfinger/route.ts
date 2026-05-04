import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { apUrls } from "@/lib/ap/urls"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const resource = searchParams.get("resource")

  // Expect: acct:username@domain
  if (!resource?.startsWith("acct:")) {
    return new Response("Bad Request", { status: 400 })
  }

  const [handle] = resource.slice(5).split("@")
  const username = handle.toLowerCase()

  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.username, username))

  if (!user) return new Response("Not Found", { status: 404 })

  const body = JSON.stringify({
    subject: resource,
    aliases: [apUrls.actor(username)],
    links: [
      {
        rel: "self",
        type: "application/activity+json",
        href: apUrls.actor(username),
      },
    ],
  })

  return new Response(body, {
    headers: { "Content-Type": "application/jrd+json" },
  })
}
