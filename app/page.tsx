export default function HomePage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0f172a",
      color: "#fff",
      fontFamily: "Arial, sans-serif",
      padding: "20px"
    }}>
      <div style={{ textAlign: "center", maxWidth: "600px" }}>
        <h1 style={{ fontSize: "48px", fontWeight: "bold", marginBottom: "20px" }}>
          CTS v3.2 Dashboard
        </h1>
        <p style={{ fontSize: "18px", marginBottom: "30px", color: "#cbd5e1" }}>
          Crypto Trading System - Professional Multi-Strategy Platform
        </p>
        <a
          href="/"
          style={{
            display: "inline-block",
            backgroundColor: "#0ea5e9",
            color: "#fff",
            padding: "12px 32px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
            marginTop: "20px",
            marginRight: "10px"
          }}
        >
          Dashboard
        </a>
        <a
          href="/live-trading"
          style={{
            display: "inline-block",
            backgroundColor: "#10b981",
            color: "#fff",
            padding: "12px 32px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
            marginTop: "20px"
          }}
        >
          Launch Trading
        </a>
      </div>
    </div>
  )
}
