import { NextResponse } from "next/server"
import { initRedis, getAllConnections, getConnectionPositions, getConnectionTrades, getRedisClient } from "@/lib/redis-db"
import { ProgressionStateManager } from "@/lib/progression-state-manager"
import { getProgressionLogs } from "@/lib/engine-progression-logs"

function mapPhaseToType(phase: string) {
  if (phase.includes("indication")) return "indication"
  if (phase.includes("strategy")) return "strategy"
  if (phase.includes("position")) return "position"
  if (phase.includes("error")) return "error"
  return "engine"
}

function isTruthy(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true"
}

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    await initRedis()
    const { searchParams } = new URL(request.url)
    const selectedConnectionId = searchParams.get("connectionId")
    const selectedExchange = (searchParams.get("exchange") || "").toLowerCase()

    const allConnections = await getAllConnections()
    let activeConnections = allConnections.filter((c: any) => {
      const exch = (c.exchange || "").toLowerCase()
      const isBase = ["bingx", "bybit", "pionex", "orangex"].includes(exch)
      return isBase || isTruthy(c.is_dashboard_inserted) || isTruthy(c.is_active_inserted) || isTruthy(c.is_enabled_dashboard)
    })

    if (selectedConnectionId) {
      activeConnections = activeConnections.filter((c: any) => c.id === selectedConnectionId)
    } else if (selectedExchange) {
      activeConnections = activeConnections.filter((c: any) => (c.exchange || "").toLowerCase() === selectedExchange)
    }

    const progressionStates = await Promise.all(
      activeConnections.map((c: any) => ProgressionStateManager.getProgressionState(c.id))
    )

    const logsByConnection = await Promise.all(
      activeConnections.map((c: any) => getProgressionLogs(c.id))
    )

    const globalLogs = await getProgressionLogs("global")

    const positionsByConnection = await Promise.all(
      activeConnections.map((c: any) => getConnectionPositions(c.id))
    )

    const tradesByConnection = await Promise.all(
      activeConnections.map((c: any) => getConnectionTrades(c.id))
    )

    const combinedLogsRaw = [...logsByConnection.flat(), ...globalLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 300)

    const logs = combinedLogsRaw.map((log, index) => ({
      id: `${log.connectionId}-${index}-${log.timestamp}`,
      timestamp: log.timestamp,
      type: mapPhaseToType(log.phase),
      symbol: log.details?.symbol,
      phase: log.phase,
      message: log.message,
      details: {
        timeframe: log.details?.timeframe,
        timeRange: log.details?.timeRange,
        calculatedIndicators: log.details?.calculatedIndicators,
        evaluatedStrategies: log.details?.evaluatedStrategies,
        pseudoPositions: log.details?.pseudoPositions,
        configs: log.details?.configs,
        evals: log.details?.evals,
        ratios: log.details?.ratios,
        cycleDuration: log.details?.cycleDuration,
      },
    }))

    // Get comprehensive stats from Redis for the first active connection
    const client = getRedisClient()
    let comprehensiveStats = null
    
    if (activeConnections.length > 0) {
      const focusConnId = activeConnections[0].id
      
      // Get indications by type
      const directionIndications = await client.scard(`indications:${focusConnId}:direction`).catch(() => 0)
      const moveIndications = await client.scard(`indications:${focusConnId}:move`).catch(() => 0)
      const activeIndications = await client.scard(`indications:${focusConnId}:active`).catch(() => 0)
      const optimalIndications = await client.scard(`indications:${focusConnId}:optimal`).catch(() => 0)
      const autoIndications = await client.scard(`indications:${focusConnId}:auto`).catch(() => 0)
      
      // Get pseudo positions by type
      const basePseudoPositions = await client.scard(`base_pseudo:${focusConnId}`).catch(() => 0)
      const mainPseudoPositions = await client.scard(`main_pseudo:${focusConnId}`).catch(() => 0)
      const realPseudoPositions = await client.scard(`real_pseudo:${focusConnId}`).catch(() => 0)
      
      // Get base pseudo by indication type
      const baseDirection = await client.scard(`base_pseudo:${focusConnId}:direction`).catch(() => 0)
      const baseMove = await client.scard(`base_pseudo:${focusConnId}:move`).catch(() => 0)
      const baseActive = await client.scard(`base_pseudo:${focusConnId}:active`).catch(() => 0)
      const baseOptimal = await client.scard(`base_pseudo:${focusConnId}:optimal`).catch(() => 0)
      
      // Get live positions
      const livePositionsCount = await client.scard(`positions:${focusConnId}:live`).catch(() => 0)
      
      // Get prehistoric data info
      const prehistoricSymbols = await client.scard(`prehistoric:${focusConnId}:symbols`).catch(() => 0)
      let prehistoricDataSize = 0
      try {
        const keys = await client.keys(`prehistoric:${focusConnId}:*`)
        prehistoricDataSize = keys.length
      } catch { /* ignore */ }
      
      // Get intervals processed
      const intervalsProcessed = await client.scard(`intervals:${focusConnId}:processed`).catch(() => 0)
      
      // Get cycle duration from progression state (from settings)
      let cycleDurationMs = 0
      try {
        const cycleData = await client.hgetall(`progression:${focusConnId}`)
        cycleDurationMs = Number(cycleData?.last_cycle_duration || cycleData?.cycle_duration || 0)
      } catch { /* ignore */ }
      
      comprehensiveStats = {
        prehistoricSymbols,
        prehistoricDataSize,
        intervalsProcessed,
        indicationsByType: {
          direction: directionIndications,
          move: moveIndications,
          active: activeIndications,
          optimal: optimalIndications,
          auto: autoIndications,
          total: directionIndications + moveIndications + activeIndications + optimalIndications + autoIndications,
        },
        pseudoPositionsByType: {
          baseByIndication: {
            direction: baseDirection,
            move: baseMove,
            active: baseActive,
            optimal: baseOptimal,
          },
        },
        livePositions: livePositionsCount,
        cycleDurationMs,
      }
    }
    
    const indicationCycles = progressionStates.reduce((sum, p) => sum + (p.cyclesCompleted || 0), 0)
    const strategyCycles = progressionStates.reduce((sum, p) => sum + (p.successfulCycles || 0), 0)
    const totalPositions = positionsByConnection.reduce((sum, arr) => sum + arr.length, 0)
    const totalTrades = tradesByConnection.reduce((sum, arr) => sum + arr.length, 0)
    
    // Use pre-computed comprehensive stats values
    const basePseudoCount = comprehensiveStats ? (await client.scard(`base_pseudo:${activeConnections[0]?.id}`).catch(() => 0)) : totalPositions
    const mainPseudoCount = comprehensiveStats ? (await client.scard(`main_pseudo:${activeConnections[0]?.id}`).catch(() => 0)) : strategyCycles
    const realPseudoCount = comprehensiveStats ? (await client.scard(`real_pseudo:${activeConnections[0]?.id}`).catch(() => 0)) : totalTrades

    const summary = {
      symbolsActive: Math.max(1, activeConnections.length),
      indicationCycles,
      strategyCycles,
      totalIndicationsCalculated: comprehensiveStats?.indicationsByType?.total || indicationCycles,
      totalStrategiesEvaluated: strategyCycles,
      pseudoPositions: {
        base: basePseudoCount,
        main: mainPseudoCount,
        real: realPseudoCount,
        total: basePseudoCount + mainPseudoCount + realPseudoCount,
      },
      // Extended stats
      prehistoricSymbols: comprehensiveStats?.prehistoricSymbols || 0,
      prehistoricDataSize: comprehensiveStats?.prehistoricDataSize || 0,
      intervalsProcessed: comprehensiveStats?.intervalsProcessed || 0,
      indicationsByType: comprehensiveStats?.indicationsByType || {
        direction: 0, move: 0, active: 0, optimal: 0, auto: 0, total: 0
      },
      pseudoPositionsByType: comprehensiveStats?.pseudoPositionsByType || {
        baseByIndication: { direction: 0, move: 0, active: 0, optimal: 0 }
      },
      livePositions: comprehensiveStats?.livePositions || 0,
      cycleDurationMs: comprehensiveStats?.cycleDurationMs || 0,
      configsProcessed: activeConnections.length,
      evalsCompleted: strategyCycles,
      avgCycleDuration: logs.length > 0
        ? Math.round(
            logs
              .map((l: any) => Number(l.details?.cycleDuration || 0))
              .filter((v: number) => v > 0)
              .reduce((a: number, b: number) => a + b, 0) /
              Math.max(1, logs.filter((l: any) => Number(l.details?.cycleDuration || 0) > 0).length)
          )
        : 0,
      lastUpdate: new Date().toISOString(),
      errors: logs.filter((log: any) => log.type === "error").length,
      warnings: logs.filter((log: any) => log.message.toLowerCase().includes("warn")).length,
    }

    return NextResponse.json({
      success: true,
      logs,
      summary,
      timestamp: new Date().toISOString(),
      activeConnections: activeConnections.map((c: any) => ({
        id: c.id,
        name: c.name,
        exchange: c.exchange,
        dashboardEnabled: isTruthy(c.is_enabled_dashboard),
      })),
    })
  } catch (error) {
    console.error("[v0] Error fetching detailed logs:", error)
    return NextResponse.json({
      success: false,
      logs: [],
      summary: null,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
