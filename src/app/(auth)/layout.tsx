export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🐦</span>
          <h1 className="mt-2 text-2xl font-bold text-green-800">Aviary</h1>
          <p className="text-sm text-gray-500 mt-1">Letterboxd for Birds</p>
        </div>
        {children}
      </div>
    </div>
  )
}
