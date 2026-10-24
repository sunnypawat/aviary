"use client"

import { useActionState } from "react"
import Link from "next/link"
import { login } from "@/lib/actions/auth"

const initialState = { error: "" }

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, initialState)

  return (
    <div className="border-2 border-black p-8 bg-[#fafaf8]">
      <h2 className="text-xl font-bold text-black mb-6">Sign in</h2>
      <form action={action} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full border border-black px-3 py-2 text-sm bg-white focus:outline-none focus:outline-2 focus:outline-[#1a3a2a]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full border border-black px-3 py-2 text-sm bg-white focus:outline-none focus:outline-2 focus:outline-[#1a3a2a]"
          />
        </div>
        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full border-2 border-black bg-black hover:bg-[#1a3a2a] hover:border-[#1a3a2a] text-white font-medium py-2 text-sm transition-colors disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        No account?{" "}
        <Link href="/signup" className="text-[#1a3a2a] font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
