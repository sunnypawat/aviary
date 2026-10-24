"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
      {active ? (
        <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-1.72-1.72V5.25a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75v1.44L12 3 3.41 11.47a.75.75 0 001.06 1.06l.03-.03V19.5A1.5 1.5 0 006 21h4.5v-4.5h3V21H18a1.5 1.5 0 001.5-1.5v-6.97l.03.03a.75.75 0 001.06-1.06L11.47 3.84z" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a.75.75 0 011.06 0L21.75 12M4.5 9.75v10.125A1.125 1.125 0 005.625 21H9.75v-4.875A1.125 1.125 0 0110.875 15h2.25A1.125 1.125 0 0114.25 16.125V21h4.125A1.125 1.125 0 0019.5 19.875V9.75M8.25 21h7.5" />
      )}
    </svg>
  )
}

function CompassIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
      {active ? (
        <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      )}
    </svg>
  )
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
      {active ? (
        <>
          <path d="M5.85 3.5a.75.75 0 00-1.117-1 9.719 9.719 0 00-2.348 4.876.75.75 0 001.479.248A8.219 8.219 0 015.85 3.5zM19.267 2.5a.75.75 0 10-1.118 1 8.22 8.22 0 011.987 4.124.75.75 0 001.48-.248A9.72 9.72 0 0019.266 2.5z" />
          <path fillRule="evenodd" d="M12 2.25A6.75 6.75 0 005.25 9v.75a8.217 8.217 0 01-2.119 5.52.75.75 0 00.298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 107.48 0 24.583 24.583 0 004.83-1.244.75.75 0 00.298-1.205 8.217 8.217 0 01-2.118-5.52V9A6.75 6.75 0 0012 2.25zM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 004.496 0l.002.1a2.25 2.25 0 11-4.5 0z" clipRule="evenodd" />
        </>
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      )}
    </svg>
  )
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.75}>
      {active ? (
        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      )}
    </svg>
  )
}

export function BottomNav({
  unreadCount,
  username,
}: {
  unreadCount: number
  username: string
}) {
  const path = usePathname()

  const tabs = [
    { href: "/home", label: "Home", Icon: HomeIcon },
    { href: "/explore", label: "Explore", Icon: CompassIcon },
    { href: "/notifications", label: "Alerts", Icon: BellIcon },
    { href: `/profile/${username}`, label: "Profile", Icon: UserIcon },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#fafaf8] border-t-2 border-black safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {tabs.slice(0, 2).map(({ href, label, Icon }) => {
          const active = path === href || path.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 transition-colors min-w-[56px] ${
                active ? "text-black" : "text-gray-400"
              }`}
            >
              <Icon active={active} />
              <span className="text-[10px] font-medium uppercase tracking-widest">{label}</span>
            </Link>
          )
        })}

        {/* Center FAB — flat square in LTM style */}
        <Link
          href="/log"
          className="flex items-center justify-center w-12 h-12 bg-black text-white hover:bg-[#1a3a2a] active:scale-95 transition-all -mt-4 border-2 border-black"
          aria-label="Log a sighting"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </Link>

        {tabs.slice(2).map(({ href, label, Icon }) => {
          const active = path === href || path.startsWith(href + "/")
          const isAlerts = href === "/notifications"
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-2 transition-colors min-w-[56px] ${
                active ? "text-black" : "text-gray-400"
              }`}
            >
              <Icon active={active} />
              {isAlerts && unreadCount > 0 && (
                <span className="absolute top-1.5 right-3 bg-black text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
