"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { DashboardActiveConnectionsManager } from "@/components/dashboard/dashboard-active-connections-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Activity, Zap } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export default function ModernDashboardPage() {
  const [systemStatus, setSystemStatus] = useState<{
    connectionsCount: number
    activeEngines: number
    lastUpdated: Date
  }>({
    connectionsCount: 0,
    activeEngines: 0,
    lastUpdated: new Date(),
  })

  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const loadSystemStatus = async () => {
      try {
        const res = await fetch("/api/settings/connections?enabled=true", {
          cache: "no-store",
        })
        if (res.ok) {
          const data = await res.json()
          const connections = Array.isArray(data) ? data : data?.connections || []
          setSystemStatus({
            connectionsCount: connections.length,
            activeEngines: connections.filter((c: any) => c.is_enabled_dashboard).length,
            lastUpdated: new Date(),
          })
        }
      } catch (error) {
        console.error("[v0] Failed to load system status:", error)
      }
    }

    loadSystemStatus()
    const interval = setInterval(loadSystemStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch("/api/settings/connections?enabled=true", {
        cache: "no-store",
      })
      if (res.ok) {
        const data = await res.json()
        const connections = Array.isArray(data) ? data : data?.connections || []
        setSystemStatus({
          connectionsCount: connections.length,
          activeEngines: connections.filter((c: any) => c.is_enabled_dashboard).length,
          lastUpdated: new Date(),
        })
      }
    } catch (error) {
      console.error("[v0] Failed to refresh:", error)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3">
            <Zap className="h-8 w-8 text-blue-600" />
            Modern Trading Dashboard
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Comprehensive connection management with advanced trading configuration
          </p>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Total Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                {systemStatus.connectionsCount}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {systemStatus.connectionsCount > 0
                  ? "Connections loaded from database"
                  : "No active connections"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Active Engines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {systemStatus.activeEngines}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Running trade engines
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Last Updated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {systemStatus.lastUpdated.toLocaleTimeString()}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Real-time data
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Dashboard Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Active Connections
            </h2>
            <Badge variant="secondary" className="text-sm">
              {systemStatus.connectionsCount} Total
            </Badge>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400">
          Manage your exchange connections, configure trading parameters, and monitor real-time activity.
          Each connection includes volume settings, order configuration, symbol management, and comprehensive
          trade settings for both Main and Preset trading modes.
        </p>

        {/* Modernized Dashboard Active Connections Manager */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <DashboardActiveConnectionsManager />
          </CardContent>
        </Card>

        {/* Features Overview */}
        <Card className="border-0 shadow-md bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Features Included
            </CardTitle>
            <CardDescription>
              Modern, comprehensive trading dashboard capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 dark:text-slate-50">Volume & Order Settings</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• Volume Factor sliders (Live & Preset)</li>
                  <li>• Order Type selection (Market/Limit)</li>
                  <li>• Volume Type (USDT/Contract)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 dark:text-slate-50">Trading Configuration</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• Main Trade configuration panel</li>
                  <li>• Preset Trade settings</li>
                  <li>• Position management controls</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 dark:text-slate-50">Symbol Management</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• Search and filter symbols</li>
                  <li>• Favorites and active status</li>
                  <li>• Real-time statistics</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 dark:text-slate-50">Comprehensive Settings</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• Indications (5 categories)</li>
                  <li>• Strategies (4 categories)</li>
                  <li>• Real-time performance metrics</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
