import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["iyzipay"],
  experimental: {
    outputFileTracingIncludes: {
      "/api/payment/**/*": ["./node_modules/iyzipay/lib/resources/**/*"],
    },
  },
};

export default nextConfig;
