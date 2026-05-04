"use client"

import { useState } from "react"

export function StarRating({
  name,
  defaultValue = 0,
}: {
  name: string
  defaultValue?: number
}) {
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(defaultValue)

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={selected === star}
          className="text-2xl leading-none transition-transform hover:scale-110 focus:outline-none"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => setSelected(star)}
        >
          {star <= (hovered || selected) ? "★" : "☆"}
        </button>
      ))}
      <input type="hidden" name={name} value={selected} />
    </div>
  )
}
