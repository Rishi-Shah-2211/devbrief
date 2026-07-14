import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Agent runs can take longer than the default limit on serverless.
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
