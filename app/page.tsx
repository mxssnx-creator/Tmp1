"use client"

import { useEffect, useState } from "react"
import { Dashboard } from "@/components/dashboard/dashboard"

export default function HomePage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    console.log("[v0] Home page mounted - setting isClient=true")
    setIsClient(true)
  }, [])

  // Always render something, even during hydration
  return (
    <div className="min-h-screen">
      <div className="flex-1">
        {isClient ? (
          <Dashboard />
        ) : (
          <div className="p-8">
            <div className="text-lg font-semibold">CTS v3.2 Dashboard</div>
            <p className="text-sm text-muted-foreground mt-2">Loading...</p>
          </div>
        )}
      </div>
    </div>
  )
}
