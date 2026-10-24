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
        <label className="block text-sm font-medium text-black mb-1">
          List name <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          type="text"
          required
          placeholder="e.g. Top 10 Owls, Spring Trip 2026"
          className="w-full border border-black px-3 py-2 text-sm bg-white focus:outline-none focus:outline-2 focus:outline-[#1a3a2a]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Description
        </label>
        <input
          name="description"
          type="text"
          placeholder="Optional description"
          className="w-full border border-black px-3 py-2 text-sm bg-white focus:outline-none focus:outline-2 focus:outline-[#1a3a2a]"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="border-2 border-black bg-black hover:bg-[#1a3a2a] hover:border-[#1a3a2a] text-white font-medium px-4 py-2 text-sm transition-colors disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create list"}
      </button>
    </form>
  )
}
