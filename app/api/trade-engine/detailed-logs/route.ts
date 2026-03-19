import { NextResponse } from "next/server"
import { initRedis, getAllConnections, getConnectionPositions, getConnectionTrades } from "@/lib/redis-db"
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

export async function GET() {
  try {
    await initRedis()

    const allConnections = await getAllConnections()
    const activeConnections = allConnections.filter((c: any) => {
      const exch = (c.exchange || "").toLowerCase()
      const isBase = ["bingx", "bybit", "pionex", "orangex"].includes(exch)
      return isBase || isTruthy(c.is_dashboard_inserted) || isTruthy(c.is_active_inserted) || isTruthy(c.is_enabled_dashboard)
    })

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

    const indicationCycles = progressionStates.reduce((sum, p) => sum + (p.cyclesCompleted || 0), 0)
    const strategyCycles = progressionStates.reduce((sum, p) => sum + (p.successfulCycles || 0), 0)
    const totalPositions = positionsByConnection.reduce((sum, arr) => sum + arr.length, 0)
    const totalTrades = tradesByConnection.reduce((sum, arr) => sum + arr.length, 0)

    const summary = {
      symbolsActive: Math.max(1, activeConnections.length),
      indicationCycles,
      strategyCycles,
      totalIndicationsCalculated: indicationCycles,
      totalStrategiesEvaluated: strategyCycles,
      pseudoPositions: {
        base: totalPositions,
        main: strategyCycles,
        real: totalTrades,
        total: totalPositions + totalTrades,
      },
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
