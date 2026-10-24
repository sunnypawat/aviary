import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8] py-12 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 border-b-2 border-black pb-6">
          <Link href="/" className="font-display font-bold text-black text-3xl tracking-tight hover:underline">
            🐦 AVIARY
          </Link>
          <p className="text-[11px] uppercase tracking-widest text-gray-500 mt-2">Letterboxd for Birds</p>
        </div>
        {children}
      </div>
    </div>
  )
}
