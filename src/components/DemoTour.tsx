"use client";

import { useEffect, useState } from "react";
import { Joyride, Step, CallBackProps, STATUS, ACTIONS, EVENTS } from "react-joyride";
import { usePathname, useRouter } from "next/navigation";

export function DemoTour() {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isDemo = localStorage.getItem("demo_mode") === "true";
    if (!isDemo) return;

    const seenMap = JSON.parse(localStorage.getItem("demo_tours_seen") || "{}");
    
    // Check if we've already toured this specific path
    if (!seenMap[pathname]) {
      let pageSteps: Step[] = [];

      if (pathname === "/takvim") {
        pageSteps = [
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
            content: "Harika! Şimdi FaceMap ve detaylı hasta profillerini görmek için sol menüdeki 'Hasta Listesi'ne tıklayalım.",
            placement: "right",
            title: "3. Hasta Listesine Geçiş",
            spotlightClicks: true
          }
        ];
      } else if (pathname === "/hasta-listesi") {
        pageSteps = [
          {
            target: "body",
            content: "Burası hasta listeniz. Listedeki herhangi bir hastanın ismine tıklayarak detaylı profiline ulaşabilirsiniz.",
            disableBeacon: true,
            placement: "center",
            title: "4. Hasta Detayları"
          },
          {
            target: "body",
            content: "Hasta profili içindeki gelişmiş FaceMap sekmesine tıklayarak, hastaların yüzünde işlem yapılan bölgeleri görsel olarak işaretleyebilir ve kaydedebilirsiniz.",
            placement: "center",
            title: "5. FaceMap ile İşlem Takibi"
          },
          {
            target: "#tour-link-stok-yonetimi",
            content: "Şimdi de kliniğinizin stoklarını nasıl otomatik yöneteceğinizi görmek için 'Stok Yönetimi'ne geçin.",
            placement: "right",
            title: "6. Stok Yönetimine Geçiş",
            spotlightClicks: true
          }
        ];
      } else if (pathname === "/stok-yonetimi") {
        pageSteps = [
          {
            target: "body",
            content: "Kliniğinizdeki botoks, dolgu, enjektör gibi tüm malzemelerin giriş-çıkışlarını takip edin. Azalan ürünlerde otomatik uyarı alırsınız.",
            disableBeacon: true,
            placement: "center",
            title: "7. Otomatik Stok Takibi"
          },
          {
            target: "#tour-link-dashboard",
            content: "Son adım! Yapay zeka ile kliniğinizin performansını incelemek için 'Analiz' sekmesine tıklayın.",
            placement: "right",
            title: "8. Analize Geçiş",
            spotlightClicks: true
          }
        ];
      } else if (pathname === "/dashboard") {
        pageSteps = [
          {
            target: "body",
            content: "Yapay zeka destekli grafiklerle aylık gelirinizi, en karlı hizmetlerinizi ve doluluk oranlarınızı buradan analiz edebilirsiniz.",
            disableBeacon: true,
            placement: "center",
            title: "9. AI Performans Analizi"
          }
        ];
      }

      if (pageSteps.length > 0) {
        setSteps(pageSteps);
        setRun(false);
        // Small delay to ensure page elements are mounted
        setTimeout(() => setRun(true), 1200);
      }
    }
  }, [pathname]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    // Optional: Auto-navigate if they click Next on the last step that points to a link
    if (action === ACTIONS.NEXT && type === EVENTS.STEP_AFTER && index === steps.length - 1) {
       if (pathname === "/takvim") router.push("/hasta-listesi");
       else if (pathname === "/hasta-listesi") router.push("/stok-yonetimi");
       else if (pathname === "/stok-yonetimi") router.push("/dashboard");
    }

    if (finishedStatuses.includes(status)) {
      setRun(false);
      const seenMap = JSON.parse(localStorage.getItem("demo_tours_seen") || "{}");
      seenMap[pathname] = true;
      localStorage.setItem("demo_tours_seen", JSON.stringify(seenMap));
    }
  };

  if (!run || steps.length === 0) return null;

  return (
    <Joyride
      key={pathname}
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
        last: pathname === "/dashboard" ? "Bitir" : "İleri",
        next: "İleri",
        skip: "Turu Kapat"
      }}
    />
  );
}
