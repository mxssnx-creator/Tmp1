export async function register() {
  console.log("[v0] instrumentation register invoked", {
    runtime: process.env.NEXT_RUNTIME,
    nodeEnv: process.env.NODE_ENV,
    phase: process.env.NEXT_PHASE,
  })

  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return
  }

  if (process.env.NEXT_PHASE?.includes("phase-development-server")) {
    console.log("[v0] Skipping instrumentation during dev server compilation")
    return
  }

  // Skip pre-startup in development and build-time contexts to avoid server-only imports
  if (process.env.NODE_ENV === "development") {
    console.log("[v0] Skipping pre-startup in development runtime")
    return
  }

  if (process.env.NEXT_PHASE?.includes("phase-development-server")) {
    console.log("[v0] Skipping pre-startup during dev server phase")
    return
  }

  if (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production") {
    console.log("[v0] Skipping pre-startup in Vercel production build")
    return
  }

  try {
    const { runPreStartup } = await import("@/lib/pre-startup")
    await runPreStartup()
  } catch (error) {
    console.error("[v0] Startup instrumentation failed:", error)
  }
}
