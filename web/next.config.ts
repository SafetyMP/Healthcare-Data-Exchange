import type { NextConfig } from "next";

const gatewayUrl = process.env.CHEX_GATEWAY_URL ?? "http://127.0.0.1:8081";

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${gatewayUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
