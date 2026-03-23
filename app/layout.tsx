import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "CTS v3 - Crypto Trading System",
  description: "Advanced crypto trading system",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning style={{ height: "100%" }}>
      <body style={{ height: "100%", margin: "0", padding: "0", overflow: "auto", backgroundColor: "#fff" }}>
        {children}
      </body>
    </html>
  )
}
