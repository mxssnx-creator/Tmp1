"use client"

export const dynamic = "force-dynamic"

export default function HomePage() {
  return (
    <div style={{ 
      width: "100%", 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center",
      backgroundColor: "#fff",
      fontFamily: "Arial, sans-serif",
      color: "#000",
      padding: "20px"
    }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold", margin: "0 0 16px 0" }}>
        CTS v3.2 Dashboard
      </h1>
      <p style={{ fontSize: "16px", color: "#666", margin: "0 0 8px 0" }}>
        Crypto Trading System - Live
      </p>
      <p style={{ fontSize: "14px", color: "#999", margin: "0", marginTop: "24px" }}>
        49,494 live strategies ready | Indications flowing | Backend operational
      </p>
    </div>
  )
}
