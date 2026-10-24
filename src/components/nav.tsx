import Link from "next/link"
import { auth, signOut } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { and, count, eq } from "drizzle-orm"
import { BottomNav } from "@/components/bottom-nav"

const NAV_LINKS = (username: string, unreadCount: number) => [
  { href: "/home",                  label: "Home" },
  { href: "/explore",               label: "Explore" },
  { href: "/feed",                  label: "My Sightings" },
  { href: "/lifelist",              label: "Lifelist" },
  { href: "/lists",                 label: "Lists" },
  { href: "/search",                label: "Search" },
  { href: "/notifications",         label: unreadCount > 0 ? `Alerts (${unreadCount > 9 ? "9+" : unreadCount})` : "Alerts" },
  { href: "/settings",              label: "Settings" },
  { href: `/profile/${username}`,   label: `@${username}` },
]

export async function Nav() {
  const session = await auth()

  const unreadCount = session?.user?.id
    ? Number(
        (
          await db
            .select({ count: count() })
            .from(notifications)
            .where(and(eq(notifications.userId, session.user.id), eq(notifications.read, false)))
        )[0].count
      )
    : 0

  return (
    <>
      <nav className="border-b-2 border-black bg-[#fafaf8]">
        <div className="max-w-3xl mx-auto px-4">

          {/* ── Title row ── */}
          <div className={`flex items-center justify-between py-3${session ? " border-b border-black" : ""}`}>
            <Link
              href={session ? "/home" : "/"}
              className="font-display font-bold text-black text-xl tracking-tight"
            >
              🐦 AVIARY
            </Link>

            {/* Logged-in: mobile shortcuts */}
            {session && (
              <div className="flex md:hidden items-center text-[11px] uppercase tracking-widest flex-wrap gap-y-1">
                <Link href="/search" className="text-black hover:underline px-2">Search</Link>
                <span className="text-gray-400">|</span>
                <Link href="/notifications" className="text-black hover:underline px-2">
                  {unreadCount > 0 ? `Alerts (${unreadCount > 9 ? "9+" : unreadCount})` : "Alerts"}
                </Link>
                <span className="text-gray-400">|</span>
                <Link href={`/profile/${session.user.username}`} className="text-black hover:underline px-2">
                  @{session.user.username}
                </Link>
                <span className="text-gray-400">|</span>
                <form
                  action={async () => {
                    "use server"
                    await signOut({ redirectTo: "/login" })
                  }}
                >
                  <button
                    type="submit"
                    className="text-[11px] uppercase tracking-widest text-black hover:underline cursor-pointer px-2"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            )}

            {/* Logged-out: sign in / join */}
            {!session && (
              <div className="flex items-center text-[11px] uppercase tracking-widest">
                <Link href="/login" className="text-black hover:underline px-2">Sign in</Link>
                <span className="text-gray-400">|</span>
                <Link href="/signup" className="text-black font-semibold hover:underline px-2">Join free</Link>
              </div>
            )}
          </div>

          {/* ── Nav links row — desktop only ── */}
          {session && (
            <div className="hidden md:flex items-center py-2 text-[11px] uppercase tracking-widest flex-wrap">
              {NAV_LINKS(session.user.username ?? "", unreadCount).map((item, i) => (
                <span key={item.href} className="flex items-center">
                  {i > 0 && <span className="px-2 text-gray-400 select-none">|</span>}
                  <Link href={item.href} className="text-black hover:underline">
                    {item.label}
                  </Link>
                </span>
              ))}

              <span className="ml-auto">
                <form
                  action={async () => {
                    "use server"
                    await signOut({ redirectTo: "/login" })
                  }}
                >
                  <button
                    type="submit"
                    className="text-[11px] uppercase tracking-widest text-black hover:underline cursor-pointer"
                  >
                    Sign out
                  </button>
                </form>
              </span>
            </div>
          )}

        </div>
      </nav>

      {session?.user?.username && (
        <BottomNav unreadCount={unreadCount} username={session.user.username} />
      )}
    </>
  )
}
