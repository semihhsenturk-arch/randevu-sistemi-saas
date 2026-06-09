export const seedDemoData = () => {
  if (typeof window === "undefined") return;

  localStorage.setItem("demo_mode", "true");

  if (localStorage.getItem("demo_seeded") === "true") return;

  const today = new Date();
  const formatTarih = (d: Date) => d.toISOString().split("T")[0];

  const demoServices = [
    { id: 1, ad: "Botoks", sure: 30, fiyat: 3000, renk: "#fdf4ff" },
    { id: 2, ad: "Dudak Dolgusu", sure: 30, fiyat: 4500, renk: "#fff1f2" },
    { id: 3, ad: "Cilt Bakımı", sure: 60, fiyat: 1500, renk: "#f0fdf4" },
    { id: 4, ad: "Lazer Epilasyon", sure: 45, fiyat: 1200, renk: "#f0f9ff" },
  ];
  localStorage.setItem("cache_services", JSON.stringify(demoServices));

  const demoAppointments = [
    {
      id: "demo_1",
      musteriAdi: "AYŞE YILMAZ",
      telefon: "05551234567",
      hizmetId: 1,
      tarih: formatTarih(today),
      saat: "10:00",
      durum: "onaylandi",
      notlar: "İlk defa geliyor",
    },
    {
      id: "demo_2",
      musteriAdi: "FATMA DEMİR",
      telefon: "05329876543",
      hizmetId: 2,
      tarih: formatTarih(today),
      saat: "11:30",
      durum: "beklemede",
      notlar: "",
    },
    {
      id: "demo_3",
      musteriAdi: "ALİ KAYA",
      telefon: "05445556677",
      hizmetId: 3,
      tarih: formatTarih(today),
      saat: "14:00",
      durum: "onaylandi",
      notlar: "Hassas cilt",
    },
    {
      id: "demo_4",
      musteriAdi: "ZEYNEP ÇELİK",
      telefon: "05051112233",
      hizmetId: 1,
      tarih: formatTarih(new Date(today.getTime() + 86400000)),
      saat: "10:30",
      durum: "onaylandi",
      notlar: "Kontrol",
    },
  ];
  localStorage.setItem("cache_appointments", JSON.stringify(demoAppointments));

  const demoProfiles = {
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
  };
  localStorage.setItem("cache_patient_profiles", JSON.stringify(demoProfiles));

  const demoInventory = {
    stock: { inv_1: 50, inv_2: 20, inv_3: 5 },
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
    ],
  };
  localStorage.setItem("cache_inventory", JSON.stringify(demoInventory));

  localStorage.setItem("demo_seeded", "true");
};

export const clearDemoData = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("demo_mode");
  localStorage.removeItem("demo_seeded");
  localStorage.removeItem("cache_services");
  localStorage.removeItem("cache_appointments");
  localStorage.removeItem("cache_patient_profiles");
  localStorage.removeItem("cache_inventory");
};
