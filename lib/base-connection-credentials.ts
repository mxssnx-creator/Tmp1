export type BaseConnectionId = "bybit-x03" | "bingx-x01" | "pionex-x01" | "orangex-x01"

export type BaseConnectionCredentials = {
  apiKey: string
  apiSecret: string
}

/**
 * Real credentials stored directly as predefined variables for canonical base connections.
 */
export const BASE_CONNECTION_CREDENTIALS: Record<BaseConnectionId, BaseConnectionCredentials> = {
  "bybit-x03": {
    apiKey: "4Gba1MjGbrTTfDAauP",
    apiSecret: "QYtOgsHZThh3koyBUDK0DCMUjq3ihmD7YBB2",
  },
  "bingx-x01": {
    apiKey: "5MdpxA3eWbqSH3JZ5w6cdCK3Sd19Z2mPiNpmfAPfa5kmPB5bquHn8D8qDXzx2HhnyRLmrCQgpphI8DbLLZQw",
    apiSecret: "5uRfPgalVBD9DFAD5McQfbpAWmtiYGiinwiWSMX4Bii9SNPigJXsM1KnLCXT1reH5Wzcvj6RQmIvJrCUgaIhuw",
  },
  "pionex-x01": {
    apiKey: "5qYgjSMoB4yZHbyEmvUZXNS9CbxePn8JZPGVPX583dSavuradn5Ph2RBCKhMrZ2A36",
    apiSecret: "BpIL7YjAyXkWIoLWgCw3PMmCCr1uJsIttSA8VMhBMBFcLX3mziuQUM1KQ31S1BYW",
  },
  "orangex-x01": {
    apiKey: "c0c89d0f",
    apiSecret: "b89147149b54e11e36e1514b",
  },
}

export function getBaseConnectionCredentials(id: BaseConnectionId): BaseConnectionCredentials {
  return BASE_CONNECTION_CREDENTIALS[id]
}
