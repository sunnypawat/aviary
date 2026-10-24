"use client"

import { useState, useRef, useEffect } from "react"

type Species = { sciName: string; comName: string }

export function SpeciesAutocomplete({
  initialSciName = "",
  initialComName = "",
}: {
  initialSciName?: string
  initialComName?: string
}) {
  const [query, setQuery] = useState(initialComName || initialSciName)
  const [suggestions, setSuggestions] = useState<Species[]>([])
  const [open, setOpen] = useState(false)
  const [sciName, setSciName] = useState(initialSciName)
  const [comName, setComName] = useState(initialComName)
  const containerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleInput(value: string) {
    setQuery(value)
    setSciName(value)
    setComName("")

    if (value.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    try {
      const res = await fetch(`/api/species?q=${encodeURIComponent(value)}`, {
        signal: abortRef.current.signal,
      })
      const data: Species[] = await res.json()
      setSuggestions(data)
      setOpen(data.length > 0)
    } catch {
      // aborted or network error — ignore
    }
  }

  function select(s: Species) {
    setQuery(s.comName)
    setSciName(s.sciName)
    setComName(s.comName)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Hidden fields that the server action reads */}
      <input type="hidden" name="speciesName" value={sciName} />
      <input type="hidden" name="commonName" value={comName} />

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Bird species <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            required
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="Start typing a common or scientific name…"
            className="w-full border border-black px-3 py-2 text-sm bg-white focus:outline-none focus:outline-2 focus:outline-[#1a3a2a]"
          />
          {open && (
            <ul className="absolute z-10 mt-1 w-full bg-[#fafaf8] border border-black overflow-hidden">
              {suggestions.map((s) => (
                <li key={s.sciName}>
                  <button
                    type="button"
                    onMouseDown={() => select(s)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-black">{s.comName}</span>
                    <span className="ml-2 text-xs text-gray-500 italic">{s.sciName}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {sciName && comName && (
          <p className="mt-1 text-xs text-gray-400 italic">{sciName}</p>
        )}
      </div>
    </div>
  )
}
