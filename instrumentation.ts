export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return
  }

  // Initialize production error handlers FIRST (before any other startup)
  try {
    const { default: ProductionErrorHandler } = await import("@/lib/error-handling-production")
    ProductionErrorHandler.initialize()
  } catch (error) {
    console.error("[ERROR_HANDLER] Failed to initialize production error handlers:", error)
  }

  // Initialize error handling integration (circuit breakers, metrics, etc.)
  try {
    const { initializeErrorHandling } = await import("@/lib/error-handling-integration")
    initializeErrorHandling()
  } catch (error) {
    console.error("[ERROR_INTEGRATION] Failed to initialize error handling integration:", error)
  }

  // Run migrations and initialize database
  try {
    console.log("[STARTUP] Initializing database and running migrations...")
    const { initRedis } = await import("@/lib/redis-db")
    const { runMigrations } = await import("@/lib/redis-migrations")
    
    await initRedis()
    await runMigrations()
    console.log("[STARTUP] ✓ Migrations completed successfully")
  } catch (error) {
    console.error("[STARTUP] Failed to run migrations:", error)
    // Don't fail startup on migration errors, but log them
  }

  return
}
