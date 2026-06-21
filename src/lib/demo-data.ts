// Default demo session duration: 30 minutes
export const DEFAULT_DEMO_DURATION_MS = 30 * 60 * 1000;

export const getDemoDurationMs = (): number => {
  if (typeof window === "undefined") return DEFAULT_DEMO_DURATION_MS;
  const overrideMinutes = localStorage.getItem("demo_duration_override");
  if (overrideMinutes) {
    return parseInt(overrideMinutes) * 60 * 1000;
  }
  return DEFAULT_DEMO_DURATION_MS;
};

export const seedDemoData = () => {
  if (typeof window === "undefined") return;

  localStorage.setItem("demo_mode", "true");

  // Start the demo timer on first entry
  if (!localStorage.getItem("demo_started_at")) {
    localStorage.setItem("demo_started_at", Date.now().toString());
  }

  if (localStorage.getItem("demo_seeded") === "true") return;

  const today = new Date();
  const formatTarih = (d: Date) => d.toISOString().split("T")[0];

  const demoServices = [
    { id: 1, ad: "Botoks", sure: 30, fiyat: 3000, renk: "#fdf4ff" },
    { id: 2, ad: "Dudak Dolgusu", sure: 30, fiyat: 4500, renk: "#fff1f2" },
    { id: 3, ad: "Cilt Bakımı", sure: 60, fiyat: 1500, renk: "#f0fdf4" },
    { id: 4, ad: "Lazer Epilasyon", sure: 45, fiyat: 1200, renk: "#f0f9ff" },
    { id: 5, ad: "Mezoterapi", sure: 45, fiyat: 2500, renk: "#fefce8" },
    { id: 6, ad: "PRP Tedavisi", sure: 40, fiyat: 3500, renk: "#fef2f2" },
    { id: 7, ad: "Karbon Peeling", sure: 30, fiyat: 1800, renk: "#f5f3ff" },
    { id: 8, ad: "Yüz Germe (İplik)", sure: 60, fiyat: 8000, renk: "#ecfdf5" },
  ];
  localStorage.setItem("cache_services", JSON.stringify(demoServices));

  const demoAppointments = [
    {
      id: "demo_1",
      musteriAdi: "AYŞE YILMAZ",
      telefon: "05551234567",
      hizmetId: 1,
      tarih: formatTarih(today),
      saat: "09:00",
      durum: "onaylandi",
      notlar: "İlk defa geliyor",
    },
    {
      id: "demo_2",
      musteriAdi: "FATMA DEMİR",
      telefon: "05329876543",
      hizmetId: 2,
      tarih: formatTarih(today),
      saat: "09:30",
      durum: "beklemede",
      notlar: "",
    },
    {
      id: "demo_3",
      musteriAdi: "ALİ KAYA",
      telefon: "05445556677",
      hizmetId: 3,
      tarih: formatTarih(today),
      saat: "10:30",
      durum: "onaylandi",
      notlar: "Hassas cilt",
    },
    {
      id: "demo_4",
      musteriAdi: "ZEYNEP ÇELİK",
      telefon: "05051112233",
      hizmetId: 1,
      tarih: formatTarih(today),
      saat: "11:00",
      durum: "onaylandi",
      notlar: "Kontrol",
    },
    {
      id: "demo_5",
      musteriAdi: "MEHMET ÖZTÜRK",
      telefon: "05367891234",
      hizmetId: 5,
      tarih: formatTarih(today),
      saat: "13:00",
      durum: "onaylandi",
      notlar: "Saç mezoterapisi — 3. seans",
    },
    {
      id: "demo_6",
      musteriAdi: "ELİF ARSLAN",
      telefon: "05421234567",
      hizmetId: 6,
      tarih: formatTarih(today),
      saat: "14:00",
      durum: "onaylandi",
      notlar: "PRP yüz bölgesi",
    },
    {
      id: "demo_7",
      musteriAdi: "HASAN YILDIZ",
      telefon: "05331112233",
      hizmetId: 4,
      tarih: formatTarih(today),
      saat: "15:00",
      durum: "beklemede",
      notlar: "",
    },
    {
      id: "demo_8",
      musteriAdi: "SEDA KOÇAK",
      telefon: "05069876543",
      hizmetId: 7,
      tarih: formatTarih(today),
      saat: "16:00",
      durum: "onaylandi",
      notlar: "Düğün hazırlığı — acil",
    },
    {
      id: "demo_9",
      musteriAdi: "BARAN DEMİRCİ",
      telefon: "05541239876",
      hizmetId: 2,
      tarih: formatTarih(new Date(today.getTime() + 86400000)),
      saat: "10:00",
      durum: "onaylandi",
      notlar: "Dudak dolgusu revizyonu",
    },
    {
      id: "demo_10",
      musteriAdi: "NUR AKTAŞ",
      telefon: "05071234567",
      hizmetId: 8,
      tarih: formatTarih(new Date(today.getTime() + 86400000)),
      saat: "11:00",
      durum: "onaylandi",
      notlar: "İplikle yüz germe — konsültasyon",
    },
    {
      id: "demo_11",
      musteriAdi: "CAN YILDIRIM",
      telefon: "05389871234",
      hizmetId: 1,
      tarih: formatTarih(new Date(today.getTime() + 86400000)),
      saat: "13:30",
      durum: "beklemede",
      notlar: "",
    },
    {
      id: "demo_12",
      musteriAdi: "DENİZ KARA",
      telefon: "05459871234",
      hizmetId: 3,
      tarih: formatTarih(new Date(today.getTime() + 86400000)),
      saat: "14:30",
      durum: "onaylandi",
      notlar: "Cilt bakımı — akne izleri",
    },
    {
      id: "demo_13",
      musteriAdi: "AYŞE YILMAZ",
      telefon: "05551234567",
      hizmetId: 5,
      tarih: formatTarih(new Date(today.getTime() + 2 * 86400000)),
      saat: "10:00",
      durum: "onaylandi",
      notlar: "Mezoterapi — 2. seans",
    },
    {
      id: "demo_14",
      musteriAdi: "SEDA KOÇAK",
      telefon: "05069876543",
      hizmetId: 1,
      tarih: formatTarih(new Date(today.getTime() + 2 * 86400000)),
      saat: "11:30",
      durum: "onaylandi",
      notlar: "Alın botoks",
    },
    {
      id: "demo_15",
      musteriAdi: "ELİF ARSLAN",
      telefon: "05421234567",
      hizmetId: 4,
      tarih: formatTarih(new Date(today.getTime() + 3 * 86400000)),
      saat: "09:30",
      durum: "onaylandi",
      notlar: "Koltuk altı lazer — 5. seans",
    },
  ];
  localStorage.setItem("cache_appointments", JSON.stringify(demoAppointments));

  const demoProfiles: Record<string, any> = {
    "AYŞE YILMAZ": {
      phone: "05551234567",
      tc_no: "12345678901",
      birth_date: "1990-05-15",
      address: "İstanbul, Kadıköy",
      meds: [],
      notes_list: [
        {
          date: formatTarih(today),
          content: "Hasta ilk randevusuna geldi. İşlem sorunsuz geçti.",
        },
      ],
      stock_history: [],
      face_treatments: [
        {
          id: "ft_1",
          date: formatTarih(today),
          zone: "glabella",
          type: "botoks",
          amount: 15,
          unit: "Ünite",
          note: "Standart doz uygulandı",
        },
      ],
      face_gender: "female",
      before_after_photos: [],
    },
    "FATMA DEMİR": {
      phone: "05329876543",
      tc_no: "23456789012",
      birth_date: "1985-11-22",
      address: "İstanbul, Beşiktaş",
      meds: ["Aspirin (dikkat)"],
      notes_list: [
        {
          date: formatTarih(new Date(today.getTime() - 30 * 86400000)),
          content: "İlk dudak dolgusu uygulandı. 1ml Juvederm kullanıldı.",
        },
        {
          date: formatTarih(today),
          content: "Kontrol randevusu. Sonuçtan memnun, revizyon gerekmiyor.",
        },
      ],
      stock_history: [],
      face_treatments: [
        {
          id: "ft_2",
          date: formatTarih(new Date(today.getTime() - 30 * 86400000)),
          zone: "lips",
          type: "dolgu",
          amount: 1,
          unit: "ml",
          note: "Juvederm Ultra Smile",
        },
      ],
      face_gender: "female",
      before_after_photos: [],
    },
    "ALİ KAYA": {
      phone: "05445556677",
      tc_no: "34567890123",
      birth_date: "1978-03-10",
      address: "İstanbul, Üsküdar",
      meds: [],
      notes_list: [
        {
          date: formatTarih(today),
          content: "Hassas cilt tipi. Hafif ürünlerle bakım uygulandı.",
        },
      ],
      stock_history: [],
      face_treatments: [],
      face_gender: "male",
      before_after_photos: [],
    },
    "ZEYNEP ÇELİK": {
      phone: "05051112233",
      tc_no: "45678901234",
      birth_date: "1995-08-01",
      address: "İstanbul, Bakırköy",
      meds: [],
      notes_list: [
        {
          date: formatTarih(new Date(today.getTime() - 14 * 86400000)),
          content: "Botoks uygulaması yapıldı. Glabella + kaz ayağı bölgesi.",
        },
      ],
      stock_history: [],
      face_treatments: [
        {
          id: "ft_3",
          date: formatTarih(new Date(today.getTime() - 14 * 86400000)),
          zone: "glabella",
          type: "botoks",
          amount: 20,
          unit: "Ünite",
          note: "Glabella bölgesi",
        },
        {
          id: "ft_4",
          date: formatTarih(new Date(today.getTime() - 14 * 86400000)),
          zone: "crows_feet",
          type: "botoks",
          amount: 12,
          unit: "Ünite",
          note: "Kaz ayağı — her iki taraf",
        },
      ],
      face_gender: "female",
      before_after_photos: [],
    },
    "MEHMET ÖZTÜRK": {
      phone: "05367891234",
      tc_no: "56789012345",
      birth_date: "1982-01-20",
      address: "İstanbul, Şişli",
      meds: [],
      notes_list: [
        {
          date: formatTarih(new Date(today.getTime() - 60 * 86400000)),
          content: "Saç mezoterapisi başlandı. 6 seans planlandı.",
        },
        {
          date: formatTarih(new Date(today.getTime() - 30 * 86400000)),
          content: "2. seans tamamlandı. Hafif kızarıklık, normal.",
        },
      ],
      stock_history: [],
      face_treatments: [],
      face_gender: "male",
      before_after_photos: [],
    },
    "ELİF ARSLAN": {
      phone: "05421234567",
      tc_no: "67890123456",
      birth_date: "1992-06-18",
      address: "İstanbul, Ataşehir",
      meds: [],
      notes_list: [
        {
          date: formatTarih(today),
          content: "PRP yüz bölgesi uygulandı. 2 tüp kan alındı.",
        },
      ],
      stock_history: [],
      face_treatments: [
        {
          id: "ft_5",
          date: formatTarih(today),
          zone: "forehead",
          type: "prp",
          amount: 2,
          unit: "ml",
          note: "PRP yüz bölgesi rejuvenation",
        },
      ],
      face_gender: "female",
      before_after_photos: [],
    },
    "SEDA KOÇAK": {
      phone: "05069876543",
      tc_no: "78901234567",
      birth_date: "1998-12-05",
      address: "İstanbul, Beylikdüzü",
      meds: [],
      notes_list: [
        {
          date: formatTarih(today),
          content: "Karbon peeling yapıldı. Düğün hazırlığı kapsamında 3 seans planlandı.",
        },
      ],
      stock_history: [],
      face_treatments: [],
      face_gender: "female",
      before_after_photos: [],
    },
    "HASAN YILDIZ": {
      phone: "05331112233",
      tc_no: "89012345678",
      birth_date: "1975-09-30",
      address: "İstanbul, Maltepe",
      meds: ["Tansiyon ilacı"],
      notes_list: [],
      stock_history: [],
      face_treatments: [],
      face_gender: "male",
      before_after_photos: [],
    },
  };
  localStorage.setItem("cache_patient_profiles", JSON.stringify(demoProfiles));

  const demoInventory = {
    stock: { inv_1: 50, inv_2: 20, inv_3: 5, inv_4: 30, inv_5: 12, inv_6: 8, inv_7: 3, inv_8: 100 },
    items: [
      {
        id: "inv_1",
        ad: "Botulinum Toksin (100Ü)",
        birim: "Kutu",
        kritik_stok: 10,
      },
      {
        id: "inv_2",
        ad: "Hyaluronik Asit Dolgu (1ml)",
        birim: "Adet",
        kritik_stok: 5,
      },
      { id: "inv_3", ad: "Cilt Bakım Serumu", birim: "Şişe", kritik_stok: 2 },
      { id: "inv_4", ad: "Mezoterapi Kokteyli", birim: "Ampul", kritik_stok: 5 },
      { id: "inv_5", ad: "PRP Kiti", birim: "Adet", kritik_stok: 3 },
      { id: "inv_6", ad: "Karbon Peeling Solüsyonu", birim: "Şişe", kritik_stok: 2 },
      { id: "inv_7", ad: "PDO İplik (COG)", birim: "Paket", kritik_stok: 2 },
      { id: "inv_8", ad: "Tek Kullanımlık Eldiven (M)", birim: "Adet", kritik_stok: 20 },
    ],
  };
  localStorage.setItem("cache_inventory", JSON.stringify(demoInventory));

  localStorage.setItem("demo_seeded", "true");
};

/** Returns remaining demo time in milliseconds, or null if not in demo mode */
export const getDemoTimeRemaining = (): number | null => {
  if (typeof window === "undefined") return null;
  const startedAt = localStorage.getItem("demo_started_at");
  if (!startedAt) return null;

  const elapsed = Date.now() - parseInt(startedAt);
  const duration = getDemoDurationMs();
  return Math.max(0, duration - elapsed);
};

/** Returns true if demo session has expired */
export const isDemoExpired = (): boolean => {
  const remaining = getDemoTimeRemaining();
  return remaining !== null && remaining <= 0;
};

/** Returns demo start timestamp or null */
export const getDemoStartedAt = (): number | null => {
  if (typeof window === "undefined") return null;
  const val = localStorage.getItem("demo_started_at");
  return val ? parseInt(val) : null;
};

export const clearDemoData = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("demo_mode");
  localStorage.removeItem("demo_seeded");
  localStorage.removeItem("demo_started_at");
  localStorage.removeItem("demo_duration_override");
  localStorage.removeItem("demo_lead");
  localStorage.removeItem("cache_services");
  localStorage.removeItem("cache_appointments");
  localStorage.removeItem("cache_patient_profiles");
  localStorage.removeItem("cache_inventory");
};
