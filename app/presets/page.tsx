"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PresetCardCompact } from "@/components/presets/preset-card-compact"
import { Plus, RefreshCw, Download, BarChart3 } from "lucide-react"
import { toast } from "@/lib/simple-toast"

interface PresetTemplate {
  id: string
  name: string
  description: string
  strategyType: string
  symbol: string
  enabled: boolean
  config: {
    tp: number
    sl: number
    leverage: number
    volume: number
  }
  stats: {
    winRate: number
    avgProfit: number
    successCount: number
  }
}

const mockPresets: PresetTemplate[] = [
  {
    id: "p1",
    name: "Bitcoin Momentum Long",
    description: "Aggressive momentum strategy for BTC",
    strategyType: "Momentum",
    symbol: "BTCUSDT",
    enabled: true,
    config: { tp: 8, sl: 0.5, leverage: 5, volume: 0.5 },
    stats: { winRate: 72, avgProfit: 3.2, successCount: 45 },
  },
  {
    id: "p2",
    name: "Ethereum Trend Follower",
    description: "Conservative trend-following for ETH",
    strategyType: "Trend",
    symbol: "ETHUSDT",
    enabled: true,
    config: { tp: 6, sl: 0.75, leverage: 3, volume: 0.75 },
    stats: { winRate: 68, avgProfit: 2.1, successCount: 38 },
  },
  {
    id: "p3",
    name: "Solana Volatility",
    description: "High volatility trading on SOL",
    strategyType: "Volatility",
    symbol: "SOLUSDT",
    enabled: false,
    config: { tp: 10, sl: 1, leverage: 10, volume: 0.25 },
    stats: { winRate: 55, avgProfit: 4.5, successCount: 22 },
  },
  {
    id: "p4",
    name: "Mean Reversion Multi",
    description: "Mean reversion across multiple pairs",
    strategyType: "Mean Reversion",
    symbol: "MULTI",
    enabled: true,
    config: { tp: 4, sl: 1.5, leverage: 2, volume: 1 },
    stats: { winRate: 65, avgProfit: 1.8, successCount: 52 },
  },
  {
    id: "p5",
    name: "Scalping Strategy",
    description: "High-frequency scalping template",
    strategyType: "Momentum",
    symbol: "BTCUSDT",
    enabled: false,
    config: { tp: 2, sl: 0.25, leverage: 20, volume: 0.1 },
    stats: { winRate: 58, avgProfit: 0.8, successCount: 120 },
  },
]

export default function PresetsPage() {
  const [presets, setPresets] = useState<PresetTemplate[]>(mockPresets)
  const [sortBy, setSortBy] = useState<"name" | "profit" | "winrate">("profit")
  const [filterType, setFilterType] = useState<string | null>(null)

  const strategyTypes = Array.from(new Set(presets.map((p) => p.strategyType)))

  const filteredAndSorted = useMemo(() => {
    let result = [...presets]

    if (filterType) {
      result = result.filter((p) => p.strategyType === filterType)
    }

    switch (sortBy) {
      case "profit":
        result.sort((a, b) => b.stats.avgProfit - a.stats.avgProfit)
        break
      case "winrate":
        result.sort((a, b) => b.stats.winRate - a.stats.winRate)
        break
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return result
  }, [presets, sortBy, filterType])

  const stats = useMemo(() => {
    const total = presets.length
    const enabled = presets.filter((p) => p.enabled).length
    const avgProfit = presets.reduce((sum, p) => sum + p.stats.avgProfit, 0) / total
    const avgWinRate = presets.reduce((sum, p) => sum + p.stats.winRate, 0) / total

    return { total, enabled, avgProfit, avgWinRate }
  }, [presets])

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trading Presets</h1>
          <p className="text-xs text-slate-400 mt-1">Pre-configured strategy templates</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="h-8 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            New Preset
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "Total", value: stats.total, color: "text-blue-400" },
          { label: "Enabled", value: stats.enabled, color: "text-green-400" },
          { label: "Avg Profit", value: stats.avgProfit.toFixed(2) + "%", color: stats.avgProfit > 0 ? "text-green-400" : "text-red-400" },
          { label: "Avg WR", value: stats.avgWinRate.toFixed(0) + "%", color: "text-cyan-400" },
        ].map((stat) => (
          <Card key={stat.label} className="border-slate-700/50 bg-slate-900/30">
            <CardContent className="p-2">
              <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between text-xs px-3 py-2 bg-slate-900/30 rounded border border-slate-700/50">
        <div className="flex gap-1">
          <Button
            variant={filterType === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType(null)}
            className="h-7 text-xs"
          >
            All ({presets.length})
          </Button>
          {strategyTypes.map((type) => (
            <Button
              key={type}
              variant={filterType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(type)}
              className="h-7 text-xs"
            >
              {type} ({presets.filter((p) => p.strategyType === type).length})
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          <Button
            variant={sortBy === "profit" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("profit")}
            className="h-7 text-xs"
          >
            Profit
          </Button>
          <Button
            variant={sortBy === "winrate" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("winrate")}
            className="h-7 text-xs"
          >
            Win Rate
          </Button>
          <Button
            variant={sortBy === "name" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("name")}
            className="h-7 text-xs"
          >
            Name
          </Button>
        </div>
      </div>

      {/* Presets list */}
      <div className="space-y-1.5 max-h-[calc(100vh-300px)] overflow-y-auto">
        {filteredAndSorted.length > 0 ? (
          filteredAndSorted.map((preset) => (
            <PresetCardCompact
              key={preset.id}
              preset={preset}
              onToggle={(id, enabled) => {
                setPresets((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)))
              }}
              onStart={(id) => {
                toast.success("Preset started")
              }}
              onDelete={(id) => {
                setPresets((prev) => prev.filter((p) => p.id !== id))
                toast.success("Preset deleted")
              }}
              onDuplicate={(id) => {
                const preset = presets.find((p) => p.id === id)
                if (preset) {
                  setPresets((prev) => [...prev, { ...preset, id: `${preset.id}-copy`, name: `${preset.name} (Copy)` }])
                  toast.success("Preset duplicated")
                }
              }}
            />
          ))
        ) : (
          <div className="text-center py-12 text-slate-500">
            <div className="text-sm">No presets found</div>
          </div>
        )}
      </div>
    </div>
  )
}
