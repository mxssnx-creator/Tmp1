"use client"

export const dynamic = "force-dynamic"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the modern dashboard
    router.replace("/dashboard-modern")
  }, [router])

  return (
    <div style={{ 
      width: "100%", 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center",
      backgroundColor: "#f8f9fa",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      color: "#333",
      padding: "20px"
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "600", margin: "0 0 16px 0", color: "#1a1a1a" }}>
          Loading Modern Dashboard...
        </h1>
        <p style={{ fontSize: "14px", color: "#666", margin: "0 0 24px 0" }}>
          Initializing your advanced trading dashboard
        </p>
        <div style={{ 
          display: "inline-block",
          width: "40px",
          height: "40px",
          border: "3px solid #e0e0e0",
          borderTop: "3px solid #3b82f6",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
