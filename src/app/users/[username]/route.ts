import { db } from "@/lib/db"
import { users, actors } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { serializeActor } from "@/lib/ap/serializers"

export async function GET(
  _req: Request,
  ctx: RouteContext<"/users/[username]">
) {
  const { username } = await ctx.params

  const [row] = await db
    .select({
      username: users.username,
      name: users.name,
      publicKey: actors.publicKey,
    })
    .from(users)
    .innerJoin(actors, eq(actors.userId, users.id))
    .where(eq(users.username, username.toLowerCase()))

  if (!row) return new Response("Not Found", { status: 404 })

  return new Response(JSON.stringify(serializeActor(row, row.publicKey)), {
    headers: { "Content-Type": "application/activity+json" },
  })
}
