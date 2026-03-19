import { createConnection, deleteConnection, getAllConnections, getConnection, initRedis, updateConnection } from "@/lib/redis-db"
import { getBaseConnectionCredentials, type BaseConnectionId } from "@/lib/base-connection-credentials"

type BaseSeedConfig = {
  id: BaseConnectionId
  exchange: string
  name: string
  apiType: string
  contractType: string
  connectionMethod: string
  connectionLibrary: string
}

const CANONICAL_BASE_CONNECTIONS: BaseSeedConfig[] = [
  { id: "bybit-x03", exchange: "bybit", name: "Bybit X03", apiType: "unified", contractType: "linear", connectionMethod: "library", connectionLibrary: "native" },
  { id: "bingx-x01", exchange: "bingx", name: "BingX X01", apiType: "perpetual_futures", contractType: "usdt-perpetual", connectionMethod: "library", connectionLibrary: "native" },
  { id: "pionex-x01", exchange: "pionex", name: "Pionex X01", apiType: "perpetual_futures", contractType: "usdt-perpetual", connectionMethod: "library", connectionLibrary: "native" },
  { id: "orangex-x01", exchange: "orangex", name: "OrangeX X01", apiType: "perpetual_futures", contractType: "usdt-perpetual", connectionMethod: "library", connectionLibrary: "native" },
]

const LEGACY_CONNECTION_IDS = [
  "bybit-base",
  "bingx-base",
  "binance-base",
  "okx-base",
  "bybit-default-disabled",
  "bingx-default-disabled",
]

/**
 * Backward-compatible entrypoint. Ensures canonical base connections only.
 */
export async function seedDefaultExchanges() {
  return ensureDefaultExchangesExist()
}

/**
 * Ensures canonical base connections exist and injects predefined real credentials.
 * Also removes legacy `*-base` / `*-default-disabled` duplicates that caused blank/duplicated entries.
 */
export async function ensureDefaultExchangesExist() {
  await initRedis()

  try {
    let removedLegacy = 0
    let created = 0
    let updated = 0
      let credentialsApplied = 0

    const allConnections = await getAllConnections()
      const existingIds = new Set((allConnections || []).map((c: any) => c.id as string))

    for (const legacyId of LEGACY_CONNECTION_IDS) {
      if (existingIds.has(legacyId)) {
        await deleteConnection(legacyId)
        removedLegacy++
      }
    }

    for (const cfg of CANONICAL_BASE_CONNECTIONS) {
      const now = new Date().toISOString()
      const existing = await getConnection(cfg.id)

        const { apiKey, apiSecret } = getBaseConnectionCredentials(cfg.id)
        const hasConfiguredCreds = apiKey.length > 0 && apiSecret.length > 0

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

        if (hasConfiguredCreds) {
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

        if (hasConfiguredCreds) {
          credentialsApplied++
        }
      }

      console.log(
        `[v0] [BaseSeed] canonical ensured created=${created} updated=${updated} legacyRemoved=${removedLegacy} credentialsApplied=${credentialsApplied}`,
      )

    return {
      success: true,
      created,
      updated,
      removedLegacy,
        credentialsApplied,
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
