// Minimal instrumentation - not registering anything to prevent startup hangs
export async function register() {
  console.log("[v0] Instrumentation loaded but disabled for testing")
  return Promise.resolve()
}