import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { ExchangeProvider } from "@/lib/exchange-context"
import { ConnectionStateProvider } from "@/lib/connection-state"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/sonner"
import { ErrorBoundary } from "@/components/error-boundary"

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <ErrorBoundary>
          <AuthProvider>
            <ConnectionStateProvider>
              <ExchangeProvider>
                <SidebarProvider defaultOpen={true}>
                  <AppSidebar />
                  <SidebarInset>
                    {children}
                  </SidebarInset>
                </SidebarProvider>
              </ExchangeProvider>
            </ConnectionStateProvider>
          </AuthProvider>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  )
}
