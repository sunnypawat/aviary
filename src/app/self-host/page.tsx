import Link from "next/link"

export default function SelfHostPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <header className="sticky top-0 z-20 bg-[#fafaf8] border-b-2 border-black">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-black text-lg font-display">🐦 Aviary</Link>
          <Link href="/signup" className="text-sm border-2 border-black bg-black hover:bg-[#1a3a2a] hover:border-[#1a3a2a] text-white px-4 py-1.5 font-medium transition-colors">
            Join free
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Hero */}
        <div className="mb-12">
          <p className="text-[11px] font-semibold text-black uppercase tracking-widest mb-3">Self-hosting</p>
          <h1 className="text-4xl font-bold text-black mb-4 leading-tight font-display">
            Run your own Aviary instance
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
            Any community can run their own Aviary server. It federates automatically with every other instance — and with Mastodon, Pixelfed, and the wider Fediverse. No permission needed. No vendor lock-in.
          </p>
        </div>

        {/* Why self-host */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {[
            { icon: "🏛️", title: "Full ownership", desc: "Your community's data lives on your server. You control backups, exports, and access." },
            { icon: "🌐", title: "Still federated", desc: "Your instance connects to the global Aviary and Fediverse network automatically." },
            { icon: "🔧", title: "Fully customisable", desc: "Change the name, colours, or rules to fit your community's needs." },
          ].map((f) => (
            <div key={f.title} className="border border-black p-5">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="font-semibold text-black mt-3 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Prerequisites */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-black mb-4">What you need</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              "A server or VPS (4GB RAM minimum — DigitalOcean, Hetzner, or any Linux host)",
              "A domain name pointing to your server",
              "Docker and Docker Compose installed",
              "A free Uploadthing account for photo storage",
              "A free Neon or Supabase account for PostgreSQL (or run Postgres in Docker)",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-black shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="space-y-8 mb-12">
          <h2 className="text-xl font-bold text-black">Setup guide</h2>

          {[
            {
              step: "01",
              title: "Clone the repository",
              code: `git clone https://github.com/sunnypawat/aviary.git
cd aviary`,
            },
            {
              step: "02",
              title: "Configure environment variables",
              code: `cp .env.example .env

# Edit .env and set:
# DATABASE_URL=postgresql://...
# NEXTAUTH_URL=https://your-domain.com
# NEXTAUTH_SECRET=your-random-secret
# UPLOADTHING_TOKEN=your-token
# NEXT_PUBLIC_APP_URL=https://your-domain.com`,
            },
            {
              step: "03",
              title: "Start with Docker",
              code: `docker-compose up -d`,
            },
            {
              step: "04",
              title: "Run database migrations",
              code: `docker-compose exec app node node_modules/drizzle-kit/bin.cjs push`,
            },
            {
              step: "05",
              title: "You're live",
              code: `# Your instance is running at https://your-domain.com
# Users on Mastodon can find your members at:
# @username@your-domain.com`,
            },
          ].map((s) => (
            <div key={s.step} className="flex gap-5">
              <div className="shrink-0 w-10 h-10 border-2 border-black flex items-center justify-center text-black font-bold text-sm font-mono">
                {s.step}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-black mb-2">{s.title}</h3>
                <pre className="bg-[#1a2e1f] text-white p-4 text-xs overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap">
                  {s.code}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* Permacomputing note */}
        <div className="border-2 border-black p-6 mb-10">
          <p className="text-2xl mb-3">🌿</p>
          <h3 className="font-semibold text-black mb-2">A note on permacomputing</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Self-hosting is a permacomputing choice. Your community&apos;s data doesn&apos;t depend on any company&apos;s continued goodwill or funding. Even if the main Aviary instance disappears tomorrow, your server keeps running — and your sightings, your followers, and your connections to the Fediverse remain intact.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center py-8 border-t-2 border-black">
          <p className="text-gray-600 text-sm mb-4">Not ready to self-host? Use the hosted version — it&apos;s free.</p>
          <Link
            href="/signup"
            className="inline-block border-2 border-black bg-black hover:bg-[#1a3a2a] hover:border-[#1a3a2a] text-white font-semibold px-8 py-3 text-sm transition-colors"
          >
            Join aviary-neon.vercel.app →
          </Link>
          <p className="text-xs text-gray-400 mt-4">
            Questions? Open an issue on{" "}
            <a href="https://github.com/sunnypawat/aviary" className="underline hover:text-gray-600" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
