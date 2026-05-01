import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "iyzipay",
    "postman-request",
    "extend",
    "@postman/form-data",
    "@postman/tough-cookie",
    "@postman/tunnel-agent",
    "aws-sign2",
    "aws4",
    "caseless",
    "combined-stream",
    "forever-agent",
    "http-signature",
    "is-typedarray",
    "isstream",
    "json-stringify-safe",
    "mime-types",
    "oauth-sign",
    "qs",
    "safe-buffer",
    "socks-proxy-agent",
    "stream-length",
    "uuid"
  ],
  outputFileTracingIncludes: {
    "/api/payment/**/*": [
      "./node_modules/iyzipay/**/*",
      "./node_modules/postman-request/**/*",
      "./node_modules/extend/**/*",
      "./node_modules/@postman/form-data/**/*",
      "./node_modules/@postman/tough-cookie/**/*",
      "./node_modules/@postman/tunnel-agent/**/*",
      "./node_modules/aws-sign2/**/*",
      "./node_modules/aws4/**/*",
      "./node_modules/caseless/**/*",
      "./node_modules/combined-stream/**/*",
      "./node_modules/forever-agent/**/*",
      "./node_modules/http-signature/**/*",
      "./node_modules/is-typedarray/**/*",
      "./node_modules/isstream/**/*",
      "./node_modules/json-stringify-safe/**/*",
      "./node_modules/mime-types/**/*",
      "./node_modules/oauth-sign/**/*",
      "./node_modules/qs/**/*",
      "./node_modules/safe-buffer/**/*",
      "./node_modules/socks-proxy-agent/**/*",
      "./node_modules/stream-length/**/*",
      "./node_modules/uuid/**/*"
    ],
  },
};

export default nextConfig;
