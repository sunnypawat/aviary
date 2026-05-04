"use server"

import { hash } from "@node-rs/argon2"
import { eq } from "drizzle-orm"
import { AuthError } from "next-auth"
import { signIn } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { createActor } from "@/lib/actor"

export async function signup(_prev: unknown, formData: FormData) {
  const name = (formData.get("name") as string)?.trim()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string
  const username = (formData.get("username") as string)
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")

  if (!name || !email || !password || !username) {
    return { error: "All fields are required." }
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." }
  }
  if (username.length < 3) {
    return { error: "Username must be at least 3 characters." }
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))

  if (existing) return { error: "An account with this email already exists." }

  const [existingUsername] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))

  if (existingUsername) return { error: "Username is already taken." }

  const passwordHash = await hash(password)

  const [user] = await db
    .insert(users)
    .values({ name, email, username, passwordHash })
    .returning({ id: users.id })

  // Silently create the ActivityPub Actor — user never sees this happen
  await createActor(user.id, username)

  await signIn("credentials", { email, password, redirectTo: "/feed" })
}

export async function login(_prev: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string

  try {
    await signIn("credentials", { email, password, redirectTo: "/feed" })
  } catch (e) {
    // AuthError = wrong credentials. Anything else (e.g. NEXT_REDIRECT) must be re-thrown.
    if (e instanceof AuthError) return { error: "Invalid email or password." }
    throw e
  }
}
