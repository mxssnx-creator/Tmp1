import { createConnection, deleteConnection, getAllConnections, getConnection, initRedis, updateConnection } from "@/lib/redis-db"

type BaseSeedConfig = {
  id: string
  exchange: string
  name: string
  apiType: string
  contractType: string
  connectionMethod: string
  connectionLibrary: string
  envKey: string
  envSecret: string
}

const CANONICAL_BASE_CONNECTIONS: BaseSeedConfig[] = [
  { id: "bybit-x03", exchange: "bybit", name: "Bybit X03", apiType: "unified", contractType: "linear", connectionMethod: "library", connectionLibrary: "native", envKey: "BYBIT_API_KEY", envSecret: "BYBIT_API_SECRET" },
  { id: "bingx-x01", exchange: "bingx", name: "BingX X01", apiType: "perpetual_futures", contractType: "usdt-perpetual", connectionMethod: "library", connectionLibrary: "native", envKey: "BINGX_API_KEY", envSecret: "BINGX_API_SECRET" },
  { id: "pionex-x01", exchange: "pionex", name: "Pionex X01", apiType: "perpetual_futures", contractType: "usdt-perpetual", connectionMethod: "library", connectionLibrary: "native", envKey: "PIONEX_API_KEY", envSecret: "PIONEX_API_SECRET" },
  { id: "orangex-x01", exchange: "orangex", name: "OrangeX X01", apiType: "perpetual_futures", contractType: "usdt-perpetual", connectionMethod: "library", connectionLibrary: "native", envKey: "ORANGEX_API_KEY", envSecret: "ORANGEX_API_SECRET" },
]

const LEGACY_CONNECTION_IDS = [
  "bybit-base",
  "bingx-base",
  "binance-base",
  "okx-base",
  "bybit-default-disabled",
  "bingx-default-disabled",
]

function readCredentialEnv(name: string): string {
  const raw = process.env[name] || ""
  return raw.trim().replace(/^['\"]|['\"]$/g, "")
}

/**
 * Backward-compatible entrypoint. Ensures canonical base connections only.
 */
export async function seedDefaultExchanges() {
  return ensureDefaultExchangesExist()
}

/**
 * Ensures canonical base connections exist and injects env credentials when available.
 * Also removes legacy `*-base` / `*-default-disabled` duplicates that caused blank BingX entries.
 */
export async function ensureDefaultExchangesExist() {
  await initRedis()

  try {
    let removedLegacy = 0
    let created = 0
    let updated = 0
    let credentialsInjected = 0

    const allConnections = await getAllConnections()
    const existingIds = new Set((allConnections || []).map((c: any) => c.id))

    for (const legacyId of LEGACY_CONNECTION_IDS) {
      if (existingIds.has(legacyId)) {
        await deleteConnection(legacyId)
        removedLegacy++
      }
    }

    for (const cfg of CANONICAL_BASE_CONNECTIONS) {
      const now = new Date().toISOString()
      const existing = await getConnection(cfg.id)

      const apiKey = readCredentialEnv(cfg.envKey)
      const apiSecret = readCredentialEnv(cfg.envSecret)
      const hasEnvCreds = apiKey.length > 10 && apiSecret.length > 10

      const normalizedBase = {
        id: cfg.id,
        name: existing?.name || cfg.name,
        exchange: cfg.exchange,
        api_type: existing?.api_type || cfg.apiType,
        contract_type: existing?.contract_type || cfg.contractType,
        connection_method: existing?.connection_method || cfg.connectionMethod,
        connection_library: existing?.connection_library || cfg.connectionLibrary,
        margin_type: existing?.margin_type || "cross",
        position_mode: existing?.position_mode || "hedge",
        is_testnet: existing?.is_testnet ?? false,
        is_predefined: existing?.is_predefined ?? true,
        is_inserted: existing?.is_inserted ?? "1",
        is_active_inserted: existing?.is_active_inserted ?? "1",
        is_enabled: existing?.is_enabled ?? "1",
        is_enabled_dashboard: existing?.is_enabled_dashboard ?? "0",
        is_active: existing?.is_active ?? "0",
        created_at: existing?.created_at || now,
        updated_at: now,
      } as Record<string, any>

      if (hasEnvCreds) {
        normalizedBase.api_key = apiKey
        normalizedBase.api_secret = apiSecret
      } else {
        normalizedBase.api_key = existing?.api_key || ""
        normalizedBase.api_secret = existing?.api_secret || ""
      }

      if (!existing) {
        await createConnection(normalizedBase)
        created++
      } else {
        await updateConnection(cfg.id, normalizedBase)
        updated++
      }

      if (hasEnvCreds) {
        credentialsInjected++
      }
    }

    console.log(
      `[v0] [BaseSeed] canonical ensured created=${created} updated=${updated} legacyRemoved=${removedLegacy} credentialsInjected=${credentialsInjected}`,
    )

    return {
      success: true,
      created,
      updated,
      removedLegacy,
      credentialsInjected,
    }
  } catch (error) {
    console.error("[v0] [BaseSeed] ensure failed:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Returns canonical base connections enabled in Settings and not yet active on dashboard.
 */
export async function getAvailableBaseConnections() {
  await initRedis()
  const allConnections = await getAllConnections()
  const canonicalIds = new Set(CANONICAL_BASE_CONNECTIONS.map((c) => c.id))

  return (allConnections || []).filter((c: any) => {
    if (!canonicalIds.has(c.id)) return false
    const isEnabled = c.is_enabled === true || c.is_enabled === "1" || c.is_enabled === "true"
    const isDashboardInserted = c.is_active_inserted === true || c.is_active_inserted === "1" || c.is_active_inserted === "true"
    return isEnabled && !isDashboardInserted
  })
}
