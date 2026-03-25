"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, Zap, Check } from "lucide-react"
import { useExchange } from "@/lib/exchange-context"

interface Connection {
  id: string
  name: string
  exchange: string
  isReal: boolean
  apiKey?: string
  status: "connected" | "disconnected" | "error"
}

export function ExchangeSelectorTop() {
  const { selectedExchange, selectedConnectionId, setSelectedConnectionId, activeConnections } = useExchange()
  const [connections, setConnections] = useState<Connection[]>([
    {
      id: "demo",
      name: "Demo Mode",
      exchange: "Demo",
      isReal: false,
      status: "connected",
    },
  ])
  const [isOpen, setIsOpen] = useState(false)

  // Load real connections from API
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const response = await fetch("/api/settings/connections")
        if (response.ok) {
          const data = await response.json()
          const realConnections: Connection[] = (data.connections || []).map((c: any) => ({
            id: c.id,
            name: c.name || c.exchange,
            exchange: c.exchange,
            isReal: true,
            status: c.is_enabled ? "connected" : "disconnected",
          }))
          setConnections([
            {
              id: "demo",
              name: "Demo Mode",
              exchange: "Demo",
              isReal: false,
              status: "connected",
            },
            ...realConnections,
          ])
        }
      } catch (error) {
        console.error("Failed to load connections:", error)
      }
    }

    loadConnections()
  }, [])

  const currentConnection = connections.find((c) => c.id === selectedConnectionId) || connections[0]

  const handleSelectConnection = (id: string) => {
    setSelectedConnectionId(id)
    setIsOpen(false)
  }

  return (
    <div className="sticky top-0 z-50 bg-slate-900/95 border-b border-slate-700/50 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        {/* Left side - Logo/Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
            CTS v3
          </div>
          <div className="hidden sm:block h-4 w-px bg-slate-700"></div>
        </div>

        {/* Center - Exchange/Connection Selector */}
        <div className="flex-1 flex items-center justify-center max-w-sm mx-4">
          <Select value={selectedConnectionId || "demo"} onValueChange={handleSelectConnection}>
            <SelectTrigger className="w-full h-8 text-xs border-slate-700/50 bg-slate-800/50 hover:bg-slate-700/50">
              <div className="flex items-center gap-2 w-full">
                {currentConnection.isReal ? (
                  <Zap className="h-3 w-3 text-yellow-400 flex-shrink-0" />
                ) : (
                  <div className="h-3 w-3 rounded-full bg-green-500 flex-shrink-0"></div>
                )}
                <SelectValue placeholder="Select connection" />
                {currentConnection.status === "connected" && (
                  <Check className="h-3 w-3 text-green-400 ml-auto flex-shrink-0" />
                )}
              </div>
            </SelectTrigger>
            <SelectContent className="min-w-[200px]">
              {connections.map((conn) => (
                <SelectItem key={conn.id} value={conn.id} className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    {conn.isReal ? (
                      <Zap className="h-3 w-3 text-yellow-400" />
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    )}
                    <span>{conn.name}</span>
                    {conn.isReal && (
                      <Badge className="ml-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-1.5 py-0 h-4">
                        REAL
                      </Badge>
                    )}
                    {!conn.isReal && (
                      <Badge className="ml-2 bg-green-500/20 text-green-300 border border-green-500/30 text-xs px-1.5 py-0 h-4">
                        MOCK
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right side - Status and quick actions */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="hidden sm:flex items-center gap-2 text-xs">
            {currentConnection.isReal && (
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></div>
                <span className="text-amber-200">Live</span>
              </div>
            )}
            {!currentConnection.isReal && (
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 border border-green-500/20">
                <div className="h-2 w-2 rounded-full bg-green-400"></div>
                <span className="text-green-200">Demo</span>
              </div>
            )}
          </div>

          {/* Info badge */}
          {currentConnection.isReal && (
            <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-1.5 py-0 h-5">
              {currentConnection.exchange}
            </Badge>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-1 text-xs text-slate-400 border-t border-slate-700/30">
        {currentConnection.isReal ? (
          <span>
            🔗 Connected to <span className="font-semibold text-slate-200">{currentConnection.name}</span> - All pages will display REAL data from this exchange
          </span>
        ) : (
          <span>
            📊 Demo Mode Active - All pages displaying MOCK data for testing and learning
          </span>
        )}
      </div>
    </div>
  )
}
