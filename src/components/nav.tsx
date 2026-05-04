import Link from "next/link"
import { auth, signOut } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { and, count, eq } from "drizzle-orm"
import { BottomNav } from "@/components/bottom-nav"

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
      <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 flex items-center justify-between h-14">
          <Link href="/home" className="font-bold text-green-800 text-lg tracking-tight">
            🐦 Aviary
          </Link>
          {session && (
            <>
              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-4 text-sm">
                <Link href="/home" className="text-gray-600 hover:text-gray-900">Home</Link>
                <Link href="/explore" className="text-gray-600 hover:text-gray-900">Explore</Link>
                <Link href="/feed" className="text-gray-600 hover:text-gray-900">My Sightings</Link>
                <Link href="/lifelist" className="text-gray-600 hover:text-gray-900">Lifelist</Link>
                <Link href="/lists" className="text-gray-600 hover:text-gray-900">Lists</Link>
                <Link href="/search" className="text-gray-600 hover:text-gray-900">Search</Link>
                <Link href="/log" className="bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded-lg transition-colors font-medium">
                  + Log
                </Link>
                <Link href="/notifications" className="relative text-gray-600 hover:text-gray-900">
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/settings" className="text-gray-600 hover:text-gray-900">Settings</Link>
                {session.user.username && (
                  <Link
                    href={`/profile/${session.user.username}`}
                    className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-semibold text-xs hover:bg-green-200 transition-colors"
                    title="My Profile"
                  >
                    {session.user.username[0].toUpperCase()}
                  </Link>
                )}
                <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }) }}>
                  <button type="submit" className="text-gray-400 hover:text-gray-700">Sign out</button>
                </form>
              </div>

              {/* Mobile top-right: avatar + settings */}
              <div className="flex md:hidden items-center gap-3">
                <Link href="/search" className="text-gray-500 hover:text-gray-800 p-1" aria-label="Search">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </Link>
                <Link href="/settings" className="text-gray-500 hover:text-gray-800 p-1" aria-label="Settings">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 010 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
                {session.user.username && (
                  <Link
                    href={`/profile/${session.user.username}`}
                    className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-sm hover:bg-green-200 transition-colors"
                  >
                    {session.user.username[0].toUpperCase()}
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </nav>

      {session?.user?.username && (
        <BottomNav unreadCount={unreadCount} username={session.user.username} />
      )}
    </>
  )
}
