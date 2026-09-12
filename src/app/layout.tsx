import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import "./react-calendar-custom.css";
import { AuthProvider } from "@/hooks/use-auth";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { ApplePencilFix } from "@/components/ApplePencilFix";
import { CookieBanner } from "@/components/CookieBanner";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://dermofis.com"),
  title: {
    default: "Dermofis | Klinik Yönetim Sistemi ve Randevu Sistemi",
    template: "%s | Dermofis",
  },
  description: "Modern kliniklerin iş akışını dijitalleştiren, hasta deneyimini iyileştiren bulut tabanlı klinik yönetim sistemi.",
  keywords: ["klinik yönetim sistemi", "randevu sistemi", "hasta takibi", "estetik klinik yazılımı", "dermatoloji klinik programı", "stok yönetimi", "onam formu", "yüz haritası"],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://dermofis.com",
    siteName: "Dermofis",
    title: "Dermofis | Klinik Yönetim Sistemi",
    description: "Modern klinik yönetim ve randevu sistemi. İşlerinizi otomatiğe bağlayın.",
    images: [
      {
        url: "/Dermofis_05.png",
        width: 1200,
        height: 630,
        alt: "Dermofis Dashboard Önizlemesi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dermofis | Klinik Yönetim Sistemi",
    description: "Modern klinik yönetim ve randevu sistemi.",
    images: ["/Dermofis_05.png"],
  },
};

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${outfit.className} antialiased`}>
        <AuthProvider>
          <AnalyticsProvider>
            <ApplePencilFix />
            {children}
          </AnalyticsProvider>
        </AuthProvider>
        <CookieBanner />
        <Toaster position="top-right" expand={true} richColors />
      </body>
    </html>
  );
}
