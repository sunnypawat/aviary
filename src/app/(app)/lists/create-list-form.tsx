"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { createList } from "@/lib/actions/lists"

const initialState = { error: "", success: false as boolean, listId: "" }

export function CreateListForm() {
  const [state, action, pending] = useActionState(createList, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) router.refresh()
  }, [state?.success, router])

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          List name <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          type="text"
          required
          placeholder="e.g. Top 10 Owls, Spring Trip 2026"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          name="description"
          type="text"
          placeholder="Optional description"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create list"}
      </button>
    </form>
  )
}
