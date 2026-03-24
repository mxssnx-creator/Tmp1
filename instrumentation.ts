export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return
  }

  // Skip pre-startup ONLY during Vercel build time - not runtime
  // Kilo/other hosts can still run pre-startup as they have Node.js runtime
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
