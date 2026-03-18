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
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-white">
        <main className="flex items-center justify-center min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}