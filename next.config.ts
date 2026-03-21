import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Tell Next.js/webpack to treat these Node.js built-in modules as external
  // so they are not bundled into the client or edge builds.
  serverExternalPackages: ["crypto"],
};

export default nextConfig;
