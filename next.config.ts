import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gereksiz external paketleri ve tracing'i kaldırdık.
  // Modern fetch tabanlı çözüm kullanacağımız için bunlara gerek kalmadı.
};

export default nextConfig;
