import type { Metadata } from "next";
import LandingPageContent from "@/components/LandingPageContent";

export const metadata: Metadata = {
  title: "Dermofis | Klinik Yönetim Sistemi ve Randevu Sistemi",
  description: "Modern kliniklerin iş akışını dijitalleştiren, hasta deneyimini iyileştiren bulut tabanlı klinik yönetim sistemi.",
  alternates: {
    canonical: "https://dermofis.com",
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Dermofis",
    operatingSystem: "Web",
    applicationCategory: "BusinessApplication",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "124",
    },
    offers: {
      "@type": "Offer",
      price: "999.00",
      priceCurrency: "TRY",
    },
    description: "Modern klinik yönetim ve randevu sistemi. İşlerinizi otomatiğe bağlayın.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageContent />
    </>
  );
}
