import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

// Singleton pool to survive Next.js hot-reload in dev
const globalForPg = globalThis as unknown as { pgPool?: Pool }

const pool =
  globalForPg.pgPool ??
  new Pool({ connectionString: process.env.DATABASE_URL })

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool

export const db = drizzle(pool, { schema })
