export async function register() {
  console.log("[v0] instrumentation.register() called", { 
    runtime: process.env.NEXT_RUNTIME, 
    env: process.env.NODE_ENV,
    phase: process.env.NEXT_PHASE 
  })
  
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    console.log("[v0] Skipping - not nodejs runtime")
    return
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[v0] Skipping - development mode")
    return
  }

  if (process.env.NEXT_PHASE?.includes("development")) {
    console.log("[v0] Skipping - development server phase")
    return
  }

  if (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production") {
    console.log("[v0] Skipping - Vercel production")
    return
  }

  console.log("[v0] Proceeding with pre-startup in production...")
  
  try {
    const { runPreStartup } = await import("@/lib/pre-startup")
    await runPreStartup()
  } catch (error) {
    console.error("[v0] Startup instrumentation failed:", error)
  }
}
