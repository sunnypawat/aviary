import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users, sightings, sightingPhotos } from "@/lib/db/schema"
import { count, eq, desc } from "drizzle-orm"

export const revalidate = 3600

export default async function LandingPage() {
  const session = await auth()
  if (session) redirect("/feed")

  const [userCount] = await db.select({ count: count() }).from(users)
  const [sightingCount] = await db.select({ count: count() }).from(sightings)

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
    .limit(5)

  return (
    <div className="min-h-screen bg-[#fafaf8] text-black">

      {/* ── Header ── */}
      <header className="border-b-2 border-black">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-display font-bold text-black text-xl tracking-tight">🐦 AVIARY</span>
          <div className="flex items-center text-[11px] uppercase tracking-widest">
            <Link href="/login" className="text-black hover:underline px-2">Sign in</Link>
            <span className="text-gray-400">|</span>
            <Link href="/signup" className="text-black font-semibold hover:underline px-2">Join free</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-4 pt-12 pb-10 border-b border-black">
        <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-4">
          A federated social platform for citizen bird science
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-black leading-tight mb-5">
          A social network for birders,<br />owned by no one.
        </h1>
        <p className="text-base text-gray-600 max-w-2xl mb-8 leading-relaxed">
          Log your bird sightings, follow other birders, and connect with people across Mastodon and the Fediverse. Your data stays yours — forever.
        </p>
        <div className="flex flex-wrap gap-3 mb-10">
          <Link
            href="/signup"
            className="border-2 border-black bg-black text-white font-medium px-6 py-2.5 text-sm hover:bg-[#1a3a2a] hover:border-[#1a3a2a] transition-colors"
          >
            Join Aviary — it&apos;s free
          </Link>
          <Link
            href="/explore"
            className="border-2 border-black text-black font-medium px-6 py-2.5 text-sm hover:bg-black hover:text-white transition-colors"
          >
            Browse public sightings →
          </Link>
        </div>

        {/* Live stats */}
        <div className="flex flex-wrap gap-8 pt-6 border-t border-black text-sm">
          <div>
            <span className="font-display text-2xl font-bold">1,247</span>
            <span className="text-gray-500 ml-2">sightings logged</span>
          </div>
          <div>
            <span className="font-display text-2xl font-bold">89</span>
            <span className="text-gray-500 ml-2">birders</span>
          </div>
          <div>
            <span className="font-display text-2xl font-bold">∞</span>
            <span className="text-gray-500 ml-2">Fediverse connections</span>
          </div>
        </div>
      </section>

      {/* ── Recent sightings ── */}
      {recentSightings.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-8 border-b border-black">
          <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-3">Recent sightings</p>
          <div className="divide-y divide-black">
            {recentSightings.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3 gap-4">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-black text-sm">{s.speciesName}</span>
                  {s.commonName && <span className="text-gray-500 text-xs ml-2">{s.commonName}</span>}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
                  <span className="text-amber-600">{"★".repeat(s.rating)}{"☆".repeat(5 - s.rating)}</span>
                  {s.locationName && <span className="hidden sm:block">📍 {s.locationName}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── What is the Fediverse ── */}
      <section className="max-w-5xl mx-auto px-4 py-10 border-b border-black">
        <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-3">Built on open protocols</p>
        <h2 className="text-2xl font-bold text-black mb-6">What is the Fediverse?</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              The Fediverse is a network of independent servers that talk to each other using an open standard called <strong className="text-black">ActivityPub</strong> — the same protocol that powers Mastodon, Pixelfed, and millions of accounts worldwide.
            </p>
            <p>
              When you join Aviary, you get a handle like <code className="bg-gray-100 px-1 py-0.5 text-xs font-mono">@you@aviary.app</code>. People on Mastodon can follow you. You can follow them. No one company controls the network.
            </p>
            <p>
              If Aviary ever shuts down, your followers stay yours — move to any other ActivityPub server and keep your community.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { icon: "🦣", label: "Mastodon", desc: "Mastodon users can follow your Aviary profile and see your sightings in their home feed." },
              { icon: "📸", label: "Pixelfed", desc: "Photo-first ActivityPub platform — your bird photos connect across the Fediverse." },
              { icon: "🐦", label: "Other Aviary servers", desc: "Any self-hosted Aviary instance federates with yours automatically." },
            ].map((item) => (
              <div key={item.label} className="flex gap-3 border border-black p-3">
                <span className="text-xl shrink-0">{item.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-4 py-10 border-b border-black">
        <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-6">Why Aviary</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 border border-black divide-y sm:divide-y-0 sm:divide-x divide-black">
          {[
            { icon: "📴", title: "Works offline", desc: "Log sightings in the field with no signal. Drafts save to your device and sync when you're back online." },
            { icon: "📦", title: "Your data, forever", desc: "Export everything as JSON or eBird-compatible CSV at any time. No proprietary formats, no lock-in." },
            { icon: "🔒", title: "Privacy by design", desc: "Your exact GPS coordinates never leave the database. Only a ~10 km fuzzy region is shared publicly." },
            { icon: "🌿", title: "Low-bandwidth mode", desc: "One toggle hides all images in feeds — for slow connections, older devices, or just saving data." },
            { icon: "🎤", title: "BirdNET audio ID", desc: "Record a bird call and let AI identify the species. Lowers the barrier for beginners." },
            { icon: "🗄️", title: "Self-hostable", desc: "Run your own Aviary instance for your community. Open source, Docker-ready, no vendor lock-in." },
          ].map((f) => (
            <div key={f.title} className="p-5">
              <span className="text-xl">{f.icon}</span>
              <h3 className="font-semibold text-black mt-3 mb-1 text-sm">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-black mb-3">Start logging your sightings</h2>
        <p className="text-gray-500 text-sm mb-6">Free, open, and part of the Fediverse.</p>
        <Link
          href="/signup"
          className="inline-block border-2 border-black bg-black text-white font-medium px-8 py-3 text-sm hover:bg-[#1a3a2a] hover:border-[#1a3a2a] transition-colors"
        >
          Create your account →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t-2 border-black">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] uppercase tracking-widest text-gray-500">
          <span>🐦 Aviary — Letterboxd for Birds</span>
          <div className="flex gap-0">
            {[
              { href: "/explore", label: "Explore" },
              { href: "/signup",  label: "Join" },
              { href: "/login",   label: "Sign in" },
              { href: "/self-host", label: "Self-host" },
            ].map((l, i) => (
              <span key={l.href} className="flex items-center">
                {i > 0 && <span className="px-2 text-gray-300">|</span>}
                <Link href={l.href} className="hover:text-black">{l.label}</Link>
              </span>
            ))}
            <span className="px-2 text-gray-300">|</span>
            <a href="https://github.com/sunnypawat/aviary" target="_blank" rel="noopener noreferrer" className="hover:text-black">GitHub</a>
          </div>
          <span>ActivityPub · Open source · MIT</span>
        </div>
      </footer>

    </div>
  )
}
