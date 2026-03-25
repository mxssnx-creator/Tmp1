"use client"

import { useExchange } from "@/lib/exchange-context"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Zap, Database, Clock } from "lucide-react"

interface Connection {
  id: string
  name: string
  exchange: string
  isReal: boolean
  status: "connected" | "disconnected" | "error"
  createdAt?: string
  lastUsed?: string
}

export function ConnectionSettingsHeader() {
  const { selectedConnectionId, setSelectedConnectionId, activeConnections } = useExchange()
  const [connections, setConnections] = useState<Connection[]>([
    {
      id: "demo",
      name: "Demo Mode",
      exchange: "Demo",
      isReal: false,
      status: "connected",
    },
  ])
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)

  // Load connections
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
            createdAt: c.created_at,
            lastUsed: c.last_used,
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

  // Update selected connection when ID changes
  useEffect(() => {
    const current = connections.find((c) => c.id === selectedConnectionId) || connections[0]
    setSelectedConnection(current)
  }, [selectedConnectionId, connections])

  const handleConnectionChange = (id: string) => {
    setSelectedConnectionId(id)
  }

  if (!selectedConnection) return null

  return (
    <div className="space-y-3 mb-6">
      {/* Connection selector card */}
      <Card className="border-slate-700/50 bg-slate-900/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {selectedConnection.isReal ? (
              <Zap className="h-4 w-4 text-yellow-400" />
            ) : (
              <Database className="h-4 w-4 text-green-400" />
            )}
            Active Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Current connection display */}
          <div className="flex items-center justify-between p-3 rounded bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <div className="font-semibold text-sm text-slate-200">{selectedConnection.name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  {selectedConnection.isReal ? (
                    <>
                      <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-1.5 py-0 h-4">
                        REAL CONNECTION
                      </Badge>
                      <span>📡 Live data from {selectedConnection.exchange}</span>
                    </>
                  ) : (
                    <>
                      <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 text-xs px-1.5 py-0 h-4">
                        DEMO MODE
                      </Badge>
                      <span>📊 Using mock data for testing</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Badge
              className={`${
                selectedConnection.status === "connected"
                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                  : "bg-red-500/20 text-red-300 border-red-500/30"
              } border text-xs px-2 py-1`}
            >
              {selectedConnection.status === "connected" ? "✓ Connected" : "✗ Disconnected"}
            </Badge>
          </div>

          {/* Connection selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">Switch Connection:</label>
            <Select value={selectedConnectionId || "demo"} onValueChange={handleConnectionChange}>
              <SelectTrigger className="h-9 text-xs border-slate-700/50 bg-slate-800/50">
                <SelectValue placeholder="Select connection" />
              </SelectTrigger>
              <SelectContent>
                {connections.map((conn) => (
                  <SelectItem key={conn.id} value={conn.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      {conn.isReal ? (
                        <Zap className="h-3 w-3 text-yellow-400" />
                      ) : (
                        <Database className="h-3 w-3 text-green-400" />
                      )}
                      <span>{conn.name}</span>
                      {conn.isReal && (
                        <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-1.5 py-0 h-4 ml-1">
                          REAL
                        </Badge>
                      )}
                      {!conn.isReal && (
                        <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 text-xs px-1.5 py-0 h-4 ml-1">
                          DEMO
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info box */}
          {selectedConnection.isReal && (
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex gap-2">
              <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span>
                ⚠️ LIVE CONNECTION ACTIVE - All settings and configurations will affect real trading. Use with caution!
              </span>
            </div>
          )}

          {!selectedConnection.isReal && (
            <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 flex gap-2">
              <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span>ℹ️ DEMO MODE - All data and operations are simulated. Safe for testing and learning.</span>
            </div>
          )}

          {/* Metadata */}
          {selectedConnection.isReal && selectedConnection.createdAt && (
            <div className="text-xs text-slate-500 flex items-center gap-2 pt-2 border-t border-slate-700/50">
              <Clock className="h-3 w-3" />
              <span>Created: {new Date(selectedConnection.createdAt).toLocaleDateString()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings scope notice */}
      <div className="p-3 rounded bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300">
        <p className="font-semibold mb-1">ℹ️ Settings Scope</p>
        <p className="text-slate-400">
          Each connection has its own isolated settings. Changes here only affect the <strong>{selectedConnection.name}</strong> connection.
          Switch connections to configure different settings for each.
        </p>
      </div>
    </div>
  )
}
