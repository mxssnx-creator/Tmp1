import type { Metadata } from "next"
import { Inter } from "next/font/google"
// @ts-expect-error CSS import not typed
import "@/app/globals.css"
import { Providers } from "@/components/providers"
import { ExchangeSelectorTop } from "@/components/exchange-selector-top"
import { AuthProvider } from "@/lib/auth-context"
import { ExchangeProvider } from "@/lib/exchange-context"
import { ConnectionStateProvider } from "@/lib/connection-state"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CTS v3.2 Dashboard",
  description: "Crypto Trading System Dashboard",
}

export const dynamic = "force-dynamic"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AuthProvider>
            <ExchangeProvider>
              <ConnectionStateProvider>
                <SidebarProvider>
                  <div className="flex h-screen overflow-hidden bg-background">
                    <AppSidebar />
                    <main className="flex-1 overflow-auto">
                      <ExchangeSelectorTop />
                      <div className="pt-0">
                        {children}
                      </div>
                    </main>
                  </div>
                  <Toaster />
                </SidebarProvider>
              </ConnectionStateProvider>
            </ExchangeProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
