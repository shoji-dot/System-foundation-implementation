import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@yakuji/shared", "@yakuji/ui"],
  typedRoutes: true,
};

export default nextConfig;
