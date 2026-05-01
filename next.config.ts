import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/payment/**/*": [
      "./node_modules/iyzipay/**/*",
      "./node_modules/postman-request/**/*"
    ],
  },
};

export default nextConfig;
