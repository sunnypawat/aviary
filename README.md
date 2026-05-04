# Aviary 🐦

> Letterboxd for birds — a decentralized social platform for citizen bird science

Aviary is a social platform where birders can log sightings, share them with a community, and connect with people across the [Fediverse](https://en.wikipedia.org/wiki/Fediverse) via ActivityPub. Built with permacomputing values: offline-first, low-bandwidth friendly, and fully data-portable.

---

## Features

- **Social feed** — follow other birders, like sightings, discover new ones on the explore page
- **Sighting log** — record species, star rating (1–5), field notes, GPS location, and photos
- **ActivityPub federation** — your profile and sightings are visible across Mastodon, Pixelfed, and other Fediverse servers
- **Offline-first PWA** — log sightings in the field with no signal; drafts sync automatically when you're back online
- **Low-bandwidth mode** — hides images in feeds to save data on slow connections
- **BirdNET audio ID** — record a bird call and let AI identify the species
- **Privacy by design** — GPS coordinates are fuzzed (~10 km) before being shared publicly; per-sighting visibility (public / friends / private)
- **Data sovereignty** — export everything as JSON or eBird-compatible CSV at any time
- **Lists** — curate personal collections (e.g. "Birds of Thailand", "Raptors I've seen")

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| Database | PostgreSQL via [Neon](https://neon.tech) |
| ORM | Drizzle ORM |
| Auth | NextAuth v5 |
| Photos | UploadThing |
| Federation | ActivityPub (HTTP Signatures, JSON-LD) |
| Maps | Leaflet + React Leaflet |
| Styling | Tailwind CSS v4 |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (or a [Neon](https://neon.tech) account for a hosted DB)
- An [UploadThing](https://uploadthing.com) account (for photo uploads)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/aviary.git
cd aviary
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret   # openssl rand -base64 32
UPLOADTHING_TOKEN=your-token
```

### 3. Run database migrations

```bash
node node_modules/drizzle-kit/bin.cjs push
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying

The easiest path is **Vercel + Neon**:

1. Push to GitHub
2. Create a free PostgreSQL database at [neon.tech](https://neon.tech) and copy the connection string
3. Import the repo on [vercel.com](https://vercel.com) and add the environment variables
4. Run `drizzle-kit push` once against your Neon database to create the tables

---

## ActivityPub / Fediverse

Each Aviary instance exposes standard ActivityPub endpoints:

- `/.well-known/webfinger` — actor discovery
- `/users/:username` — actor profile (JSON-LD)
- `/users/:username/inbox` — incoming activities
- `/users/:username/outbox` — published sightings as `Note` activities

Sightings posted as `public` are federated as `Create{Note}` activities signed with RSA-SHA256 HTTP Signatures. Mastodon users can follow Aviary accounts and see sightings in their home feed.

---

## Permacomputing Principles

Aviary is designed to last and to include everyone:

- **Offline-first** — the PWA service worker caches pages; drafts are saved to IndexedDB and synced later
- **Low-bandwidth mode** — one toggle hides all images in feeds
- **Open data** — full export in JSON and eBird CSV; no proprietary formats
- **Self-hostable** — run your own instance with Docker (`docker-compose up`)
- **Open standards** — ActivityPub, WebFinger, and eBird taxonomy; no vendor lock-in

---

## License

MIT
