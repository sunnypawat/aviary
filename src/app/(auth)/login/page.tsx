"use client"

import { useActionState } from "react"
import Link from "next/link"
import { login } from "@/lib/actions/auth"

const initialState = { error: "" }

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, initialState)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in</h2>
      <form action={action} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg py-2 text-sm transition-colors disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        No account?{" "}
        <Link href="/signup" className="text-green-700 font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
