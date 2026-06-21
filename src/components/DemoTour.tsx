"use client";

import { useEffect, useState, useCallback } from "react";
import { Joyride, Step, CallBackProps, STATUS, ACTIONS, EVENTS, TooltipRenderProps } from "react-joyride";
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
      className="bg-white rounded-2xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200/80 overflow-hidden w-[320px] md:w-[360px] z-[10000] font-sans"
    >
      <div className="p-5 flex flex-col gap-3.5">
        {/* Header part */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0a3d34]/10 text-[#0a3d34] text-[0.7rem] font-bold">
              {index + 1}
            </div>
            <span className="text-slate-400 text-[0.65rem] font-bold tracking-wider uppercase">
              Adım {index + 1} / {size}
            </span>
          </div>
          <button 
            {...skipProps} 
            className="text-slate-400 hover:text-slate-700 transition-colors rounded-md p-1 hover:bg-slate-100"
            title="Turu Kapat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Title and Content */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-slate-900 font-extrabold text-[1.1rem] leading-snug">
            {step.title}
          </h3>
          <p className="text-slate-600 font-medium text-[0.9rem] leading-relaxed">
            {step.content}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-50/80 px-5 py-3.5 flex items-center justify-between border-t border-slate-100">
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: size }).map((_, i) => (
             <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-5 bg-[#0a3d34]' : 'w-1.5 bg-slate-200'}`} 
            />
          ))}
        </div>
        <div className="flex gap-2 items-center">
          {index > 0 && (
            <button 
              {...backProps} 
              className="px-3 py-2 rounded-xl text-[0.8rem] font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Geri
            </button>
          )}
          <button 
            {...primaryProps} 
            className="px-4 py-2 rounded-xl text-[0.8rem] font-bold text-white bg-[#0a3d34] hover:bg-[#072b24] shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
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

const getStepsForPath = (pathname: string): Step[] => {
  if (pathname === "/takvim") {
    return [
      {
        target: "body",
        content: "Takvim arayüzü üzerinden kliniğinizin günlük iş akışını anlık takip edebilir, sürükle-bırak özelliği ile randevularınızı hızlıca organize edebilirsiniz.",
        disableBeacon: true,
        placement: "center",
        title: "Kapsamlı Takvim Yönetimi"
      },
      {
        target: "#tour-add-appointment",
        content: "Sağ üst köşedeki buton ile saniyeler içinde yeni bir hasta kaydı oluşturabilir ve randevu planlamasını tamamlayabilirsiniz.",
        disableBeacon: true,
        placement: "bottom",
        title: "Hızlı Randevu Oluşturma"
      },
      {
        target: "#tour-link-hasta-listesi",
        content: "Kapsamlı hasta profillerini ve yapay zeka destekli yüz haritalama (FaceMap) özelliğini incelemek için Hasta Listesi sekmesine ilerleyelim.",
        disableBeacon: true,
        placement: "right",
        title: "Hasta Listesine Geçiş",
        spotlightClicks: true
      }
    ];
  } else if (pathname === "/hasta-listesi") {
    return [
      {
        target: "body",
        content: "Bu alanda kliniğinize kayıtlı tüm hastaları filtreleyebilir, detaylı geçmişlerine ve randevu istatistiklerine tek tıkla ulaşabilirsiniz.",
        disableBeacon: true,
        placement: "center",
        title: "Merkezi Hasta Veritabanı"
      },
      {
        target: "body",
        content: "Detaylı hasta profilinde yer alan FaceMap (Yüz Haritası) ile estetik ve dermatolojik işlemleri görsel olarak işaretleyip, tedavi süreçlerini profesyonelce kayıt altına alabilirsiniz.",
        disableBeacon: true,
        placement: "center",
        title: "FaceMap ile İşlem Takibi"
      },
      {
        target: "#tour-link-stok-yonetimi",
        content: "İşlem yapıldıkça azalan ürünlerin takibini sağlayan otomatik Stok Yönetimi modülümüzü keşfetmek için bir sonraki adıma geçelim.",
        disableBeacon: true,
        placement: "right",
        title: "Stok Yönetimine Geçiş",
        spotlightClicks: true
      }
    ];
  } else if (pathname === "/stok-yonetimi") {
    return [
      {
        target: "body",
        content: "Kliniğinizdeki sarf malzemelerin güncel durumunu buradan yönetebilir, kritik seviyeye düşen ürünler için sistemden otomatik uyarılar alarak tedarik zincirinizi koruyabilirsiniz.",
        disableBeacon: true,
        placement: "center",
        title: "Akıllı Stok Takibi"
      },
      {
        target: "#tour-link-dashboard",
        content: "Son olarak, kliniğinizin finansal ve operasyonel büyümesini yapay zeka destekli raporlarla görmek için Analiz paneline göz atalım.",
        disableBeacon: true,
        placement: "right",
        title: "Analiz ve Raporlamaya Geçiş",
        spotlightClicks: true
      }
    ];
  } else if (pathname === "/hizmet-yonetimi") {
    return [
      {
        target: "body",
        content: "Bu ekranda kliniğinizde sunduğunuz tüm işlemleri listeleyebilir, her bir işlem için tahmini süre ve fiyat bilgilerini girerek randevu planlamanızı otomatize edebilirsiniz.",
        disableBeacon: true,
        placement: "center",
        title: "Hizmet ve Fiyatlandırma Yönetimi"
      },
    ];
  } else if (pathname === "/dashboard") {
    return [
      {
        target: "body",
        content: "Analiz ekranı sayesinde aylık cironuzu, personel bazlı performansınızı ve hizmet doluluk oranlarınızı detaylı grafiklerle takip ederek stratejik kararlar alabilirsiniz.",
        disableBeacon: true,
        placement: "center",
        title: "Yapay Zeka Destekli Analiz"
      },
      {
        target: "#tour-link-hizmet-yonetimi",
        content: "Şimdi klinik hizmetlerinizi ve fiyatlandırmalarınızı yönetebileceğiniz Hizmet Yönetimi modülünü incelemek için bir sonraki adıma geçelim.",
        disableBeacon: true,
        placement: "right",
        title: "Hizmet Yönetimine Geçiş",
        spotlightClicks: true
      }
    ];
  }
  return [];
};

export function DemoTour() {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  const initTour = useCallback((forceRun = false) => {
    if (typeof window === "undefined") return;
    const isDemo = localStorage.getItem("demo_mode") === "true";
    if (!isDemo) return;

    const seenMap = JSON.parse(localStorage.getItem("demo_tours_seen") || "{}");
    const pageSteps = getStepsForPath(pathname);
    
    if (pageSteps.length > 0) {
      setSteps(pageSteps);
      
      // Auto-start only if we haven't seen it, OR if explicitly forced (e.g. clicking Site Turu)
      if (!seenMap[pathname] || forceRun) {
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

  const handleJoyrideCallback = (data: CallBackProps) => {
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
      const seenMap = JSON.parse(localStorage.getItem("demo_tours_seen") || "{}");
      seenMap[pathname] = true;
      localStorage.setItem("demo_tours_seen", JSON.stringify(seenMap));
    }
  };

  if (!run || steps.length === 0) return null;

  return (
    <Joyride
      key={`${pathname}-${run}`}
      steps={steps}
      run={run}
      continuous={true}
      showProgress={false}
      showSkipButton={true}
      disableOverlayClose={true}
      disableBeacon={true}
      tooltipComponent={CustomTooltip}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          zIndex: 10000,
          arrowColor: "#fff",
        },
      }}
    />
  );
}
