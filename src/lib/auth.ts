import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { eq } from "drizzle-orm"
import { verify } from "@node-rs/argon2"
import { db } from "./db"
import { users, accounts, sessions, verificationTokens } from "./db/schema"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))

        if (!user?.passwordHash) return null

        const valid = await verify(
          user.passwordHash,
          credentials.password as string
        )
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name, username: user.username }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as { username?: string }).username
      }
      // Refresh username from DB in case it changed
      if (token.id && !token.username) {
        const [row] = await db
          .select({ username: users.username })
          .from(users)
          .where(eq(users.id, token.id as string))
        token.username = row?.username
      }
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      if (token.username) session.user.username = token.username as string
      return session
    },
  },
})
