export function isTruthyFlag(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true"
}

export function hasConnectionCredentials(connection: any, minLength = 10, allowPlaceholder = true): boolean {
  const apiKey = connection?.api_key || connection?.apiKey || ""
  const apiSecret = connection?.api_secret || connection?.apiSecret || ""

  if (!allowPlaceholder) {
    if (String(apiKey).includes("PLACEHOLDER") || String(apiSecret).includes("PLACEHOLDER")) {
      return false
    }
  }

  return apiKey.length >= minLength && apiSecret.length >= minLength
}

export function isConnectionInActivePanel(connection: any): boolean {
  return isTruthyFlag(connection?.is_active_inserted) || isTruthyFlag(connection?.is_dashboard_inserted)
}

export function isConnectionDashboardEnabled(connection: any): boolean {
  return isTruthyFlag(connection?.is_enabled_dashboard)
}

export function isConnectionSystemEnabled(connection: any): boolean {
  return isTruthyFlag(connection?.is_enabled)
}

export function isConnectionLiveTradeEnabled(connection: any): boolean {
  return isTruthyFlag(connection?.is_live_trade) || isTruthyFlag(connection?.live_trade_enabled)
}

export function isConnectionPresetTradeEnabled(connection: any): boolean {
  return isTruthyFlag(connection?.is_preset_trade) || isTruthyFlag(connection?.preset_trade_enabled)
}

export function isConnectionWorking(connection: any): boolean {
  const status = connection?.last_test_status || connection?.test_status || connection?.connection_status
  return status === "success" || status === "ok" || status === "connected"
}

export function isConnectionEligibleForEngine(connection: any): boolean {
  const isActiveInserted = isConnectionInActivePanel(connection)
  const isDashboardEnabled = isConnectionDashboardEnabled(connection)
  const hasCredentials = hasConnectionCredentials(connection, 10)

  const isTestnet = isTruthyFlag(connection?.is_testnet)
  const isDemoMode = isTruthyFlag(connection?.demo_mode)

  return isActiveInserted && isDashboardEnabled && (hasCredentials || isTestnet || isDemoMode)
}

export function isOpenPosition(position: any): boolean {
  return position?.status === "open" || position?.status === "active" || isTruthyFlag(position?.is_open)
}
