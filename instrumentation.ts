export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return
  }

  // Skip during build time - only run on actual server start
  if (process.env.VERCEL === "1" || process.env.NEXT_PUBLIC_APP_URL) {
    // Don't run pre-startup during Vercel build - it's handled differently
    // The app uses Redis/Upstash which is initialized differently on Vercel
    console.log("[v0] Skipping pre-startup in serverless/build environment")
    return
  }

  try {
    const { runPreStartup } = await import("@/lib/pre-startup")
    await runPreStartup()
  } catch (error) {
    console.error("[v0] Startup instrumentation failed:", error)
  }
}
