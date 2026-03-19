import { NextResponse } from "next/server"
import { getDashboardWorkflowSnapshot } from "@/lib/dashboard-workflow"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const snapshot = await getDashboardWorkflowSnapshot()
    const { focusConnection, connectionMetrics, overview, globalStatus } = snapshot

    const cycleSuccessRate = Math.round(connectionMetrics.progression?.cycleSuccessRate || 0)
    const completedOrders = connectionMetrics.trades
    const failedOrders = connectionMetrics.progression?.failedCycles || 0
    const totalProcessed = completedOrders + failedOrders
    const successRate = totalProcessed > 0 ? Math.round((completedOrders / totalProcessed) * 100) : cycleSuccessRate
    const processingRate = connectionMetrics.progression?.cyclesCompleted || 0
    const avgLatency = Math.round(connectionMetrics.progression?.cycleSuccessRate ? Math.max(150, 1000 - connectionMetrics.progression.cycleSuccessRate * 5) : 0)
    const latestSymbolFromLogs = connectionMetrics.logs.find((log: any) => typeof log.details?.symbol === "string")?.details?.symbol
    const focusSymbol = latestSymbolFromLogs || "N/A"

    return NextResponse.json({
      success: true,
      queueSize: Math.max(0, overview.eligibleEngineConnections - overview.liveTradeConnections),
      processingRate,
      successRate,
      avgLatency,
      maxLatency: avgLatency ? avgLatency + 120 : 0,
      throughput: processingRate * 60,
      completedOrders,
      failedOrders,
      activeOrders: focusConnection
        ? [
            {
              id: focusConnection.id,
              orderId: `#${focusConnection.id.slice(0, 8)}`,
              symbol: focusSymbol,
              status: globalStatus === "running" ? "processing" : "waiting",
              quantity: `${connectionMetrics.positions} tracked positions`,
              latency: avgLatency,
            },
          ]
        : [],
      workflow: snapshot.workflowPhases,
      focusConnection,
      progression: connectionMetrics.progression,
    })
  } catch (error) {
    console.error("[v0] [Logistics] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch logistics data",
        queueSize: 0,
        processingRate: 0,
        successRate: 0,
        avgLatency: 0,
        completedOrders: 0,
        failedOrders: 0,
        maxLatency: 0,
        throughput: 0,
        workflow: [],
      },
      { status: 500 },
    )
  }
}
