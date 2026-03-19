const BINGX_KEY_ALIASES = ["BINGX_API_KEY", "BINGX_APIKEY", "NEXT_BINGX_API_KEY", "NEXT_PUBLIC_BINGX_API_KEY"]
const BINGX_SECRET_ALIASES = ["BINGX_API_SECRET", "BINGX_SECRET", "NEXT_BINGX_API_SECRET", "NEXT_PUBLIC_BINGX_API_SECRET"]

function cleanEnvValue(raw: string | undefined): string {
  if (!raw) return ""
  return raw.trim().replace(/^['\"]|['\"]$/g, "")
}

export function readEnvByAliases(aliases: string[]): string {
  for (const key of aliases) {
    const value = cleanEnvValue(process.env[key])
    if (value.length > 0) return value
  }
  return ""
}

export function readBingxCredentialsFromEnv(): { apiKey: string; apiSecret: string; hasCredentials: boolean } {
  const apiKey = readEnvByAliases(BINGX_KEY_ALIASES)
  const apiSecret = readEnvByAliases(BINGX_SECRET_ALIASES)
  const hasCredentials = apiKey.length > 10 && apiSecret.length > 10
  return { apiKey, apiSecret, hasCredentials }
}
