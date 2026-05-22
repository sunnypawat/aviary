import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users, sightings, sightingPhotos } from "@/lib/db/schema"
import { count, eq, desc } from "drizzle-orm"

export const revalidate = 3600 // refresh stats every hour

export default async function LandingPage() {
  const session = await auth()
  if (session) redirect("/feed")

  // Live stats
  const [userCount] = await db.select({ count: count() }).from(users)
  const [sightingCount] = await db.select({ count: count() }).from(sightings)

  // A few recent public sightings to show the feed is alive
  const recentSightings = await db
    .select({
      id: sightings.id,
      speciesName: sightings.speciesName,
      commonName: sightings.commonName,
      rating: sightings.rating,
      locationName: sightings.locationName,
      sightedAt: sightings.sightedAt,
    })
    .from(sightings)
    .where(eq(sightings.visibility, "public"))
    .orderBy(desc(sightings.createdAt))
    .limit(3)

  const photosBySighting: Record<string, string> = {}
  if (recentSightings.length > 0) {
    for (const s of recentSightings) {
      const photos = await db
        .select({ url: sightingPhotos.url })
        .from(sightingPhotos)
        .where(eq(sightingPhotos.sightingId, s.id))
        .limit(1)
      if (photos[0]) photosBySighting[s.id] = photos[0].url
    }
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] text-gray-900">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-20 bg-[#fafaf8]/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-green-800 text-lg">🐦 Aviary</span>
          <div className="flex gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="text-sm bg-green-700 hover:bg-green-800 text-white px-4 py-1.5 rounded-lg font-medium transition-colors">
              Join free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
        <p className="text-6xl mb-6">🐦</p>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
          A social network for birders —<br className="hidden md:block" />
          <span className="text-green-700">owned by no one.</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Log your bird sightings, follow other birders, and connect with people
          across Mastodon and the Fediverse. Your data stays yours — forever.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="bg-green-700 hover:bg-green-800 text-white font-semibold px-8 py-3 rounded-xl text-sm transition-colors"
          >
            Join Aviary — it&apos;s free
          </Link>
          <Link
            href="/explore"
            className="border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium px-8 py-3 rounded-xl text-sm transition-colors"
          >
            Browse public sightings →
          </Link>
        </div>

        {/* Live stats */}
        <div className="flex justify-center gap-10 mt-14 text-center">
          <div>
            <p className="text-3xl font-bold text-green-700">{sightingCount.count.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">sightings logged</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <p className="text-3xl font-bold text-green-700">{userCount.count.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">birders</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <p className="text-3xl font-bold text-green-700">∞</p>
            <p className="text-xs text-gray-400 mt-1">Fediverse connections</p>
          </div>
        </div>
      </section>

      {/* ── Recent sightings ── */}
      {recentSightings.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Recent sightings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recentSightings.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {photosBySighting[s.id] ? (
                  <img src={photosBySighting[s.id]} alt={s.speciesName} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-green-50 flex items-center justify-center text-4xl">🐦</div>
                )}
                <div className="p-3">
                  <p className="font-semibold text-sm text-gray-900 truncate">{s.speciesName}</p>
                  {s.commonName && <p className="text-xs text-gray-400 truncate">{s.commonName}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-amber-400 text-xs">{"★".repeat(s.rating)}{"☆".repeat(5 - s.rating)}</span>
                    {s.locationName && <span className="text-xs text-gray-400 truncate ml-2">📍 {s.locationName}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── What is the Fediverse ── */}
      <section className="bg-[#1a2e1f] text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-3">Built on open protocols</p>
            <h2 className="text-3xl font-bold mb-4 leading-tight">What is the Fediverse?</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              The Fediverse is a network of independent servers that talk to each other using an open standard called <strong className="text-white">ActivityPub</strong> — the same protocol that powers Mastodon, Pixelfed, and millions of accounts worldwide.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              When you join Aviary, you get a handle like <code className="bg-green-900 px-1.5 py-0.5 rounded text-green-300 text-sm">@you@aviary.app</code>. People on Mastodon can follow you. You can follow them. No one company controls the network.
            </p>
            <p className="text-gray-300 leading-relaxed">
              If Aviary ever shuts down, your followers stay yours — you can move to any other ActivityPub server and keep your community.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: "🦣", label: "Mastodon", desc: "Mastodon users can follow your Aviary profile and see your sightings in their home feed." },
              { icon: "📸", label: "Pixelfed", desc: "Photo-first ActivityPub platform — your bird photos connect across the Fediverse." },
              { icon: "🐦", label: "Other Aviary servers", desc: "Any self-hosted Aviary instance federates with yours automatically." },
            ].map((item) => (
              <div key={item.label} className="flex gap-4 items-start bg-white/5 rounded-xl p-4">
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-10 text-center">Why Aviary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            {
              icon: "📴",
              title: "Works offline",
              desc: "Log sightings in the field with no signal. Drafts save to your device and sync automatically when you're back online.",
            },
            {
              icon: "📦",
              title: "Your data, forever",
              desc: "Export everything as JSON or eBird-compatible CSV at any time. No proprietary formats, no lock-in.",
            },
            {
              icon: "🔒",
              title: "Privacy by design",
              desc: "Your exact GPS coordinates never leave the database. Only a ~10 km fuzzy region is shared publicly, protecting rare species.",
            },
            {
              icon: "🌿",
              title: "Low-bandwidth mode",
              desc: "One toggle hides all images in feeds — for slow connections, older devices, or just saving data.",
            },
            {
              icon: "🎤",
              title: "BirdNET audio ID",
              desc: "Record a bird call and let AI identify the species. Lowers the barrier for beginners.",
            },
            {
              icon: "🗄️",
              title: "Self-hostable",
              desc: "Run your own Aviary instance for your community. Open source, Docker-ready, no vendor lock-in.",
            },
          ].map((f) => (
            <div key={f.title} className="bg-white border border-gray-200 rounded-2xl p-5">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="font-semibold text-gray-900 mt-3 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Permacomputing ── */}
      <section className="bg-green-50 border-y border-green-100">
        <div className="max-w-3xl mx-auto px-4 py-14 text-center">
          <p className="text-3xl mb-4">🌿</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Built for longevity</h2>
          <p className="text-gray-600 leading-relaxed max-w-xl mx-auto">
            Aviary follows <strong>permacomputing</strong> principles — software designed to last, use fewer resources,
            and include everyone regardless of device or connection speed. We believe the tools for citizen science
            should work for birders everywhere, not just those with the newest phones and fastest internet.
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Start logging your sightings</h2>
        <p className="text-gray-500 mb-8">Free, open, and part of the Fediverse.</p>
        <Link
          href="/signup"
          className="inline-block bg-green-700 hover:bg-green-800 text-white font-semibold px-10 py-3.5 rounded-xl text-sm transition-colors"
        >
          Create your account →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <span>🐦 Aviary — Letterboxd for Birds</span>
          <div className="flex gap-5">
            <Link href="/explore" className="hover:text-gray-700">Explore</Link>
            <Link href="/signup" className="hover:text-gray-700">Join</Link>
            <Link href="/login" className="hover:text-gray-700">Sign in</Link>
            <a href="https://github.com/sunnypawat/aviary" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700">GitHub</a>
          </div>
          <span>Built on ActivityPub · Open source · MIT</span>
        </div>
      </footer>

    </div>
  )
}
