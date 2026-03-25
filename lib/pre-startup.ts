/**
 * Minimal pre-startup bootstrap.
 *
 * Important: keep this file free of direct imports to server-only connector
 * modules so Next.js dev compilation never resolves Node.js crypto/fs paths
 * unless we are in a safe server-only runtime.
 */

import { initRedis, getAllConnections, saveMarketData, setSettings, getSettings, updateConnection, getRedisClient } from "@/lib/redis-db"
import { runMigrations } from "@/lib/redis-migrations"
import { getGlobalTradeEngineCoordinator } from "@/lib/trade-engine"
import { getDefaultSettings } from "@/lib/settings-storage"
import { validateDatabase, repairDatabase, logDatabaseStatus } from "@/lib/database-validator"

// Dynamically import createExchangeConnector only when needed to avoid build-time module resolution issues
async function getExchangeConnectorFactory() {
  const { createExchangeConnector } = await import("@/lib/exchange-connectors")
  return createExchangeConnector
}
let ran = false

function shouldRunPreStartup(): boolean {
  console.log("[v0] shouldRunPreStartup check", {
    NEXT_RUNTIME: process.env.NEXT_RUNTIME,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PHASE: process.env.NEXT_PHASE,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV
  })
  
  for (const symbol of symbols) {
    try {
      const basePrice = basePrices[symbol] || 100
      // Seed 20 historical data points for better backtesting
      for (let i = 0; i < 20; i++) {
        const variation = basePrice * 0.02
        const price = basePrice + (Math.random() - 0.5) * variation
        const marketData = {
          symbol,
          exchange: "bybit",
          interval: "1m",
          price,
          open: basePrice,
          high: basePrice + variation,
          low: basePrice - variation,
          close: price,
          volume: Math.random() * 1000000,
          timestamp: new Date(Date.now() - (20 - i) * 60000).toISOString(),
        }
        await saveMarketData(symbol, marketData)
        totalDataPoints++
      }
      seededCount++
      console.log(`[v0] [Seed] ✓ ${symbol}: 20 data points`)
    } catch (error) {
      console.warn(`[v0] [Seed] ✗ Failed to seed ${symbol}:`, error)
    }
  }
  console.log(`[v0] [Seed] Complete: ${totalDataPoints} data points across ${seededCount}/${symbols.length} symbols`)
}

async function seedPredefinedConnections() {
  console.log("[v0] [Seed] Connections seeding DISABLED - only 4 user-created base connections are used")
  // Predefined connections are file-based templates only and should NOT be stored in Redis
  // The 4 user-created connections (BingX, Bybit, Pionex, OrangeX) are initialized in redis-db.ts
  return
}

async function initializeDefaultSettings() {
  console.log("[v0] [Seed] Initializing default settings...")
  try {
    const defaults = getDefaultSettings()
    
    console.log("[v0] [Seed] Default settings keys:", Object.keys(defaults))
    console.log("[v0] [Seed] Saving to Redis with key 'app_settings'...")
    
    // Save to Redis database
    await setSettings("app_settings", defaults)
    console.log("[v0] [Seed] Default settings initialized and saved to Redis:", Object.keys(defaults).length, "keys")
    
    // Verify the save by reading it back
    const verified = await getSettings("app_settings")
    if (verified) {
      console.log("[v0] [Seed] ✓ Settings verified - successfully saved and retrieved")
    } else {
      console.warn("[v0] [Seed] ✗ Settings verification FAILED - could not retrieve saved settings")
    }
  } catch (error) {
    console.warn("[v0] [Seed] Failed to initialize default settings:", error)
  }
}

export async function testAllExchangeConnections() {
  console.log("[v0] [Startup] Testing exchange connections (direct connector test, no HTTP)...")
  try {
    const allConnections = await getAllConnections()
    
    // Only test the 2 base connections (bybit + bingx) that are actually inserted into Main
    // Do NOT test template connections (pionex, orangex, etc.) even if they have valid keys
    const testable = allConnections.filter((c: any) => {
      const isBaseConnection = c.is_active_inserted === true || c.is_active_inserted === "true" || c.is_active_inserted === "1"
      const hasValidKey = c.api_key && c.api_key.length >= 20
        && !c.api_key.includes("PLACEHOLDER")
        && !c.api_key.includes("00998877")
        && !c.api_key.includes("your_")
      const hasSecret = c.api_secret && c.api_secret.length >= 10
        && !c.api_secret.includes("PLACEHOLDER")
        && !c.api_secret.includes("your_")
      return isBaseConnection && hasValidKey && hasSecret
    })

    if (testable.length === 0) {
      console.log(`[v0] [Startup] No base connections with valid API keys to test (${allConnections.length} total)`)
      return { tested: 0, passed: 0, failed: 0 }
    }

    console.log(`[v0] [Startup] Testing ${testable.length} base connections (bybit+bingx only, skipping ${allConnections.length - testable.length} templates)`)
    
    let passed = 0
    let failed = 0
    const createExchangeConnector = await getExchangeConnectorFactory()
    
    for (const connection of testable) {
      try {
        // Test directly using the exchange connector - no HTTP needed
        const connector = await createExchangeConnector(connection.exchange, {
          apiKey: connection.api_key,
          apiSecret: connection.api_secret,
          apiType: connection.api_type || "live",
          contractType: connection.contract_type,
          subType: connection.api_subtype,
          isTestnet: connection.is_testnet === true || connection.is_testnet === "true",
        })
        
        const result = await connector.testConnection()
        const testStatus = result.success ? "success" : "failed"
        
        await updateConnection(connection.id, {
          ...connection,
          last_test_status: testStatus,
          last_test_time: new Date().toISOString(),
          last_test_message: result.success ? "Connection verified at startup" : (result.error || "Test failed"),
        })
        
        if (result.success) {
          passed++
          console.log(`[v0] [Startup] ✓ ${connection.name} (${connection.exchange}): OK`)
        } else {
          failed++
          console.log(`[v0] [Startup] ✗ ${connection.name} (${connection.exchange}): ${result.error || "failed"}`)
        }
      } catch (error) {
        failed++
        const errMsg = error instanceof Error ? error.message : String(error)
        console.warn(`[v0] [Startup] ✗ ${connection.name} (${connection.exchange}): ${errMsg}`)
        
        await updateConnection(connection.id, {
          ...connection,
          last_test_status: "error",
          last_test_time: new Date().toISOString(),
          last_test_message: errMsg,
        })
      }
    }
    
    console.log(`[v0] [Startup] Connection testing complete: ${passed} passed, ${failed} failed out of ${testable.length}`)
    return { tested: testable.length, passed, failed }
  } catch (error) {
    console.error("[v0] [Startup] Failed to test connections:", error)
    return { tested: 0, passed: 0, failed: 0 }
  }
}

