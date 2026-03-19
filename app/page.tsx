"use client"

import { Dashboard } from "@/components/dashboard/dashboard"
import { PageHeader } from "@/components/page-header"

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="CTS v3 - Crypto Trading System"
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Dashboard />
      </div>
    </>
  )
}
