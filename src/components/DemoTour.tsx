"use client";

import { useEffect, useState } from "react";
import { Joyride, Step, CallBackProps, STATUS } from "react-joyride";

export function DemoTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Only run if in demo mode and haven't seen the tour yet
    if (typeof window !== "undefined") {
      const isDemo = localStorage.getItem("demo_mode") === "true";
      const hasSeenTour = localStorage.getItem("demo_tour_seen") === "true";
      
      // Delay slightly to ensure elements are mounted
      if (isDemo && !hasSeenTour) {
        setTimeout(() => setRun(true), 1000);
      }
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem("demo_tour_seen", "true");
    }
  };

  const steps: Step[] = [
    {
      target: "#tour-calendar-view",
      content: "Bu ekrandan tüm randevularınızı gün, hafta veya ay bazında görebilir ve sürükle-bırak ile yönetebilirsiniz.",
      disableBeacon: true,
      placement: "bottom",
      title: "1. Takvimde Randevuları Görün"
    },
    {
      target: "#tour-add-appointment",
      content: "Yeni bir randevu oluşturmak için buraya tıklayın. Hızlıca randevu ve hasta kaydı açabilirsiniz.",
      placement: "bottom",
      title: "2. Yeni Randevu Oluşturun"
    },
    {
      target: "#tour-link-hasta-listesi",
      content: "Hastalarınızın geçmiş randevularını, aldıkları tedavileri ve tüm dijital formlarını buradan detaylıca inceleyebilirsiniz.",
      placement: "right",
      title: "3. Hasta Profili Detayları"
    },
    {
      target: "#tour-link-hasta-listesi", // FaceMap is inside patients
      content: "Hasta profili içindeki gelişmiş FaceMap modülüyle, hastalarınızın yüzünde işlem yapılan bölgeleri görsel olarak işaretleyip kaydedebilirsiniz.",
      placement: "right",
      title: "4. FaceMap ile Tedavi Bölgeleri"
    },
    {
      target: "#tour-link-stok-yonetimi",
      content: "Kliniğinizdeki botoks, dolgu, enjektör gibi tüm malzemelerin giriş-çıkışlarını takip edin. Azalan ürünlerde otomatik uyarı alın.",
      placement: "right",
      title: "5. Otomatik Stok Takibi"
    },
    {
      target: "#tour-link-dashboard",
      content: "Yapay zeka destekli grafiklerle kliniğinizin aylık gelirini, en karlı hizmetleri ve doluluk oranlarını tek ekranda analiz edin.",
      placement: "right",
      title: "6. AI ile Performans Analizi"
    }
  ];

  if (!run) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      disableOverlayClose={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#0a3d34",
          zIndex: 10000,
        },
        buttonClose: {
          display: "none",
        },
        buttonSkip: {
          color: "#64748b",
        },
        tooltipContainer: {
          textAlign: "left"
        },
        tooltipTitle: {
          fontSize: "1.1rem",
          fontWeight: "bold",
          color: "#1e293b",
          marginBottom: "0.5rem"
        },
        tooltipContent: {
          fontSize: "0.9rem",
          color: "#475569",
          padding: "0"
        }
      }}
      locale={{
        back: "Geri",
        close: "Kapat",
        last: "Bitir",
        next: "İleri",
        skip: "Turu Geç"
      }}
    />
  );
}