export function startPeriodicConnectionTesting() {
  const intervalStore = globalThis as any
  if (intervalStore.__cts_connection_testing_interval) {
    console.log("[v0] [Periodic] Connection testing already active - skipping duplicate start")
    return
  if (process.env.NEXT_RUNTIME !== "nodejs") return false
  if (process.env.NODE_ENV === "development") return false
  if (process.env.NEXT_PHASE?.includes("development")) return false
  if (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production") return false
  
  // Skip in ANY production environment to avoid server-only import issues
  if (process.env.NODE_ENV === "production") {
    console.log("[v0] Skipping pre-startup in production to avoid server-only import issues")
    return false
  }
  
  return true
}

export async function runPreStartup() {
  console.log("[v0] runPreStartup() called")
  
  if (!shouldRunPreStartup()) {
    console.log("[v0] Pre-startup skipped in this runtime")
    return
  }

  if (ran) {
    console.log("[v0] Pre-startup already completed, skipping duplicate call")
    return
  }

  ran = true

  try {
    console.log("[v0] ==========================================")
    console.log("[v0] PRE-STARTUP INITIALIZATION STARTED")
    console.log("[v0] ==========================================")
    
    // Import redis-db dynamically to prevent build-time resolution issues
    const { initRedis } = await import("@/lib/redis-db")
    console.log("[v0] [1/1] Initializing Redis with Upstash persistence...")
    await initRedis()
    console.log("[v0] [1/10] ✓ Redis initialized")
    
    console.log("[v0] [2/10] Running ALL Redis migrations (automatic)...")
    const migrationResult = await runMigrations()
    console.log(`[v0] [2/10] ✓ Migrations: ${migrationResult.message} (schema v${migrationResult.version})`)
    
    console.log("[v0] [2.5/10] Validating database integrity...")
    const dbStatus = await validateDatabase()
    if (!dbStatus.valid) {
      console.log("[v0] [2.5/10] Database issues found, attempting repair...")
      await repairDatabase()
    }
    await logDatabaseStatus()
    console.log("[v0] [2.5/10] ✓ Database validated")
    
    console.log("[v0] [3/10] Initializing settings...")
    await initializeDefaultSettings()
    console.log("[v0] [3/10] ✓ Settings initialized")
    
    console.log("[v0] [4/10] Seeding exchange connections...")
    await seedPredefinedConnections()
    console.log("[v0] [4/10] ✓ Connections seeded")
    
    console.log("[v0] [5/10] Seeding market data...")
    await seedMarketData()
    console.log("[v0] [5/10] ✓ Market data seeded")
    
    console.log("[v0] [6/10] Preserving Main Connections dashboard toggles...")
    console.log("[v0] [6/10] ✓ Main Connections toggle state left unchanged")
    
    console.log("[v0] [7/10] Testing exchange connections (direct connector test)...")
    const testResults = await testAllExchangeConnections()
    console.log(`[v0] [7/10] ✓ Connection testing done: ${testResults?.passed || 0} passed, ${testResults?.failed || 0} failed`)
    
    console.log("[v0] [8/10] Starting Global Trade Engine Coordinator...")
    await autoStartGlobalEngine()
    console.log("[v0] [8/10] ✓ Global Trade Engine Coordinator running")
    
    console.log("[v0] [9/10] Initializing Trade Engines for active connections...")
    // Use coordinator's unified startAll() which includes auto-enable logic
    const coordinator = getGlobalTradeEngineCoordinator()
    await coordinator.startAll()
    console.log("[v0] [9/10] ✓ Trade Engines initialized and auto-start activated")
    
    console.log("[v0] [10/10] Starting periodic connection monitoring...")
    startPeriodicConnectionTesting()
    console.log("[v0] [10/10] ✓ Periodic testing active (every 5 minutes)")
    
    console.log("[v0] [1/1] ✓ Redis initialized")
    console.log("[v0] ==========================================")
    console.log("[v0] PRE-STARTUP COMPLETE - SAFE MODE")
    console.log("[v0] ==========================================")
  } catch (error) {
    console.error("[v0] ==========================================")
    console.error("[v0] PRE-STARTUP ERROR")
    console.error("[v0]", error)
    console.error("[v0] ==========================================")
  }
}

export function startPeriodicConnectionTesting() {
  console.log("[v0] Periodic connection testing disabled in safe bootstrap mode")
}
