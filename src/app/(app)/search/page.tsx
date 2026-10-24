import Link from "next/link"
import { db } from "@/lib/db"
import { users, sightings } from "@/lib/db/schema"
import { ilike, or } from "drizzle-orm"

async function resolveRemoteHandle(handle: string) {
  // Accept @user@domain or user@domain
  const clean = handle.replace(/^@/, "")
  const parts = clean.split("@")
  if (parts.length !== 2) return null
  const [user, domain] = parts

  try {
    const wfRes = await fetch(
      `https://${domain}/.well-known/webfinger?resource=acct:${user}@${domain}`,
      { headers: { Accept: "application/jrd+json" }, next: { revalidate: 60 } }
    )
    if (!wfRes.ok) return null
    const wf = await wfRes.json()
    const actorUrl = wf.links?.find(
      (l: { rel: string; type?: string }) =>
        l.rel === "self" && l.type === "application/activity+json"
    )?.href
    if (!actorUrl) return null

    const actorRes = await fetch(actorUrl, {
      headers: { Accept: "application/activity+json" },
      next: { revalidate: 60 },
    })
    if (!actorRes.ok) return null
    const actor = await actorRes.json()

    return {
      handle: `@${user}@${domain}`,
      name: actor.name ?? actor.preferredUsername ?? user,
      username: actor.preferredUsername ?? user,
      domain,
      actorUrl,
      profileUrl: actor.url ?? actorUrl,
    }
  } catch {
    return null
  }
}

function looksLikeRemoteHandle(q: string) {
  const clean = q.replace(/^@/, "")
  return clean.includes("@")
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ""

  const isRemote = looksLikeRemoteHandle(query)

  const [matchedUsers, matchedSightings, remoteActor] = await Promise.all([
    query.length >= 2 && !isRemote
      ? db
          .select({ id: users.id, username: users.username, name: users.name })
          .from(users)
          .where(or(ilike(users.username, `%${query}%`), ilike(users.name, `%${query}%`)))
          .limit(10)
      : [],
    query.length >= 2 && !isRemote
      ? db
          .select({ speciesName: sightings.speciesName, commonName: sightings.commonName })
          .from(sightings)
          .where(
            or(
              ilike(sightings.speciesName, `%${query}%`),
              ilike(sightings.commonName, `%${query}%`)
            )
          )
          .groupBy(sightings.speciesName, sightings.commonName)
          .limit(10)
      : [],
    query.length >= 5 && isRemote ? resolveRemoteHandle(query) : null,
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-black mb-6">Search</h1>

      <form className="mb-2">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search users, species, or @user@mastodon.social…"
          autoFocus
          className="w-full border border-black px-4 py-3 text-sm bg-white focus:outline-none focus:outline-2 focus:outline-[#1a3a2a]"
        />
      </form>
      <p className="text-xs text-gray-400 mb-6">
        Tip: search <span className="font-mono">@username@mastodon.social</span> to find accounts on other platforms
      </p>

      {query.length >= 2 && (
        <div className="space-y-6">
          {/* Remote actor result */}
          {remoteActor && (
            <section>
              <h2 className="text-[11px] font-semibold text-black uppercase tracking-widest mb-3">
                External Account
              </h2>
              <a
                href={remoteActor.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 border border-black px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 border-2 border-black flex items-center justify-center text-black font-medium text-sm shrink-0">
                  {remoteActor.name[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black">{remoteActor.name}</p>
                  <p className="text-xs text-gray-500">{remoteActor.handle}</p>
                </div>
                <span className="text-xs text-gray-500 border border-black px-2 py-0.5 shrink-0">
                  on {remoteActor.domain} ↗
                </span>
              </a>
              <p className="text-xs text-gray-400 mt-2 pl-1">
                Not on Aviary — view their profile on {remoteActor.domain}
              </p>
            </section>
          )}

          {isRemote && !remoteActor && query.length >= 5 && (
            <p className="text-sm text-gray-400">
              Could not find <span className="font-mono">{query}</span>. Check the handle and try again.
            </p>
          )}

          {/* Local users */}
          {(matchedUsers as { id: string; username: string | null; name: string | null }[]).length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold text-black uppercase tracking-widest mb-3">
                Birders on Aviary
              </h2>
              <div className="space-y-2">
                {(matchedUsers as { id: string; username: string | null; name: string | null }[]).map((u) => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.username}`}
                    className="flex items-center gap-3 border border-black px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 border-2 border-black flex items-center justify-center text-black font-medium text-sm">
                      {(u.name ?? u.username ?? "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black">{u.name ?? u.username}</p>
                      <p className="text-xs text-gray-500">@{u.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Species */}
          {(matchedSightings as { speciesName: string; commonName: string | null }[]).length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold text-black uppercase tracking-widest mb-3">
                Species
              </h2>
              <div className="space-y-2">
                {(matchedSightings as { speciesName: string; commonName: string | null }[]).map((s) => (
                  <div
                    key={s.speciesName}
                    className="border border-black px-4 py-3"
                  >
                    <p className="text-sm font-medium text-black">{s.speciesName}</p>
                    {s.commonName && <p className="text-xs text-gray-500">{s.commonName}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {!isRemote &&
            (matchedUsers as unknown[]).length === 0 &&
            (matchedSightings as unknown[]).length === 0 && (
              <p className="text-sm text-gray-400">
                No results for &ldquo;{query}&rdquo;
              </p>
            )}
        </div>
      )}
    </div>
  )
}
