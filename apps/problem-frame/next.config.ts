import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained production server (.next/standalone/server.js) so the
  // Docker image can run without a full node_modules install. See ../docs/HOSTINGER_DEPLOY_PLAN.md.
  output: "standalone",
};

export default nextConfig;
