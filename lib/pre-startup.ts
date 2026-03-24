/**
 * Minimal pre-startup bootstrap.
 *
 * Important: keep this file free of direct imports to server-only connector
 * modules so Next.js dev compilation never resolves Node.js crypto/fs paths
 * unless we are in a safe server-only runtime.
 */

let ran = false

function shouldRunPreStartup(): boolean {
  console.log("[v0] shouldRunPreStartup check", {
    NEXT_RUNTIME: process.env.NEXT_RUNTIME,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PHASE: process.env.NEXT_PHASE,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV
  })
  
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
