"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PositionRowCompact } from "@/components/live-trading/position-row-compact"
import { Activity, TrendingUp, TrendingDown, RefreshCw, Play, Pause, AlertCircle, BarChart3 } from "lucide-react"
import { toast } from "@/lib/simple-toast"
import { useExchange } from "@/lib/exchange-context"

interface Position {
  id: string
  symbol: string
  side: "LONG" | "SHORT"
  entryPrice: number
  currentPrice: number
  quantity: number
  leverage: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  takeProfitPrice?: number
  stopLossPrice?: number
  createdAt: string
  status: "open" | "closing" | "closed"
}

// Generate mock positions for demo
function generateMockPositions(count: number = 20): Position[] {
  const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "ADAUSDT"]
  const now = Date.now()

  return Array.from({ length: count }, (_, i) => {
    const symbol = symbols[i % symbols.length]
    const entryPrice = 40000 + Math.random() * 20000
    const currentPrice = entryPrice * (1 + (Math.random() - 0.5) * 0.05)
    const quantity = 0.1 + Math.random() * 1
    const leverage = Math.floor(1 + Math.random() * 20)
    const pnl = (currentPrice - entryPrice) * quantity * leverage
    const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100

    return {
      id: `pos-${i}`,
      symbol,
      side: Math.random() > 0.5 ? "LONG" : "SHORT",
      entryPrice,
      currentPrice,
      quantity,
      leverage,
      unrealizedPnl: pnl,
      unrealizedPnlPercent: pnlPercent,
      takeProfitPrice: entryPrice * 1.05,
      stopLossPrice: entryPrice * 0.95,
      createdAt: new Date(now - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      status: "open",
    }
  })
}

export default function LiveTradingPage() {
  const { selectedExchange } = useExchange()
  const [positions, setPositions] = useState<Position[]>([])
  const [isEngineRunning, setIsEngineRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"pnl" | "entry" | "time">("pnl")
  const [filterSide, setFilterSide] = useState<"all" | "long" | "short">("all")

  // Load positions on mount
  useEffect(() => {
    setIsLoading(true)
    try {
      const mockPositions = generateMockPositions(25)
      setPositions(mockPositions)
    } catch (error) {
      console.error("Failed to load positions:", error)
      toast.error("Failed to load positions")
    } finally {
      setIsLoading(false)
    }
  }, [selectedExchange])

  // Simulate real-time price updates
  useEffect(() => {
    if (!isEngineRunning) return

    const interval = setInterval(() => {
      setPositions((prev) =>
        prev.map((pos) => {
          const priceChange = (Math.random() - 0.5) * 50
          const newPrice = Math.max(1, pos.currentPrice + priceChange)
          const newPnl = (newPrice - pos.entryPrice) * pos.quantity * pos.leverage
          const newPnlPercent = ((newPrice - pos.entryPrice) / pos.entryPrice) * 100

          return {
            ...pos,
            currentPrice: newPrice,
            unrealizedPnl: newPnl,
            unrealizedPnlPercent: newPnlPercent,
          }
        })
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [isEngineRunning])

  // Apply filters and sorting
  const filteredAndSortedPositions = useMemo(() => {
    let result = [...positions]

    // Filter by side
    if (filterSide !== "all") {
      result = result.filter((p) => p.side.toLowerCase() === filterSide)
    }

    // Sort
    switch (sortBy) {
      case "pnl":
        result.sort((a, b) => b.unrealizedPnl - a.unrealizedPnl)
        break
      case "entry":
        result.sort((a, b) => b.entryPrice - a.entryPrice)
        break
      case "time":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }

    return result
  }, [positions, sortBy, filterSide])

  // Calculate stats
  const stats = useMemo(() => {
    const total = positions.length
    const longs = positions.filter((p) => p.side === "LONG").length
    const shorts = positions.filter((p) => p.side === "SHORT").length
    const totalPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0)
    const profitablePositions = positions.filter((p) => p.unrealizedPnl > 0).length
    const totalCapital = positions.reduce((sum, p) => sum + p.entryPrice * p.quantity, 0)

    return { total, longs, shorts, totalPnl, profitablePositions, totalCapital }
  }, [positions])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border border-slate-600 border-t-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading positions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Trading</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time position monitoring and management</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isEngineRunning ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEngineRunning(!isEngineRunning)}
            className="h-8 text-xs"
          >
            {isEngineRunning ? (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Stop Simulation
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Start Simulation
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="h-8 text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Engine status */}
      {isEngineRunning && (
        <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
          <div className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-green-400 animate-pulse flex-shrink-0" />
            <span className="text-green-200">Live trading engine running - prices updating in real-time</span>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {[
          { icon: BarChart3, label: "Open", value: stats.total, color: "text-blue-400" },
          { icon: TrendingUp, label: "Long", value: stats.longs, color: "text-green-400" },
          { icon: TrendingDown, label: "Short", value: stats.shorts, color: "text-red-400" },
          { icon: Activity, label: "Profitable", value: stats.profitablePositions, color: "text-yellow-400" },
          { icon: AlertCircle, label: "Total PnL", value: stats.totalPnl.toFixed(2) + " USDT", color: stats.totalPnl >= 0 ? "text-green-400" : "text-red-400" },
          { icon: BarChart3, label: "Capital", value: "$" + (stats.totalCapital / 1000).toFixed(0) + "k", color: "text-cyan-400" },
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

      {/* Filters and controls */}
      <div className="flex items-center justify-between text-xs px-3 py-2 bg-slate-900/30 rounded border border-slate-700/50">
        <div className="text-slate-400">
          Showing <span className="font-semibold text-cyan-400">{filteredAndSortedPositions.length}</span> positions
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            <Button
              variant={filterSide === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterSide("all")}
              className="h-7 text-xs"
            >
              All
            </Button>
            <Button
              variant={filterSide === "long" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterSide("long")}
              className="h-7 text-xs"
            >
              Long
            </Button>
            <Button
              variant={filterSide === "short" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterSide("short")}
              className="h-7 text-xs"
            >
              Short
            </Button>
          </div>
          <div className="border-l border-slate-700 pl-2 flex gap-1">
            <Button
              variant={sortBy === "pnl" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("pnl")}
              className="h-7 text-xs"
            >
              PnL
            </Button>
            <Button
              variant={sortBy === "entry" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("entry")}
              className="h-7 text-xs"
            >
              Entry
            </Button>
            <Button
              variant={sortBy === "time" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("time")}
              className="h-7 text-xs"
            >
              Time
            </Button>
          </div>
        </div>
      </div>

      {/* Positions list */}
      <div className="space-y-1.5 max-h-[calc(100vh-350px)] overflow-y-auto">
        {filteredAndSortedPositions.length > 0 ? (
          filteredAndSortedPositions.map((position, index) => (
            <PositionRowCompact
              key={position.id}
              position={position}
              onClose={(id) => {
                setPositions((prev) => prev.filter((p) => p.id !== id))
                toast.success("Position closed")
              }}
              onModify={(id) => {
                toast.info("Position modification UI would open here")
              }}
              index={index}
            />
          ))
        ) : (
          <div className="text-center py-12 text-slate-500">
            <div className="text-sm">No positions found</div>
          </div>
        )}
      </div>
    </div>
  )
}
