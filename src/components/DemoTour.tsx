"use client";

import { useEffect, useState, useCallback } from "react";
import { Joyride, Step, CallBackProps, STATUS, ACTIONS, EVENTS, TooltipRenderProps } from "react-joyride";
import { usePathname, useRouter } from "next/navigation";

// Custom Premium Tooltip Component for Joyride
const CustomTooltip = ({
  continuous,
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
      className="bg-white rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.25)] border border-[#0a3d34]/15 overflow-hidden w-[340px] md:w-[380px] z-[10000] font-sans"
    >
      <div className="bg-gradient-to-r from-[#0a3d34] to-[#125c50] p-5 pb-6 relative overflow-hidden">
        {/* Abstract pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        <div className="flex items-center justify-between mb-2 relative z-10">
          <span className="text-emerald-100/80 text-[0.65rem] font-black tracking-[0.15em] uppercase">
            Adım {index + 1} / {size}
          </span>
          <button 
            {...skipProps} 
            className="text-white/50 hover:text-white transition-colors text-[0.7rem] font-bold uppercase tracking-wider"
          >
            Turu Kapat
          </button>
        </div>
        <h3 className="text-white font-extrabold text-[1.15rem] leading-tight drop-shadow-sm relative z-10">
          {step.title}
        </h3>
      </div>
      
      <div className="p-6 bg-white relative">
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#0a3d34]/10 to-transparent transform -translate-y-px"></div>
        <p className="text-slate-600 font-medium text-[0.95rem] leading-relaxed">
          {step.content}
        </p>
      </div>

      <div className="bg-slate-50/80 px-6 py-4 flex items-center justify-between border-t border-slate-100">
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: size }).map((_, i) => (
             <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-4 bg-[#0a3d34]' : 'w-1.5 bg-slate-200'}`} 
            />
          ))}
        </div>
        <div className="flex gap-2">
          {index > 0 && (
            <button 
              {...backProps} 
              className="px-4 py-2.5 rounded-xl text-[0.8rem] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm active:scale-95"
            >
              Geri
            </button>
          )}
          <button 
            {...primaryProps} 
            className="px-5 py-2.5 rounded-xl text-[0.8rem] font-bold text-white bg-gradient-to-br from-[#0a3d34] to-[#125c50] hover:to-[#0a3d34] hover:shadow-lg hover:shadow-[#0a3d34]/20 transition-all active:scale-95"
          >
            {isLastStep ? 'Anladım' : 'İleri'}
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
        target: "#tour-calendar-view",
        content: "Takvim arayüzü üzerinden kliniğinizin günlük iş akışını anlık takip edebilir, sürükle-bırak özelliği ile randevularınızı hızlıca organize edebilirsiniz.",
        disableBeacon: true,
        placement: "bottom",
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
  } else if (pathname === "/dashboard") {
    return [
      {
        target: "body",
        content: "Analiz ekranı sayesinde aylık cironuzu, personel bazlı performansınızı ve hizmet doluluk oranlarınızı detaylı grafiklerle takip ederek stratejik kararlar alabilirsiniz.",
        disableBeacon: true,
        placement: "center",
        title: "Yapay Zeka Destekli Analiz"
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
        setTimeout(() => setRun(true), forceRun ? 100 : 1200);
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
      showProgress={false}
      showSkipButton={true}
      disableOverlayClose={true}
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
