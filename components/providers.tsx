"use client"

import type React from "react"
import { AuthProvider } from "@/lib/auth-context"
import { ExchangeProvider } from "@/lib/exchange-context"
import { ConnectionStateProvider } from "@/lib/connection-state"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <ExchangeProvider>
          <ConnectionStateProvider>
            <SidebarProvider>
              <div className="flex h-screen overflow-hidden bg-background">
                <AppSidebar />
                <main className="flex-1 overflow-auto p-6">
                  {children}
                </main>
              </div>
              <Toaster />
            </SidebarProvider>
          </ConnectionStateProvider>
        </ExchangeProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
