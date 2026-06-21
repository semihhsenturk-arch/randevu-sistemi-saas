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
      content: "Bu ekrandan randevularınızı gün, hafta veya ay bazında görebilir ve sürükle-bırak ile yönetebilirsiniz.",
      disableBeacon: true,
      placement: "bottom",
      title: "Takvim Görünümü"
    },
    {
      target: "#tour-add-appointment",
      content: "Yeni bir randevu oluşturmak için buraya tıklayın. Hızlıca yeni hasta ekleyebilirsiniz.",
      placement: "bottom",
      title: "Randevu Ekleme"
    },
    {
      target: "#tour-waiting-room",
      content: "Bekleme odasındaki hastalarınızı ve sıradaki işlemleri buradan takip edebilir, randevuları anında onaylayabilirsiniz.",
      placement: "left",
      title: "Bekleme Odası"
    },
    {
      target: "#tour-nav-menu",
      content: "Sol menüden hasta profillerine, stok yönetimine, dijital onam formlarına ve detaylı finansal analizlere ulaşabilirsiniz.",
      placement: "right",
      title: "Kapsamlı Yönetim"
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
