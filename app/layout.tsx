import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/app/globals.css"
import { Providers } from "@/components/providers"
import { ExchangeSelectorTop } from "@/components/exchange-selector-top"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CTS v3.2 Dashboard",
  description: "Crypto Trading System Dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ExchangeSelectorTop />
          <div className="pt-[120px]">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
