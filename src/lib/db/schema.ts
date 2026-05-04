import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"

// ── NextAuth required tables ──────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  username: text("username").unique(),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
)

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
)

// ── Aviary tables ─────────────────────────────────────────────────────────────

export const actors = pgTable("actors", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  username: text("username").notNull().unique(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const sightings = pgTable("sightings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  speciesName: text("species_name").notNull(),
  commonName: text("common_name"),
  rating: integer("rating").notNull(),
  notes: text("notes"),
  // Private: exact coords, never leaves the DB
  latExact: real("lat_exact"),
  lngExact: real("lng_exact"),
  // Public: fuzzy coords, safe to share (~10km grid)
  latFuzzy: real("lat_fuzzy"),
  lngFuzzy: real("lng_fuzzy"),
  locationName: text("location_name"),
  visibility: text("visibility").notNull().default("public"),
  sightedAt: timestamp("sighted_at", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const lists = pgTable("lists", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const listItems = pgTable("list_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  listId: text("list_id")
    .notNull()
    .references(() => lists.id, { onDelete: "cascade" }),
  sightingId: text("sighting_id")
    .notNull()
    .references(() => sightings.id, { onDelete: "cascade" }),
  position: integer("position"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
})

// Local follows — Aviary-to-Aviary user follows
export const localFollows = pgTable(
  "local_follows",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
)

// Photos attached to sightings
export const sightingPhotos = pgTable("sighting_photos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sightingId: text("sighting_id")
    .notNull()
    .references(() => sightings.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Likes received from the Fediverse
export const likes = pgTable("likes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sightingId: text("sighting_id")
    .notNull()
    .references(() => sightings.id, { onDelete: "cascade" }),
  actorUrl: text("actor_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Fediverse followers — remote actors that follow a local Aviary user
export const followers = pgTable("followers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  actorId: text("actor_id")
    .notNull()
    .references(() => actors.id, { onDelete: "cascade" }),
  followerActorUrl: text("follower_actor_url").notNull(),
  followerInboxUrl: text("follower_inbox_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const notifications = pgTable("notifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "like" | "follow"
  fromActorUrl: text("from_actor_url").notNull(),
  fromName: text("from_name"),
  sightingId: text("sighting_id").references(() => sightings.id, { onDelete: "cascade" }),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export type Notification = typeof notifications.$inferSelect
export type User = typeof users.$inferSelect
export type Sighting = typeof sightings.$inferSelect
export type List = typeof lists.$inferSelect
export type ListItem = typeof listItems.$inferSelect
export type Follower = typeof followers.$inferSelect
export type LocalFollow = typeof localFollows.$inferSelect
export type SightingPhoto = typeof sightingPhotos.$inferSelect
export type Like = typeof likes.$inferSelect
