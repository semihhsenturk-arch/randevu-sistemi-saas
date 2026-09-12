"use client";

import { useEffect, useState, useCallback } from "react";
import { Joyride, Step, STATUS, ACTIONS, EVENTS, TooltipRenderProps } from "react-joyride";
import { usePathname, useRouter } from "next/navigation";

// Custom Premium Tooltip Component for Joyride
const CustomTooltip = ({
  index,
  step,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
}: TooltipRenderProps) => {
  return (
    <div 
      {...tooltipProps} 
      className="bg-white/95 backdrop-blur-xl rounded-[1.25rem] shadow-2xl border border-white/40 ring-1 ring-slate-900/5 overflow-hidden w-[calc(100vw-32px)] md:w-[380px] mx-auto z-[10000] font-sans"
    >
      <div className="p-6 flex flex-col gap-4">
        {/* Header part */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-[#0a3d34]/20 to-[#0a3d34]/5 text-[#0a3d34] text-xs font-bold ring-1 ring-[#0a3d34]/10 shadow-sm">
              {index + 1}
            </div>
            <span className="text-slate-400 text-[0.65rem] font-bold tracking-widest uppercase">
              Adım {index + 1} / {size}
            </span>
          </div>
          <button 
            {...skipProps} 
            className="text-slate-400 hover:text-slate-700 transition-colors rounded-lg p-1.5 hover:bg-slate-100/80"
            title="Turu Kapat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Title and Content */}
        <div className="flex flex-col gap-2">
          <h3 className="text-slate-800 font-bold text-lg tracking-tight leading-tight">
            {step.title}
          </h3>
          <p className="text-slate-500 font-medium text-[0.925rem] leading-relaxed">
            {step.content}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-50/50 px-6 py-4 flex items-center justify-between border-t border-slate-100/60">
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: size }).map((_, i) => (
             <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-500 ${i === index ? 'w-6 bg-gradient-to-r from-[#0a3d34] to-[#125c50]' : 'w-1.5 bg-slate-200'}`} 
            />
          ))}
        </div>
        <div className="flex gap-2 items-center">
          {index > 0 && (
            <button 
              {...backProps} 
              className="px-3 py-2 rounded-xl text-[0.8rem] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Geri
            </button>
          )}
          <button 
            {...primaryProps} 
            className="px-4 py-2 rounded-xl text-[0.8rem] font-bold text-white bg-gradient-to-b from-[#0a3d34] to-[#072b24] shadow-[0_2px_10px_-3px_rgba(10,61,52,0.5)] hover:shadow-[0_4px_15px_-4px_rgba(10,61,52,0.6)] hover:-translate-y-0.5 transition-all flex items-center gap-1.5 active:scale-95"
          >
            {isLastStep ? 'Turu Bitir' : 'İleri'}
            {!isLastStep && (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            )}
            {isLastStep && (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const getStepsForPath = (pathname: string): any[] => {
  if (pathname === "/takvim") {
    return [
      {
        target: "body",
        content: "İş akışınızı tek ekranda yönetin. Sürükle-bırak özelliği sayesinde randevularınızı kolayca organize ederek zamandan tasarruf edebilirsiniz.",
        placement: "center",
        title: "🗓 Akıllı Takvim ile Tanışın"
      },
      {
        target: "#tour-add-appointment",
        content: "Yeni hasta kaydı oluşturmak ve randevu planlamak artık çok kolay. İşlemlerinizi saniyeler içinde tamamlayarak hasta deneyimini iyileştirin.",
        placement: "bottom",
        title: "⚡️ Hızlı Randevu"
      },
      {
        target: "#tour-link-hasta-listesi",
        content: "Hastalarınızın detaylı tedavi geçmişini ve yapay zeka destekli FaceMap (Yüz Haritası) özelliğini keşfetmek için Hasta Listesine göz atalım.",
        placement: "right",
        title: "👥 Hasta Profilleri",
        spotlightClicks: true
      }
    ];
  } else if (pathname === "/hasta-listesi") {
    return [
      {
        target: "body",
        content: "Kliniğinizin en değerli varlığı olan hasta verilerinizi güvenle saklayın. Arama ve filtreleme ile istediğiniz bilgiye anında ulaşın.",
        placement: "center",
        title: "🗂 Merkezi Hasta Yönetimi"
      },
      {
        target: "body",
        content: "Estetik ve dermatolojik işlemleri hasta yüz haritası üzerinde görsel olarak işaretleyin. Tedavi gelişimini öncesi/sonrası fotoğraflarla profesyonelce takip edin.",
        placement: "center",
        title: "✨ FaceMap & Görsel Takip"
      },
      {
        target: "#tour-link-stok-yonetimi",
        content: "Uygulanan her işlemde sarf malzemelerinizin otomatik olarak nasıl güncellendiğini görmek için Stok Yönetimi modülüne ilerleyelim.",
        placement: "right",
        title: "📦 Stok Entegrasyonu",
        spotlightClicks: true
      }
    ];
  } else if (pathname === "/stok-yonetimi") {
    return [
      {
        target: "body",
        content: "Malzeme kayıplarına ve stok tükenme riskine son. Kritik seviyeye düşen ürünler için otomatik uyarılar alarak tedarik sürecinizi güvenceye alın.",
        placement: "center",
        title: "📊 Akıllı Stok Takibi"
      },
      {
        target: "#tour-link-dashboard",
        content: "Kliniğinizin finansal durumunu, ciro büyümesini ve operasyonel metrikleri görmek için Analiz ve Raporlama paneline geçelim.",
        placement: "right",
        title: "📈 Finans ve Analiz",
        spotlightClicks: true
      }
    ];
  } else if (pathname === "/hizmet-yonetimi") {
    return [
      {
        target: "body",
        content: "Sunduğunuz hizmetleri kategorize edin, işlem sürelerini ve fiyatlandırmaları belirleyin. Randevu alırken sistem fiyatı ve süreyi otomatik hesaplasın.",
        placement: "center",
        title: "⚙️ Hizmet Yapılandırması"
      },
    ];
  } else if (pathname === "/dashboard") {
    return [
      {
        target: "body",
        content: "Aylık cironuz, personel bazlı performans ve hizmet doluluk oranlarınız tek bir ekranda. Veriye dayalı kararlar alarak kliniğinizi büyütün.",
        placement: "center",
        title: "🎯 Kapsamlı Raporlama"
      },
      {
        target: "#tour-link-hizmet-yonetimi",
        content: "Son olarak, randevu sisteminin temelini oluşturan işlem süreleri ve fiyat tanımlamalarını görmek için Hizmet Yönetimine göz atalım.",
        placement: "right",
        title: "⚙️ Hizmet Yönetimine Geçiş",
        spotlightClicks: true
      }
    ];
  }
  return [];
};

export function DemoTour() {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  const initTour = useCallback((forceRun = false) => {
    if (typeof window === "undefined") return;
    const isDemo = sessionStorage.getItem("demo_mode") === "true";
    if (!isDemo) return;

    // Check if tours are enabled — default to true if not set (first visit)
    const toursEnabled = sessionStorage.getItem("demo_tours_enabled") !== "false";
    
    const seenMap = JSON.parse(sessionStorage.getItem("demo_tours_seen") || "{}");
    const pageSteps = getStepsForPath(pathname);
    
    if (pageSteps.length > 0) {
      setSteps(pageSteps);
      
      // Auto-start only if:
      // 1. Tours are enabled AND we haven't seen this page's tour yet, OR
      // 2. Explicitly forced (e.g. clicking "Site Turu" button)
      if (forceRun || (toursEnabled && !seenMap[pathname])) {
        setRun(false);
        setTimeout(() => setRun(true), forceRun ? 300 : 1200);
      }
    }
  }, [pathname]);

  useEffect(() => {
    initTour();
  }, [initTour]);

  // Global listener for manual tour start via "Site Turu" button in the Banner
  useEffect(() => {
    const handleStartDemoTour = () => {
      initTour(true);
    };
    window.addEventListener("start_demo_tour", handleStartDemoTour);
    return () => window.removeEventListener("start_demo_tour", handleStartDemoTour);
  }, [initTour]);

  // Listen for tours enabled/disabled toggle
  useEffect(() => {
    const handleToursToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      const enabled = customEvent.detail?.enabled;
      if (enabled) {
        // When re-enabled, reset all seen states so tours show again
        sessionStorage.removeItem("demo_tours_seen");
        // Trigger the current page's tour
        initTour(true);
      } else {
        // When disabled, stop any running tour
        setRun(false);
      }
    };
    window.addEventListener("toggle_demo_tours", handleToursToggle);
    return () => window.removeEventListener("toggle_demo_tours", handleToursToggle);
  }, [initTour]);

  const handleJoyrideCallback = (data: any) => {
    const { status, action, index, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (action === ACTIONS.NEXT && type === EVENTS.STEP_AFTER && index === steps.length - 1) {
       if (pathname === "/takvim") router.push("/hasta-listesi");
       else if (pathname === "/hasta-listesi") router.push("/stok-yonetimi");
       else if (pathname === "/stok-yonetimi") router.push("/dashboard");
       else if (pathname === "/dashboard") router.push("/hizmet-yonetimi");
    }

    if (finishedStatuses.includes(status) || action === ACTIONS.CLOSE) {
      setRun(false);
      // Mark this page's tour as seen
      const seenMap = JSON.parse(sessionStorage.getItem("demo_tours_seen") || "{}");
      seenMap[pathname] = true;
      sessionStorage.setItem("demo_tours_seen", JSON.stringify(seenMap));
    }
  };

  if (!run || steps.length === 0) return null;

  return (
    <Joyride
      key={`${pathname}-${run}`}
      steps={steps as any}
      run={run}
      continuous={true}
      showSkipButton={true}
      disableOverlayClose={true}
      {...({ showProgress: false, disableBeacon: true } as any)}
      tooltipComponent={CustomTooltip}
      callback={handleJoyrideCallback}
      styles={{ options: { zIndex: 10000, arrowColor: "#fff" } } as any}
    />
  );
}
