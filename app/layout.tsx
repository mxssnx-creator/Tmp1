import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { ExchangeProvider } from "@/lib/exchange-context"
import { ConnectionStateProvider } from "@/lib/connection-state"
import { SidebarProvider } from "@/components/ui/sidebar"

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
        <AuthProvider>
          <ConnectionStateProvider>
            <ExchangeProvider>
              <SidebarProvider defaultOpen={true}>
                <main className="min-h-screen">{children}</main>
              </SidebarProvider>
            </ExchangeProvider>
          </ConnectionStateProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
