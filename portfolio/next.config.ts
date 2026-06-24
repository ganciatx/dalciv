import type { NextConfig } from "next";

/** Static export — served by FastAPI at site root (see dashboard/portfolio_site.py). */
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
