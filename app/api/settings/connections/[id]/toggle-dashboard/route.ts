import { type NextRequest, NextResponse } from "next/server"
import { initRedis, getConnection, updateConnection, setSettings, getSettings, getAllConnections } from "@/lib/redis-db"
import { toggleConnectionLimiter } from "@/lib/connection-rate-limiter"
import { logProgressionEvent } from "@/lib/engine-progression-logs"
import { isTruthyFlag, parseBooleanInput, toRedisFlag } from "@/lib/boolean-utils"

// POST toggle connection active status (inserted/enabled) - INDEPENDENT from Settings
// When enabling, also triggers engine start for this connection
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const connectionId = id
    const body = await request.json()
    
    // Check rate limit using systemwide limiter
    const limitResult = await toggleConnectionLimiter.checkLimit(connectionId)
    
    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          details: `Maximum 30 toggle requests per minute. Retry after ${limitResult.retryAfter} seconds.`,
          retryAfter: limitResult.retryAfter,
          resetTime: limitResult.resetTime,
        },
        { status: 429, headers: { "Retry-After": String(limitResult.retryAfter) } }
      )
    }
    
    // Support both active fields:
    // - is_active_inserted: whether connection appears in active list
    // - is_enabled_dashboard: whether connection is enabled/active
    const hasActiveInserted = body?.is_active_inserted !== undefined
    const hasDashboardEnabled = body?.is_enabled_dashboard !== undefined
    const isActiveInserted = parseBooleanInput(body?.is_active_inserted)
    const isDashboardEnabled = parseBooleanInput(body?.is_enabled_dashboard)

    await initRedis()
    let connection = await getConnection(connectionId)
    let resolvedId = connectionId

    // Fallback: try with conn- prefix if not found (handles predefined IDs like bybit-x03 → conn-bybit-x03)
    if (!connection && !connectionId.startsWith("conn-")) {
      const prefixedId = `conn-${connectionId}`
      console.log(`[v0] [Toggle] Not found with id=${connectionId}, trying conn- prefix: ${prefixedId}`)
      connection = await getConnection(prefixedId)
      if (connection) {
        resolvedId = prefixedId
        console.log(`[v0] [Toggle] Resolved to: ${resolvedId}`)
      }
    }

    if (!connection) {
      console.log(`[v0] [Toggle] Connection not found: ${connectionId} (also tried conn-${connectionId})`)
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    console.log(`[v0] [Toggle] Toggling ${connection.name} (${connectionId}):`)
    console.log(`[v0] [Toggle]   Before: is_active_inserted=${connection.is_active_inserted}, is_enabled_dashboard=${connection.is_enabled_dashboard}`)

    // Check current state before making changes
    const currentIsEnabled = isTruthyFlag(connection.is_enabled_dashboard)
    const currentIsActiveInserted = isTruthyFlag(connection.is_active_inserted)
    
    // Build update object with all necessary fields
    const updatedConnection = {
      ...connection,
      updated_at: new Date().toISOString(),
    }
    
    let engineAction: "start" | "stop" | null = null
    let stateChanged = false
    
    if (hasActiveInserted) {
      const newValue = toRedisFlag(isActiveInserted)
      if (updatedConnection.is_active_inserted !== newValue) {
        updatedConnection.is_active_inserted = newValue
        stateChanged = true
        console.log(`[v0] [Toggle]   Setting is_active_inserted=${isActiveInserted}`)
      }
    }
    
    if (hasDashboardEnabled) {
      const newDashboardValue = toRedisFlag(isDashboardEnabled)
      
      // Check if there's actually a state change needed
      if (currentIsEnabled !== isDashboardEnabled) {
        updatedConnection.is_enabled_dashboard = newDashboardValue
        updatedConnection.is_dashboard_inserted = "1"
        stateChanged = true
        
        if (isDashboardEnabled) {
          // Toggle ON: dashboard enabled, keep base settings independent
          updatedConnection.is_active_inserted = "1"
          updatedConnection.is_active = "1"
          engineAction = "start"
          console.log(`[v0] [Toggle] ENABLING: dashboard=1, active_inserted=1 (engine will process this connection)`)
        } else {
          // Toggle OFF: stop engine processing while preserving base settings state
          updatedConnection.is_active_inserted = updatedConnection.is_active_inserted || "1"
          updatedConnection.is_active = "0"
          engineAction = "stop"
          console.log(`[v0] [Toggle] DISABLING: dashboard=0, insertion preserved (engine will stop processing)`)
        }
      } else {
        // No change - already in requested state
        console.log(`[v0] [Toggle] NO CHANGE: already ${isDashboardEnabled ? 'enabled' : 'disabled'}`)
      }
    }

    // Save connection state only if something changed
    if (stateChanged || engineAction) {
      await updateConnection(resolvedId, updatedConnection)
      console.log(`[v0] [Toggle] Updated ${connection.name} (resolved id: ${resolvedId})`)
    } else {
      console.log(`[v0] [Toggle] No update needed - connection already in requested state`)
    }

    // Trigger engine action based on toggle state
    let engineStatus = "unchanged"
    if (engineAction === "start") {
      try {
        // Log progression event for UI feedback
        await logProgressionEvent(resolvedId, "toggle_enabled", "info", "Connection enabled via dashboard toggle", {
          connectionId: resolvedId,
          connectionName: connection.name,
          exchange: connection.exchange,
        })
        
        // Check if connection has valid credentials
         const apiKey = (updatedConnection.api_key || updatedConnection.apiKey || "") as string
         const apiSecret = (updatedConnection.api_secret || updatedConnection.apiSecret || "") as string
         const hasCredentials = apiKey.length > 10 && apiSecret.length > 10
        
        if (!hasCredentials) {
          // No credentials - set progression to waiting for credentials
          await setSettings(`engine_progression:${resolvedId}`, {
            phase: "waiting_credentials",
            progress: 5,
            detail: "Connection enabled but missing API credentials. Add credentials in Settings.",
            updated_at: new Date().toISOString(),
          })
          
          await logProgressionEvent(resolvedId, "waiting_credentials", "warning", 
            "Connection enabled but API credentials are missing", {
              connectionId: resolvedId,
              hint: "Add API key and secret in Settings to start trading",
            })
          
          engineStatus = "waiting_credentials"
          console.log(`[v0] [Toggle] Connection enabled but missing credentials: ${connection.name}`)
        } else {
          // Has credentials - update engine progression phase to show initializing
          await setSettings(`engine_progression:${resolvedId}`, {
            phase: "initializing",
            progress: 10,
            detail: "Connection enabled - engine starting...",
            updated_at: new Date().toISOString(),
          })
          
          // Update global engine state to trigger coordinator
          const globalState = await getSettings("trade_engine:global") || {}
          const allConnections = await getAllConnections()
          const activeDashboardCount = allConnections.filter((c: any) => {
            const isCurrent = c.id === resolvedId
            if (isCurrent) return true
            return isTruthyFlag(c.is_enabled_dashboard)
          }).length
          await setSettings("trade_engine:global", {
            ...globalState,
            status: "running",
            started_at: globalState.started_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            active_connections: activeDashboardCount,
            refresh_requested: new Date().toISOString(), // Signal coordinator to refresh
          })
          
          // Signal the coordinator to refresh engines by setting a refresh flag
          await setSettings("engine_coordinator:refresh_requested", {
            timestamp: new Date().toISOString(),
            connectionId: resolvedId,
            action: "start",
          })
          
          engineStatus = "started"
          console.log(`[v0] [Toggle] Engine progression initialized for ${connection.name}`)
        }
      } catch (engineError) {
        console.error(`[v0] [Toggle] Failed to initialize engine:`, engineError)
        engineStatus = "error"
        
        await logProgressionEvent(resolvedId, "toggle_error", "error", "Failed to start engine after toggle", {
          error: engineError instanceof Error ? engineError.message : String(engineError),
        })
      }
    } else if (engineAction === "stop") {
      try {
        // Log progression event for UI feedback
        await logProgressionEvent(resolvedId, "toggle_disabled", "info", "Connection disabled via dashboard toggle", {
          connectionId: resolvedId,
          connectionName: connection.name,
        })
        
        // Update engine progression phase to show stopped
        await setSettings(`engine_progression:${resolvedId}`, {
          phase: "idle",
          progress: 0,
          detail: "Connection disabled",
          updated_at: new Date().toISOString(),
        })
        
        // Update global engine state
        const globalState = await getSettings("trade_engine:global") || {}
        const allConnections = await getAllConnections()
        const activeCount = allConnections.filter((c: any) => {
          const isCurrent = c.id === resolvedId
          if (isCurrent) return false
          return isTruthyFlag(c.is_enabled_dashboard)
        }).length
        await setSettings("trade_engine:global", {
          ...globalState,
          updated_at: new Date().toISOString(),
          active_connections: activeCount,
          status: activeCount > 0 ? "running" : "idle",
          refresh_requested: new Date().toISOString(),
        })
        
        // Signal the coordinator to refresh engines
        await setSettings("engine_coordinator:refresh_requested", {
          timestamp: new Date().toISOString(),
          connectionId: resolvedId,
          action: "stop",
        })
        
        engineStatus = "stopped"
        console.log(`[v0] [Toggle] Engine stopped for ${connection.name}`)
      } catch (engineError) {
        console.error(`[v0] [Toggle] Failed to stop engine:`, engineError)
        engineStatus = "error"
      }
    }

    return NextResponse.json({
      success: true,
      connection: {
        id: resolvedId,
        name: connection.name,
        exchange: connection.exchange,
        is_active_inserted: updatedConnection.is_active_inserted,
        is_enabled_dashboard: updatedConnection.is_enabled_dashboard,
        is_enabled: updatedConnection.is_enabled,
        is_inserted: updatedConnection.is_inserted,
      },
      engine: {
        action: engineAction,
        status: engineStatus,
      },
      progressionUrl: `/api/connections/progression/${resolvedId}`,
    })
  } catch (error) {
    console.error(`[v0] [Toggle] Error:`, error)
    return NextResponse.json(
      { error: "Failed to update active status", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
