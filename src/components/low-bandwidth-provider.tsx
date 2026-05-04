"use client"

import { createContext, useContext, useEffect, useState } from "react"

const KEY = "aviary-low-bandwidth"

type Ctx = { enabled: boolean; toggle: () => void }
const LowBandwidthContext = createContext<Ctx>({ enabled: false, toggle: () => {} })

export function LowBandwidthProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(localStorage.getItem(KEY) === "true")
  }, [])

  function toggle() {
    setEnabled((prev) => {
      const next = !prev
      localStorage.setItem(KEY, String(next))
      return next
    })
  }

  return (
    <LowBandwidthContext.Provider value={{ enabled, toggle }}>
      {children}
    </LowBandwidthContext.Provider>
  )
}

export function useLowBandwidth() {
  return useContext(LowBandwidthContext)
}
