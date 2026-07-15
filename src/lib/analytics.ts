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
    const pageViewEvents = events.filter((e: any) => e.eventName === 'Page_Viewed');
    const uniquePages = new Set(pageViewEvents.map((e: any) => e.path));
    
    const summary = {
      totalEvents: events.length,
      pageViews: pageViewEvents.length,
      appointmentsCreated: events.filter((e: any) => e.eventName === 'Appointment_Created').length,
      appointmentsMoved: events.filter((e: any) => e.eventName === 'Appointment_Moved').length,
      patientsViewed: events.filter((e: any) => e.eventName === 'Patient_Viewed').length,
      faceMapUsed: events.filter((e: any) => e.eventName === 'FaceMap_Used').length,
      consentSigned: events.filter((e: any) => e.eventName === 'Consent_Signed').length,
      stockUsed: events.filter((e: any) => e.eventName === 'Stock_Used').length,
      beforeAfterViewed: events.filter((e: any) => e.eventName === 'BeforeAfter_Viewed').length,
      featuresExplored: uniquePages.size,
      visitedPages: Array.from(uniquePages) as string[],
      // Kronolojik oturum akışı
      sessionFlow: pageViewEvents.map((e: any) => e.path).filter(Boolean),
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

const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwciYrNdgDOai3YdjQV3Ks1N9JDjcpRg36Z5PDBz_KkWrs_8V4kUNyF05-vlEkJfg-ieA/exec";

export const sendAnalyticsToWebhook = async () => {
  if (typeof window === 'undefined') return;
  
  // Prevent sending multiple times
  if (localStorage.getItem('demo_analytics_sent') === 'true') return;
  
  const summary = getDemoEventsSummary() as any;
  // Don't send if empty
  if (Object.keys(summary).length === 0 || summary.pageViews === 0) return;

  // Read lead info — try individual keys first, then fall back to JSON blob
  let leadName = localStorage.getItem('demo_lead_name') || 'Anonim';
  let leadPhone = localStorage.getItem('demo_lead_phone') || 'Bilinmiyor';
  let leadClinic = localStorage.getItem('demo_lead_clinic') || 'Bilinmiyor';
  
  // Fallback: try parsing the demo_lead JSON blob
  if (leadName === 'Anonim') {
    try {
      const leadBlob = localStorage.getItem('demo_lead');
      if (leadBlob) {
        const parsed = JSON.parse(leadBlob);
        leadName = parsed.name || 'Anonim';
        leadPhone = parsed.phone || 'Bilinmiyor';
        leadClinic = parsed.clinic || 'Bilinmiyor';
      }
    } catch {}
  }

  const duration = localStorage.getItem('demo_duration_minutes') || 'Bilinmiyor';

  // Build detailed message
  const visitedPages = (summary.visitedPages || []).join(', ') || 'Yok';
  const detailLines = [
    `Demo Süresi: ${duration} dk`,
    `Gezilen Sayfa: ${summary.pageViews}`,
    `Görülen Modül: ${summary.featuresExplored}`,
    `Ziyaret Edilen Sayfalar: ${visitedPages}`,
    `Eklenen Randevu: ${summary.appointmentsCreated}`,
    `Taşınan Randevu: ${summary.appointmentsMoved}`,
    `Görüntülenen Hasta Profili: ${summary.patientsViewed || 0}`,
    `Yüz Haritası Kullanımı: ${summary.faceMapUsed || 0}`,
    `İmzalanan Onam Formu: ${summary.consentSigned || 0}`,
    `Stok Malzeme Kullanımı: ${summary.stockUsed || 0}`,
    `Önce/Sonra Karşılaştırma: ${summary.beforeAfterViewed || 0}`,
    `Toplam Olay: ${summary.totalEvents || 0}`,
  ];

  try {
    const params = new URLSearchParams();
    params.append("tip", "Demo_Analitik_Raporu");
    params.append("ad", leadName);
    params.append("telefon", leadPhone);
    params.append("klinik", leadClinic);
    params.append("mesaj", detailLines.join('. '));
    
    fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    
    localStorage.setItem('demo_analytics_sent', 'true');
    console.log("📊 [Analytics] Report sent to webhook successfully.");
  } catch (error) {
    console.error("📊 [Analytics] Failed to send report to webhook:", error);
  }
};
