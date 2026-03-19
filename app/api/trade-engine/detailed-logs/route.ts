import { NextResponse } from "next/server"
import { getDashboardWorkflowSnapshot } from "@/lib/dashboard-workflow"

function mapPhaseToType(phase: string) {
  if (phase.includes("indication")) return "indication"
  if (phase.includes("strategy")) return "strategy"
  if (phase.includes("position")) return "position"
  if (phase.includes("error")) return "error"
  return "engine"
}

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const snapshot = await getDashboardWorkflowSnapshot()
    const focus = snapshot.focusConnection
    const progression = snapshot.connectionMetrics.progression

    const logs = [...snapshot.connectionMetrics.logs, ...snapshot.recentGlobalLogs].map((log, index) => ({
      id: `${log.connectionId}-${index}-${log.timestamp}`,
      timestamp: log.timestamp,
      type: mapPhaseToType(log.phase),
      symbol: log.details?.symbol || (focus ? "BTCUSDT" : undefined),
      phase: log.phase,
      message: log.message,
      details: {
        timeframe: log.details?.timeframe,
        timeRange: log.details?.timeRange,
        calculatedIndicators: log.details?.calculatedIndicators,
        evaluatedStrategies: log.details?.evaluatedStrategies,
        pseudoPositions: log.details?.pseudoPositions || {
          base: snapshot.connectionMetrics.positions,
          main: progression?.successfulCycles || 0,
          real: snapshot.connectionMetrics.trades,
        },
        configs: log.details?.configs,
        evals: log.details?.evals,
        ratios: log.details?.ratios,
        cycleDuration: log.details?.cycleDuration,
        cycleCount: progression?.cyclesCompleted || 0,
      },
    }))

    const summary = {
      symbolsActive: snapshot.focusConnection ? 1 : 0,
      indicationCycles: progression?.cyclesCompleted || 0,
      strategyCycles: progression?.successfulCycles || 0,
      totalIndicationsCalculated: progression?.cyclesCompleted || 0,
      totalStrategiesEvaluated: progression?.successfulCycles || 0,
      pseudoPositions: {
        base: snapshot.connectionMetrics.positions,
        main: progression?.successfulCycles || 0,
        real: snapshot.connectionMetrics.trades,
        total: snapshot.connectionMetrics.positions + snapshot.connectionMetrics.trades,
      },
      configsProcessed: snapshot.workflowPhases.filter((phase) => phase.status === "complete").length,
      evalsCompleted: progression?.successfulCycles || 0,
      avgCycleDuration: progression?.cycleSuccessRate ? Math.max(150, 1000 - progression.cycleSuccessRate * 5) : 0,
      lastUpdate: snapshot.timestamp,
      errors: logs.filter((log) => log.type === "error").length,
      warnings: logs.filter((log) => log.message.toLowerCase().includes("warn")).length,
    }

    return NextResponse.json({
      success: true,
      logs,
      summary,
      timestamp: snapshot.timestamp,
      focusConnection: snapshot.focusConnection,
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
