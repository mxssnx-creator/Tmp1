import { getAllConnections, getActiveConnectionsForEngine, getConnectionPositions, getConnectionTrades, getRedisClient, initRedis } from "@/lib/redis-db"
import { ProgressionStateManager } from "@/lib/progression-state-manager"
import { getProgressionLogs } from "@/lib/engine-progression-logs"

type WorkflowConnection = {
  id: string
  name: string
  exchange: string
  hasCredentials: boolean
  isActivePanel: boolean
  isDashboardEnabled: boolean
  liveTradeEnabled: boolean
  presetTradeEnabled: boolean
  testStatus: string
}

function isTruthyFlag(value: unknown): boolean {
  return value === true || value === "1" || value === "true"
}

export async function getDashboardWorkflowSnapshot() {
  await initRedis()

  const client = getRedisClient()
  const allConnections = await getAllConnections()
  const eligibleConnections = await getActiveConnectionsForEngine()
  const globalState = await client.hgetall("trade_engine:global")
  const globalStatus = globalState?.status || "stopped"

  const normalizedConnections: WorkflowConnection[] = allConnections.map((connection: any) => {
    const apiKey = connection.api_key || connection.apiKey || ""
    const apiSecret = connection.api_secret || connection.apiSecret || ""

    return {
      id: connection.id,
      name: connection.name || connection.exchange || connection.id,
      exchange: connection.exchange || "unknown",
      hasCredentials: apiKey.length > 10 && apiSecret.length > 10,
      isActivePanel: isTruthyFlag(connection.is_active_inserted) || isTruthyFlag(connection.is_dashboard_inserted),
      isDashboardEnabled: isTruthyFlag(connection.is_enabled_dashboard),
      liveTradeEnabled: isTruthyFlag(connection.is_live_trade) || isTruthyFlag(connection.live_trade_enabled),
      presetTradeEnabled: isTruthyFlag(connection.is_preset_trade) || isTruthyFlag(connection.preset_trade_enabled),
      testStatus: connection.last_test_status || connection.test_status || "untested",
    }
  })

  const focusConnection = normalizedConnections.find((conn) => conn.isDashboardEnabled) || normalizedConnections[0] || null

  let connectionMetrics = {
    progression: null as null | Awaited<ReturnType<typeof ProgressionStateManager.getProgressionState>>,
    positions: 0,
    trades: 0,
    logs: [] as Awaited<ReturnType<typeof getProgressionLogs>>,
  }

  if (focusConnection) {
    const [progression, positions, trades, logs] = await Promise.all([
      ProgressionStateManager.getProgressionState(focusConnection.id),
      getConnectionPositions(focusConnection.id),
      getConnectionTrades(focusConnection.id),
      getProgressionLogs(focusConnection.id),
    ])

    connectionMetrics = {
      progression,
      positions: positions.length,
      trades: trades.length,
      logs: logs.slice(0, 50),
    }
  }

  const recentGlobalLogs = await getProgressionLogs("global")

  const workflowPhases = [
    {
      id: "credentials",
      label: "Credentials",
      status: normalizedConnections.some((conn) => conn.hasCredentials) ? "complete" : "pending",
      detail: normalizedConnections.some((conn) => conn.hasCredentials)
        ? "API credentials detected for at least one connection"
        : "Add API key and secret in Settings to unlock exchange-backed processing",
    },
    {
      id: "active-panel",
      label: "Active Panel",
      status: normalizedConnections.some((conn) => conn.isActivePanel) ? "complete" : "pending",
      detail: normalizedConnections.some((conn) => conn.isActivePanel)
        ? "Connection is inserted into the dashboard active panel"
        : "Use Add Connection or Quick Start to insert a connection into the active panel",
    },
    {
      id: "dashboard-enable",
      label: "Dashboard Enable",
      status: normalizedConnections.some((conn) => conn.isDashboardEnabled) ? "complete" : "pending",
      detail: normalizedConnections.some((conn) => conn.isDashboardEnabled)
        ? "Dashboard enable toggle is active for at least one connection"
        : "Toggle Enable on an active connection to start engine-side processing",
    },
    {
      id: "global-engine",
      label: "Global Engine",
      status: globalStatus === "running" ? "complete" : globalStatus === "paused" ? "warning" : "pending",
      detail:
        globalStatus === "running"
          ? "Global coordinator is running"
          : globalStatus === "paused"
            ? "Global coordinator is paused"
            : "Start the global coordinator to begin processing cycles",
    },
    {
      id: "engine-eligible",
      label: "Eligible Processing",
      status: eligibleConnections.length > 0 ? "complete" : normalizedConnections.length > 0 ? "warning" : "pending",
      detail:
        eligibleConnections.length > 0
          ? `${eligibleConnections.length} connection(s) currently eligible for engine processing`
          : normalizedConnections.length > 0
            ? "Connections exist but none currently satisfy all engine eligibility checks"
            : "No connections configured yet",
    },
  ]

  return {
    timestamp: new Date().toISOString(),
    globalStatus,
    overview: {
      totalConnections: normalizedConnections.length,
      activePanelConnections: normalizedConnections.filter((conn) => conn.isActivePanel).length,
      dashboardEnabledConnections: normalizedConnections.filter((conn) => conn.isDashboardEnabled).length,
      eligibleEngineConnections: eligibleConnections.length,
      liveTradeConnections: normalizedConnections.filter((conn) => conn.liveTradeEnabled).length,
      presetTradeConnections: normalizedConnections.filter((conn) => conn.presetTradeEnabled).length,
    },
    workflowPhases,
    focusConnection,
    connectionMetrics,
    recentGlobalLogs: recentGlobalLogs.slice(0, 20),
  }
}
