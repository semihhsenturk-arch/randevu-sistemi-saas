export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window === 'undefined') return;

  // 1. Geliştirici konsoluna yazdır (Debug için)
  console.log(`📊 [Analytics] ${eventName}`, properties);

  // 2. Demo Modu ise LocalStorage'a kaydet (Süre bitiminde özet göstermek için)
  const isDemo = localStorage.getItem('demo_mode') === 'true';
  if (isDemo) {
    const eventsStr = localStorage.getItem('demo_events') || '[]';
    try {
      const events = JSON.parse(eventsStr);
      events.push({ 
        eventName, 
        timestamp: new Date().toISOString(), 
        ...properties 
      });
      localStorage.setItem('demo_events', JSON.stringify(events));
    } catch (e) {
      console.error('Demo event kaydedilemedi:', e);
    }
  }

  // 3. İleride PostHog veya Google Analytics entegrasyonu için hazır alan:
  // if (typeof window !== 'undefined' && (window as any).posthog) {
  //   (window as any).posthog.capture(eventName, properties);
  // }
  // if (typeof window !== 'undefined' && (window as any).gtag) {
  //   (window as any).gtag('event', eventName, properties);
  // }
};

export const getDemoEventsSummary = () => {
  if (typeof window === 'undefined') return {};
  
  const eventsStr = localStorage.getItem('demo_events') || '[]';
  try {
    const events = JSON.parse(eventsStr);
    
    // Özet istatistikler çıkar
    const summary = {
      pageViews: events.filter((e: any) => e.eventName === 'Page_Viewed').length,
      appointmentsCreated: events.filter((e: any) => e.eventName === 'Appointment_Created').length,
      appointmentsMoved: events.filter((e: any) => e.eventName === 'Appointment_Moved').length,
      featuresExplored: new Set(events.filter((e: any) => e.eventName === 'Page_Viewed').map((e: any) => e.path)).size,
    };
    
    return summary;
  } catch (e) {
    return {};
  }
};

export const clearAnalytics = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('demo_events');
    localStorage.removeItem('demo_analytics_sent');
  }
};

const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwPSOfJE332q-Ci1XOAfLtY6CBY0IzyB_HmpAJUgtPMoGzrFM_ND5RpHtzpzLX12-dM/exec";

export const sendAnalyticsToWebhook = async () => {
  if (typeof window === 'undefined') return;
  
  // Prevent sending multiple times
  if (localStorage.getItem('demo_analytics_sent') === 'true') return;
  
  const summary = getDemoEventsSummary();
  // Don't send if empty
  if (Object.keys(summary).length === 0 || (summary as any).pageViews === 0) return;

  const leadName = localStorage.getItem('demo_lead_name') || 'Anonim';
  const leadPhone = localStorage.getItem('demo_lead_phone') || 'Bilinmiyor';
  const leadClinic = localStorage.getItem('demo_lead_clinic') || 'Bilinmiyor';
  const duration = localStorage.getItem('demo_duration_minutes') || 'Bilinmiyor';

  try {
    const formData = new FormData();
    formData.append("tip", "Demo_Analitik_Raporu");
    formData.append("ad", leadName);
    formData.append("telefon", leadPhone);
    formData.append("klinik", leadClinic);
    formData.append("mesaj", `Demo Süresi: ${duration} dk. Gezilen Sayfa: ${(summary as any).pageViews}, Görülen Modül: ${(summary as any).featuresExplored}, Eklenen Randevu: ${(summary as any).appointmentsCreated}, Taşınan Randevu: ${(summary as any).appointmentsMoved}`);
    
    // We use no-cors so we don't await the actual response text, just send and forget
    fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    });
    
    localStorage.setItem('demo_analytics_sent', 'true');
    console.log("📊 [Analytics] Report sent to webhook successfully.");
  } catch (error) {
    console.error("📊 [Analytics] Failed to send report to webhook:", error);
  }
};

