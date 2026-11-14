import type { NextConfig } from "next";

const gatewayUrl = process.env.CHEX_GATEWAY_URL ?? "http://127.0.0.1:8081";
const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const basePath = isDemo
  ? (process.env.NEXT_PUBLIC_BASE_PATH ?? "/Healthcare-Data-Exchange")
  : "";

const nextConfig: NextConfig = {
  ...(isDemo ? { output: "export", basePath, trailingSlash: true } : {}),
  turbopack: {
    root: import.meta.dirname,
  },
  ...(isDemo ? {} : { async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${gatewayUrl}/:path*`,
      },
    ];
  } }),
};

export default nextConfig;
