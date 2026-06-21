import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import "./react-calendar-custom.css";
import { AuthProvider } from "@/hooks/use-auth";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Klinik Yönetim Sistemi | Randevu Sistemi",
  description: "Modern klinik yönetim ve randevu sistemi.",
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
            {children}
          </AnalyticsProvider>
        </AuthProvider>
        <Toaster position="top-right" expand={true} richColors />
      </body>
    </html>
  );
}
