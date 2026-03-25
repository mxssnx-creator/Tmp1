"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IndicationRowCompact } from "@/components/indications/indication-row-compact"
import { IndicationFiltersAdvanced } from "@/components/indications/indication-filters-advanced"
import { Activity, TrendingUp, Zap, RefreshCw, Download, BarChart3 } from "lucide-react"
import { toast } from "@/lib/simple-toast"
import { useExchange } from "@/lib/exchange-context"

interface Indication {
  id: string
  symbol: string
  indicationType: string
  direction: "UP" | "DOWN" | "NEUTRAL"
  confidence: number
  strength: number
  timestamp: string
  enabled: boolean
  metadata?: {
    macdValue?: number
    rsiValue?: number
    maValue?: number
    bbUpper?: number
    bbLower?: number
    volatility?: number
  }
}

interface AdvancedFiltersInd {
  symbols: string[]
  symbolInput: string
  indicationTypes: string[]
  directions: string[]
  confidenceRange: [number, number]
  strengthRange: [number, number]
  timeRange: [number, number]
  enabledOnly: boolean
  sortBy: "confidence" | "strength" | "recent"
}

const initialFilters: AdvancedFiltersInd = {
  symbols: [],
  symbolInput: "",
  indicationTypes: [],
  directions: [],
  confidenceRange: [0, 100],
  strengthRange: [0, 100],
  timeRange: [0, 60],
  enabledOnly: false,
  sortBy: "confidence",
}

// Generate mock indications data
function generateMockIndications(): Indication[] {
  const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "AAPL", "EURUSD", "XAUUSD"]
  const types = ["Momentum", "Volatility", "Trend", "Mean Reversion", "Volume"]
  const directions: ("UP" | "DOWN" | "NEUTRAL")[] = ["UP", "DOWN", "NEUTRAL"]

  return Array.from({ length: 200 }, (_, i) => {
    const now = new Date()
    const minutesAgo = Math.floor(Math.random() * 60)
    const timestamp = new Date(now.getTime() - minutesAgo * 60000).toISOString()

    return {
      id: `ind-${i}`,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      indicationType: types[Math.floor(Math.random() * types.length)],
      direction: directions[Math.floor(Math.random() * directions.length)],
      confidence: 30 + Math.random() * 70,
      strength: Math.random() * 100,
      timestamp,
      enabled: Math.random() > 0.3,
      metadata: {
        rsiValue: 30 + Math.random() * 40,
        macdValue: (Math.random() - 0.5) * 0.01,
        volatility: 15 + Math.random() * 30,
      },
    }
  })
}

export default function IndicationsPage() {
  const { selectedExchange } = useExchange()
  const [indications, setIndications] = useState<Indication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<AdvancedFiltersInd>(initialFilters)

  // Load indications on mount
  useEffect(() => {
    setIsLoading(true)
    try {
      const mockIndications = generateMockIndications()
      setIndications(mockIndications)
    } catch (error) {
      console.error("Failed to load indications:", error)
      toast.error("Failed to load indications")
    } finally {
      setIsLoading(false)
    }
  }, [selectedExchange])

  // Apply filters and sorting with memoization
  const filteredAndSortedIndications = useMemo(() => {
    let result = [...indications]

    // Apply filters
    result = result.filter((ind) => {
      // Symbol filter
      if (filters.symbols.length > 0 && !filters.symbols.includes(ind.symbol)) return false

      // Type filter
      if (filters.indicationTypes.length > 0 && !filters.indicationTypes.includes(ind.indicationType)) return false

      // Direction filter
      if (filters.directions.length > 0 && !filters.directions.includes(ind.direction)) return false

      // Confidence range
      if (ind.confidence < filters.confidenceRange[0] || ind.confidence > filters.confidenceRange[1]) return false

      // Strength range
      if (ind.strength < filters.strengthRange[0] || ind.strength > filters.strengthRange[1]) return false

      // Time range (minutes)
      const minutesOld = (Date.now() - new Date(ind.timestamp).getTime()) / (1000 * 60)
      if (minutesOld > filters.timeRange[1]) return false

      // Enabled only
      if (filters.enabledOnly && !ind.enabled) return false

      return true
    })

    // Apply sorting
    switch (filters.sortBy) {
      case "confidence":
        result.sort((a, b) => b.confidence - a.confidence)
        break
      case "strength":
        result.sort((a, b) => b.strength - a.strength)
        break
      case "recent":
        result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        break
    }

    return result
  }, [indications, filters])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = indications.length
    const enabled = indications.filter((i) => i.enabled).length
    const upSignals = indications.filter((i) => i.direction === "UP").length
    const highConfidence = indications.filter((i) => i.confidence >= 70).length
    const avgConfidence = total > 0 ? indications.reduce((sum, i) => sum + i.confidence, 0) / total : 0

    return { total, enabled, upSignals, highConfidence, avgConfidence }
  }, [indications])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border border-slate-600 border-t-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading indications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Indications</h1>
          <p className="text-xs text-slate-400 mt-1">Trading signals with confidence and strength metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="h-8 text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats cards - compact */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { icon: BarChart3, label: "Total", value: stats.total, color: "text-blue-400" },
          { icon: Activity, label: "Enabled", value: stats.enabled, color: "text-green-400" },
          { icon: TrendingUp, label: "Bullish", value: stats.upSignals, color: "text-orange-400" },
          { icon: Zap, label: "High Conf", value: stats.highConfidence, color: "text-yellow-400" },
          { icon: Activity, label: "Avg Conf", value: stats.avgConfidence.toFixed(1) + "%", color: "text-cyan-400" },
        ].map((stat) => (
          <Card key={stat.label} className="border-slate-700/50 bg-slate-900/30">
            <CardContent className="p-2">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-3 w-3 ${stat.color}`} />
                <div className="min-w-0">
                  <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content - filters and results */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Filters sidebar */}
        <div className="lg:col-span-1">
          <IndicationFiltersAdvanced filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Results */}
        <div className="lg:col-span-4 space-y-3">
          {/* Results header */}
          <div className="flex items-center justify-between text-xs px-3 py-2 bg-slate-900/30 rounded border border-slate-700/50">
            <div className="text-slate-400">
              Showing <span className="font-semibold text-cyan-400">{filteredAndSortedIndications.length}</span> of <span className="font-semibold">{indications.length}</span> indications
            </div>
            <div className="text-slate-500">
              {filters.sortBy === "recent" && "Sorted by: Most Recent"}
              {filters.sortBy === "confidence" && "Sorted by: Confidence"}
              {filters.sortBy === "strength" && "Sorted by: Strength"}
            </div>
          </div>

          {/* Results list */}
          <div className="space-y-1.5 max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredAndSortedIndications.length > 0 ? (
              filteredAndSortedIndications.map((indication, index) => (
                <IndicationRowCompact
                  key={indication.id}
                  indication={indication}
                  onToggle={(id, enabled) => {
                    setIndications((prev) =>
                      prev.map((ind) => (ind.id === id ? { ...ind, enabled } : ind))
                    )
                    toast.success(`Indication ${enabled ? "enabled" : "disabled"}`)
                  }}
                  index={index}
                />
              ))
            ) : (
              <div className="text-center py-12 text-slate-500">
                <div className="text-sm mb-2">No indications match your filters</div>
                <Button variant="outline" size="sm" onClick={() => setFilters(initialFilters)} className="text-xs h-7">
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
