import { NextResponse } from "next/server"
import { getAllConnections } from "@/lib/redis-db"
import { getProgressionLogs } from "@/lib/engine-progression-logs"
import { WorkflowLogger } from "@/lib/workflow-logger"

type LogLevel = "error" | "warn" | "warning" | "info" | "debug"

function normalizeLogLevel(level: unknown): LogLevel {
  const value = String(level || "").toLowerCase()
  if (value === "error" || value === "failed") return "error"
  if (value === "warn" || value === "warning") return "warn"
  if (value === "debug") return "debug"
  return "info"
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const allConnections = await getAllConnections()
    const connection = allConnections.find((conn: any) => conn.id === id) || null

    const [progressionLogs, workflowLogs] = await Promise.all([
      getProgressionLogs(id),
      WorkflowLogger.getLogs(id, 100),
    ])

    const mappedProgressionLogs = progressionLogs.map((log) => ({
      source: "progression",
      timestamp: log.timestamp,
      level: normalizeLogLevel(log.level),
      phase: log.phase || "progression",
      message: log.message,
      details: log.details || {},
    }))
    const mappedWorkflowLogs = workflowLogs.map((log) => ({
      source: "workflow",
      timestamp: new Date(log.timestamp).toISOString(),
      level: normalizeLogLevel(log.status),
      phase: log.eventType || "workflow",
      message: log.message,
      details: {
        symbol: log.symbol,
        duration: log.duration,
        ...(log.details || {}),
      },
    }))

    const logs = [...mappedProgressionLogs, ...mappedWorkflowLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 100)

    const levelSummary = logs.reduce(
      (acc, log) => {
        if (log.level === "error") acc.errors += 1
        else if (log.level === "warn" || log.level === "warning") acc.warnings += 1
        else if (log.level === "debug") acc.debug += 1
        else acc.info += 1
        return acc
      },
      { errors: 0, warnings: 0, info: 0, debug: 0 },
    )

    const phaseSummary = logs.reduce<Record<string, number>>((acc, log) => {
      const phase = log.phase || "unknown"
      acc[phase] = (acc[phase] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      connection: connection
        ? {
            id: connection.id,
            name: connection.name || connection.exchange || connection.id,
            exchange: connection.exchange || "unknown",
            is_enabled: connection.is_enabled,
            is_enabled_dashboard: connection.is_enabled_dashboard,
            is_active_inserted: connection.is_active_inserted,
            last_test_status: connection.last_test_status || connection.test_status || "untested",
            last_test_timestamp: connection.last_test_timestamp || connection.updated_at || null,
          }
        : null,
      logs: logs || [],
      summary: {
        total: logs.length,
        ...levelSummary,
        phases: phaseSummary,
        latestTimestamp: logs[0]?.timestamp || null,
        oldestTimestamp: logs[logs.length - 1]?.timestamp || null,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error fetching connection logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch connection logs", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
