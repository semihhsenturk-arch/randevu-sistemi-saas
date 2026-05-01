import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["iyzipay"],
  outputFileTracingIncludes: {
    "/api/payment/**/*": ["./node_modules/iyzipay/lib/resources/**/*"],
  },
};

export default nextConfig;
