import { getAllConnections, getConnectionPositions, getConnectionTrades, getRedisClient, initRedis } from "@/lib/redis-db"
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

function isConnectionEligibleForEngine(connection: any): boolean {
  const isActiveInserted = isTruthyFlag(connection.is_active_inserted) || isTruthyFlag(connection.is_dashboard_inserted)
  const isDashboardEnabled = isTruthyFlag(connection.is_enabled_dashboard)

  const apiKey = connection.api_key || connection.apiKey || ""
  const apiSecret = connection.api_secret || connection.apiSecret || ""
  const hasCredentials = apiKey.length > 10 && apiSecret.length > 10

  const isTestnet = isTruthyFlag(connection.is_testnet)
  const isDemoMode = isTruthyFlag(connection.demo_mode)

  return isActiveInserted && isDashboardEnabled && (hasCredentials || isTestnet || isDemoMode)
}

const SNAPSHOT_TTL_MS = 1000
let cachedSnapshot: any | null = null
let cachedSnapshotAt = 0
let snapshotInFlight: Promise<any> | null = null

export async function getDashboardWorkflowSnapshot() {
  const now = Date.now()
  if (cachedSnapshot && now - cachedSnapshotAt < SNAPSHOT_TTL_MS) {
    return cachedSnapshot
  }

  if (snapshotInFlight) {
    return snapshotInFlight
  }

  snapshotInFlight = buildDashboardWorkflowSnapshot()

  try {
    const snapshot = await snapshotInFlight
    cachedSnapshot = snapshot
    cachedSnapshotAt = Date.now()
    return snapshot
  } finally {
    snapshotInFlight = null
  }
}

async function buildDashboardWorkflowSnapshot() {
  await initRedis()

  const client = getRedisClient()
  const allConnections = await getAllConnections()
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

  const eligibleConnections = allConnections.filter((connection: any) => isConnectionEligibleForEngine(connection))

  const focusConnection = normalizedConnections.find((conn) => conn.isDashboardEnabled) || normalizedConnections[0] || null

  let connectionMetrics = {
    progression: null as null | Awaited<ReturnType<typeof ProgressionStateManager.getProgressionState>>,
    positions: 0,
    trades: 0,
    logs: [] as Awaited<ReturnType<typeof getProgressionLogs>>,
    comprehensiveStats: null as null | {
      symbols: { prehistoricLoaded: number; prehistoricDataSize: number; intervalsProcessed: number }
      indicationsByType: { direction: number; move: number; active: number; optimal: number; auto: number; total: number }
      pseudoPositions: { base: number; main: number; real: number; total: number }
      livePositions: number
    }
  }

  if (focusConnection) {
    const [progression, positions, trades, logs] = await Promise.all([
      ProgressionStateManager.getProgressionState(focusConnection.id),
      getConnectionPositions(focusConnection.id),
      getConnectionTrades(focusConnection.id),
      getProgressionLogs(focusConnection.id),
    ])

    // Gather comprehensive stats for the focus connection
    const connId = focusConnection.id
    
    // Get indications by type
    const directionIndications = await client.scard(`indications:${connId}:direction`).catch(() => 0)
    const moveIndications = await client.scard(`indications:${connId}:move`).catch(() => 0)
    const activeIndications = await client.scard(`indications:${connId}:active`).catch(() => 0)
    const optimalIndications = await client.scard(`indications:${connId}:optimal`).catch(() => 0)
    const autoIndications = await client.scard(`indications:${connId}:auto`).catch(() => 0)
    
    // Get pseudo positions by type
    const basePseudoPositions = await client.scard(`base_pseudo:${connId}`).catch(() => 0)
    const mainPseudoPositions = await client.scard(`main_pseudo:${connId}`).catch(() => 0)
    const realPseudoPositions = await client.scard(`real_pseudo:${connId}`).catch(() => 0)
    
    // Get live positions
    const livePositionsCount = await client.scard(`positions:${connId}:live`).catch(() => 0)
    
    // Get prehistoric data info
    const prehistoricSymbols = await client.scard(`prehistoric:${connId}:symbols`).catch(() => 0)
    let prehistoricDataSize = 0
    try {
      const keys = await client.keys(`prehistoric:${connId}:*`)
      prehistoricDataSize = keys.length
    } catch { /* ignore */ }
    
    // Get intervals processed
    const intervalsProcessed = await client.scard(`intervals:${connId}:processed`).catch(() => 0)
    
    connectionMetrics = {
      progression,
      positions: positions.length,
      trades: trades.length,
      logs: logs.slice(0, 50),
      // Comprehensive stats
      comprehensiveStats: {
        symbols: {
          prehistoricLoaded: prehistoricSymbols,
          prehistoricDataSize,
          intervalsProcessed,
        },
        indicationsByType: {
          direction: directionIndications,
          move: moveIndications,
          active: activeIndications,
          optimal: optimalIndications,
          auto: autoIndications,
          total: directionIndications + moveIndications + activeIndications + optimalIndications + autoIndications,
        },
        pseudoPositions: {
          base: basePseudoPositions,
          main: mainPseudoPositions,
          real: realPseudoPositions,
          total: basePseudoPositions + mainPseudoPositions + realPseudoPositions,
        },
        livePositions: livePositionsCount,
      },
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
