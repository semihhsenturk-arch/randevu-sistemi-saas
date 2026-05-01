import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["iyzipay", "postman-request", "extend"],
  outputFileTracingIncludes: {
    "/api/payment/**/*": [
      "./node_modules/iyzipay/**/*",
      "./node_modules/postman-request/**/*",
      "./node_modules/extend/**/*"
    ],
  },
};

export default nextConfig;
