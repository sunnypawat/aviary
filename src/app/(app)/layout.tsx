import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Nav } from "@/components/nav"
import { DraftsBanner } from "@/components/drafts-banner"
import { LowBandwidthProvider } from "@/components/low-bandwidth-provider"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <LowBandwidthProvider>
      <div className="min-h-screen flex flex-col">
        <Nav />
        <DraftsBanner />
        <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 pb-24 md:pb-8">
          {children}
        </main>
      </div>
    </LowBandwidthProvider>
  )
}
