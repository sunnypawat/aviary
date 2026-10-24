"use client"

import { useRouter } from "next/navigation"

const motivations = [
  {
    icon: "📋",
    title: "Log my own sightings",
    desc: "I want to keep a personal record of every bird I've seen.",
    value: "logger",
  },
  {
    icon: "🔍",
    title: "See what others are spotting",
    desc: "I want to discover sightings from birders around the world.",
    value: "explorer",
  },
  {
    icon: "🔬",
    title: "Contribute to bird science",
    desc: "I want my observations to feed into open biodiversity data.",
    value: "scientist",
  },
]

export default function WelcomePage() {
  const router = useRouter()

  function choose(value: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("aviary-motivation", value)
    }
    router.push("/feed")
  }

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <div className="text-center mb-10">
        <p className="text-5xl mb-4">🐦</p>
        <h1 className="text-2xl font-bold text-black mb-2">Welcome to Aviary</h1>
        <p className="text-gray-500 text-sm">What brings you here? This helps us understand how people use the app.</p>
      </div>

      <div className="space-y-3">
        {motivations.map((m) => (
          <button
            key={m.value}
            onClick={() => choose(m.value)}
            className="w-full text-left border-2 border-black hover:bg-gray-50 p-5 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl shrink-0">{m.icon}</span>
              <div>
                <p className="font-semibold text-black">{m.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{m.desc}</p>
              </div>
              <span className="ml-auto text-gray-400 text-xl shrink-0">→</span>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => router.push("/feed")}
        className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-6"
      >
        Skip for now
      </button>

      <p className="text-center text-xs text-gray-300 mt-4">
        Your answer is stored only on your device — we don&apos;t collect this data.
      </p>
    </div>
  )
}
