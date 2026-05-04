"use client"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[#fafaf8]">
      <p className="text-7xl mb-6">🐦</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">You're offline</h1>
      <p className="text-gray-500 text-sm max-w-xs">
        No connection right now. Pages you've already visited are still available — go back and browse your cached sightings.
      </p>
      <button
        onClick={() => window.history.back()}
        className="mt-8 px-5 py-2.5 bg-green-700 text-white rounded-xl text-sm font-medium hover:bg-green-800 active:scale-95 transition-all"
      >
        Go back
      </button>
    </div>
  )
}
