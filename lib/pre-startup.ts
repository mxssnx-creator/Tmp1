import { getSettings, getAllConnections, initRedis, saveMarketData, setSettings, updateConnection } from "@/lib/redis-db"
import { runMigrations } from "@/lib/redis-migrations"
import { getDefaultSettings } from "@/lib/settings-storage"
import { getGlobalTradeEngineCoordinator } from "@/lib/trade-engine"

let ran = false

async function getExchangeConnectorFactory() {
  const { createExchangeConnector } = await import("@/lib/exchange-connectors")
  return createExchangeConnector
}

function shouldRunPreStartup(): boolean {
  if (process.env.NEXT_RUNTIME !== "nodejs") return false
  if (process.env.NODE_ENV === "production") return false
  return true
}

async function initializeDefaultSettings() {
  const existing = await getSettings("app_settings")
  if (existing) return
  await setSettings("app_settings", getDefaultSettings())
}

async function seedPredefinedConnections() {
  // Base connections are seeded by redis-db and migrations.
}

async function seedMarketData() {
  const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "SOLUSDT"]
  const basePrices: Record<string, number> = {
    BTCUSDT: 100000,
    ETHUSDT: 3500,
    BNBUSDT: 700,
    XRPUSDT: 0.6,
    ADAUSDT: 0.8,
    SOLUSDT: 180,
  }

  for (const symbol of symbols) {
    const base = basePrices[symbol] ?? 100
    for (let i = 0; i < 20; i += 1) {
      const variation = base * 0.02
      const close = base + (Math.random() - 0.5) * variation
      await saveMarketData(symbol, {
        symbol,
        exchange: "bybit",
        interval: "1m",
        price: close,
        open: base,
        high: base + variation,
        low: base - variation,
        close,
        volume: Math.random() * 1_000_000,
        timestamp: new Date(Date.now() - (20 - i) * 60_000).toISOString(),
      })
    }
  }
}

export async function testAllExchangeConnections() {
  try {
    const allConnections = await getAllConnections()
    const testable = allConnections.filter((c: any) => {
      const inserted = c.is_active_inserted === true || c.is_active_inserted === "true" || c.is_active_inserted === "1"
      const keyOk = typeof c.api_key === "string" && c.api_key.length >= 20 && !c.api_key.includes("PLACEHOLDER")
      const secretOk = typeof c.api_secret === "string" && c.api_secret.length >= 10 && !c.api_secret.includes("PLACEHOLDER")
      return inserted && keyOk && secretOk
    })

    if (testable.length === 0) {
      return { tested: 0, passed: 0, failed: 0 }
    }

    const createExchangeConnector = await getExchangeConnectorFactory()
    let passed = 0
    let failed = 0

    for (const connection of testable) {
      try {
        const connector = await createExchangeConnector(connection.exchange, {
          apiKey: connection.api_key,
          apiSecret: connection.api_secret,
          apiType: connection.api_type || "live",
          contractType: connection.contract_type,
          subType: connection.api_subtype,
          isTestnet: connection.is_testnet === true || connection.is_testnet === "true",
        })
        const result = await connector.testConnection()
        await updateConnection(connection.id, {
          ...connection,
          last_test_status: result.success ? "success" : "failed",
          last_test_time: new Date().toISOString(),
          last_test_message: result.success ? "Connection verified at startup" : (result.error || "Test failed"),
        })
        if (result.success) passed += 1
        else failed += 1
      } catch (error) {
        failed += 1
        const errMsg = error instanceof Error ? error.message : String(error)
        await updateConnection(connection.id, {
          ...connection,
          last_test_status: "error",
          last_test_time: new Date().toISOString(),
          last_test_message: errMsg,
        })
      }
    }

    return { tested: testable.length, passed, failed }
  } catch {
    return { tested: 0, passed: 0, failed: 0 }
  }
}

export function startPeriodicConnectionTesting() {
  // Disabled in safe bootstrap mode.
}

export async function runPreStartup() {
  if (!shouldRunPreStartup()) return
  if (ran) return
  ran = true

  try {
    await initRedis()
    await runMigrations()
    await initializeDefaultSettings()
    await seedPredefinedConnections()
    await seedMarketData()
    await testAllExchangeConnections()

    const coordinator = getGlobalTradeEngineCoordinator()
    await coordinator.startAll()
  } catch (error) {
    console.error("[v0] Pre-startup failed:", error)
  }
}
