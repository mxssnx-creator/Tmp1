"use client"

export default function HomePage() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>CTS v3.2 Dashboard</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>Loading trading system...</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
        <div style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: "0.5rem", backgroundColor: "#f9f9f9" }}>
          <div style={{ height: "0.5rem", backgroundColor: "#e0e0e0", borderRadius: "0.25rem", marginBottom: "0.5rem" }} />
          <div style={{ height: "0.5rem", backgroundColor: "#e0e0e0", borderRadius: "0.25rem", width: "66%" }} />
        </div>
        <div style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: "0.5rem", backgroundColor: "#f9f9f9" }}>
          <div style={{ height: "0.5rem", backgroundColor: "#e0e0e0", borderRadius: "0.25rem", marginBottom: "0.5rem" }} />
          <div style={{ height: "0.5rem", backgroundColor: "#e0e0e0", borderRadius: "0.25rem", width: "66%" }} />
        </div>
      </div>
    </div>
  )
}
