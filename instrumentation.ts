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

  // Pre-startup bootstrap disabled here to avoid bundling
  // server-only exchange connector modules in instrumentation.
  return
}
