export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return
  }

  try {
    const { runPreStartup } = await import("@/lib/pre-startup")
    await runPreStartup()
  } catch (error) {
    console.error("[v0] Startup instrumentation failed:", error)
  }
}
