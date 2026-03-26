"use client"

import { useEffect, useState } from "react"

export default function DebugDashboard() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/trade-engine/status")
      .then(r => r.json())
      .then(d => {
        setLoading(false)
        console.log("Status ok:", d)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading diagnostics...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Dashboard Diagnostics</h1>
      <p>Trade engine status loaded successfully.</p>
    </div>
  )
}