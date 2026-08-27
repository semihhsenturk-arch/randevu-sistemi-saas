import { useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type Appointment = {
  id: string;
  musteriAdi: string;
  telefon: string;
  hizmetId: string | number;
  tarih: string;
  saat: string;
  durum: "onaylandi" | "beklemede" | "iptal";
  notlar: string;
  whatsapp_status?: "sent" | "confirmed" | "declined" | null;
  customPrice?: number;
};

export type FaceTreatment = {
  id: string;
  date: string;
  zone: string;
  type: 'botoks' | 'dolgu' | 'mezoterapi';
  amount: number;
  unit: string;
  product?: string;
  note?: string;
  transactionNo?: string;
  isControl?: boolean;
  parentTransactionNo?: string;
};

/**
 * Generates a unique transaction number for a face treatment.
 * Format: #ISL-XXXXX (5-digit, incremented based on existing treatments)
 */
export function generateTransactionNo(existingTreatments: FaceTreatment[]): string {
  let maxNum = 0;
  for (const t of existingTreatments) {
    if (t.transactionNo) {
      const match = t.transactionNo.match(/#ISL-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `#ISL-${nextNum.toString().padStart(5, '0')}`;
}

export type BeforeAfterPhoto = {
  id: string;
  date: string;
  label: string;
  before_image: string;
  after_image?: string;
  note?: string;
};

export type PatientProfile = {
  id?: string;
  patient_name: string;
  phone?: string;
  tc_no?: string;
  birth_date?: string;
  address?: string;
  meds: any[];
  notes_list: { date: string; content: string }[];
  stock_history: any[];
  face_treatments?: FaceTreatment[];
  face_gender?: 'female' | 'male';
  before_after_photos?: BeforeAfterPhoto[];
};

export type StockMovement = {
  id: string;
  date: string;
  type: 'giris' | 'cikis' | 'duzeltme';
  amount: number;
  unit_cost: number;
  total_cost: number;
  previous_stock: number;
  new_stock: number;
  previous_avg_cost: number;
  new_avg_cost: number;
  note?: string;
};

export type InventoryItem = {
  id: string;
  ad: string;
  birim: string;
  kritik_stok: number;
  kod?: string;
  fiyat?: number;
  toplam_deger?: number;
  hareketler?: StockMovement[];
};

export type Service = {
  id: string | number;
  ad: string;
  sure: number;
  fiyat: number;
  renk: string;
};

export type ConsentRecord = {
  id?: string;
  patient_name: string;
  appointment_id?: string;
  appointment_date?: string;
  appointment_time?: string;
  consent_text: string;
  signature_data?: string;
  checkboxes: Record<string, boolean>;
  patient_tc?: string;
  patient_phone?: string;
  signed_at?: string;
};

export const CACHE_KEYS = {
  APPOINTMENTS: "cache_appointments_v2",
  PROFILES: "cache_patient_profiles_v2",
  INVENTORY: "cache_inventory",
  ADMIN_USERS: "cache_admin_users",
  SERVICES: "cache_services",
  CONSENTS: "cache_consent_records_v2",
};

export function getCacheSync<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(key);
    const parsed = data ? JSON.parse(data) : null;
    if (parsed && key === CACHE_KEYS.INVENTORY) {
      return normalizeInventory(parsed as any) as unknown as T;
    }
    return parsed;
  } catch (e) {
    return null;
  }
}

// Internal version
function getCache<T>(key: string): T | null {
  return getCacheSync<T>(key);
}

function setCache(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}

const normalizeInventory = (inventory: { stock: Record<string, number>; items: InventoryItem[] }) => {
  if (!inventory || !inventory.items) return inventory;
  
  let changed = false;
  const items = inventory.items.map(item => {
    const isAnestezi = item.ad.toLowerCase().includes("anestezi krem") && item.birim.toLowerCase() === "kutu";
    const isEldiven = item.ad.toLowerCase().includes("eldiven") && item.birim.toLowerCase() === "kutu";

    if (isAnestezi || isEldiven) {
      changed = true;
      return { ...item, birim: isAnestezi ? "Gram" : "Adet" };
    }
    return item;
  });

  return changed ? { stock: inventory.stock, items } : inventory;
};

import { useAuth } from "@/hooks/use-auth";

export function useDatabase() {
  const { user } = useAuth();
  const userId = user?.id;

  // ─── Appointments ──────────────────────────────────────────────

  const fetchFreshAppointments = useCallback(async (): Promise<Appointment[]> => {
    if (!userId || userId === "demo-user") return getCache<Appointment[]>(CACHE_KEYS.APPOINTMENTS) || [];

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", userId)
      .order("tarih", { ascending: true })
      .order("saat", { ascending: true });

    if (!error && data) {
      const mapped: Appointment[] = data.map((d: any) => ({
        id: d.id,
        musteriAdi: d.musteri_adi,
        telefon: d.telefon,
        hizmetId: d.hizmet_id,
        tarih: d.tarih,
        saat: d.saat,
        durum: d.durum,
        notlar: d.notlar,
        whatsapp_status: d.whatsapp_status,
        customPrice: d.custom_price,
      }));
      setCache(CACHE_KEYS.APPOINTMENTS, mapped);
      return mapped;
    }
    return getCache<Appointment[]>(CACHE_KEYS.APPOINTMENTS) || [];
  }, [userId]);

  const getAppointments = useCallback(async (): Promise<Appointment[]> => {
    try {
      const fresh = await fetchFreshAppointments();
      return fresh; // DB sonucunu her zaman güven — cache zaten fetchFreshAppointments içinde güncellendi
    } catch (e) {
      console.warn("fetchFreshAppointments failed, falling back to cache", e);
    }
    
    return getCache<Appointment[]>(CACHE_KEYS.APPOINTMENTS) || [];
  }, [fetchFreshAppointments]);

  const saveAppointment = useCallback(async (apt: Appointment) => {
    if (!userId) throw new Error("Oturum kapatılmış, lütfen tekrar giriş yapın.");

    if (userId === "demo-user") {
      const updatedApt = { ...apt, id: (apt.id && !apt.id.startsWith("temp_")) ? apt.id : "demo_" + Date.now() } as Appointment;
      let cached = getCache<Appointment[]>(CACHE_KEYS.APPOINTMENTS) || [];
      cached = cached.filter((a) => a.id !== updatedApt.id && a.id !== apt.id);
      cached.push(updatedApt);
      setCache(CACHE_KEYS.APPOINTMENTS, cached);
      return updatedApt;
    }

    const payload: any = {
      user_id: userId,
      musteri_adi: apt.musteriAdi.toLocaleUpperCase("tr-TR"),
      telefon: apt.telefon,
      hizmet_id: parseInt(apt.hizmetId.toString()) || 1,
      tarih: apt.tarih,
      saat: apt.saat,
      durum: apt.durum,
      notlar: apt.notlar,
      whatsapp_status: apt.whatsapp_status || null,
      custom_price: apt.customPrice !== undefined && apt.customPrice !== null && apt.customPrice !== "" as any ? apt.customPrice : null,
    };

    if (apt.id && !apt.id.startsWith("gs_") && !apt.id.startsWith("temp_")) {
      payload.id = apt.id;
    } else if (apt.id && apt.id.startsWith("gs_")) {
      payload.id = apt.id;
    }

    const { data, error } = await supabase
      .from("appointments")
      .upsert(payload, { onConflict: "id" })
      .select();

    if (error) throw error;

    const updatedApt: Appointment = {
      id: data[0].id,
      musteriAdi: data[0].musteri_adi,
      telefon: data[0].telefon,
      hizmetId: data[0].hizmet_id,
      tarih: data[0].tarih,
      saat: data[0].saat,
      durum: data[0].durum,
      notlar: data[0].notlar,
      whatsapp_status: data[0].whatsapp_status,
      customPrice: data[0].custom_price,
    };

    // Cache'i güncelle: hem yeni ID hem eski (temp_) ID ile eşleşenleri temizle
    let cached = getCache<Appointment[]>(CACHE_KEYS.APPOINTMENTS) || [];
    // Eski temp_ ID veya aynı gerçek ID'yi sil
    cached = cached.filter((a) => a.id !== updatedApt.id && a.id !== apt.id);
    // Güncellenmiş kaydı ekle
    cached.push(updatedApt);
    setCache(CACHE_KEYS.APPOINTMENTS, cached);

    return updatedApt;
  }, [userId]);

  const deleteAppointment = useCallback(async (id: string) => {
    if (!userId) return;
    if (userId !== "demo-user") {
      const { error } = await supabase.from("appointments").delete().eq("id", id).eq("user_id", userId);
      if (error) throw error;
    }

    const cached = getCache<Appointment[]>(CACHE_KEYS.APPOINTMENTS) || [];
    const filtered = cached.filter((a) => a.id !== id);
    setCache(CACHE_KEYS.APPOINTMENTS, filtered);
  }, [userId]);

  // ─── Patient Profiles ──────────────────────────────────────────

  // Eski "cc" birimini "ünite" olarak normalize et
  const normalizeFaceTreatments = (treatments: FaceTreatment[]): FaceTreatment[] => {
    if (!treatments || treatments.length === 0) return treatments;
    return treatments.map(t => t.unit === "cc" ? { ...t, unit: "ünite" } : t);
  };

  const assignGlobalTransactionNumbers = (profiles: Record<string, Omit<PatientProfile, "patient_name">>) => {
    const groups: { patientName: string; dayStr: string; timestamp: number }[] = [];
    
    // Her hastanın gün bazında ilk işleminin saatini bul
    for (const [patientName, profile] of Object.entries(profiles)) {
      if (!profile.face_treatments || profile.face_treatments.length === 0) continue;
      
      const dayMap = new Map<string, string>(); // day -> earliest date string
      for (const t of profile.face_treatments) {
        const day = t.date.split(" ")[0];
        if (!dayMap.has(day)) {
          dayMap.set(day, t.date);
        } else {
          // compare times safely (dd.MM.yyyy HH:mm format)
          const parseD = (dStr: string) => {
            const [d, tStr] = dStr.split(" ");
            if (!tStr) return 0;
            const [DD, MM, YYYY] = d.split(".");
            const [HH, mm] = tStr.split(":");
            return new Date(Number(YYYY), Number(MM) - 1, Number(DD), Number(HH), Number(mm)).getTime();
          };
          if (parseD(t.date) < parseD(dayMap.get(day)!)) {
            dayMap.set(day, t.date);
          }
        }
      }
      
      for (const [day, earliestDate] of dayMap.entries()) {
        const parseD = (dStr: string) => {
          const [d, tStr] = dStr.split(" ");
          if (!tStr) return 0;
          const [DD, MM, YYYY] = d.split(".");
          const [HH, mm] = tStr.split(":");
          return new Date(Number(YYYY), Number(MM) - 1, Number(DD), Number(HH), Number(mm)).getTime();
        };
        groups.push({
          patientName,
          dayStr: day,
          timestamp: parseD(earliestDate)
        });
      }
    }
    
    // Tüm grupları zamana göre kronolojik sırala
    groups.sort((a, b) => a.timestamp - b.timestamp);
    
    // Sırayla ISL numarası ata
    const dayToTxNo = new Map<string, string>();
    groups.forEach((g, index) => {
      const txNo = `#ISL-${(index + 1).toString().padStart(4, '0')}`;
      dayToTxNo.set(`${g.patientName}|${g.dayStr}`, txNo);
    });
    
    // Profillere ISL numaralarını yaz
    for (const [patientName, profile] of Object.entries(profiles)) {
      if (profile.face_treatments) {
        profile.face_treatments = profile.face_treatments.map(t => {
          const day = t.date.split(" ")[0];
          const txNo = dayToTxNo.get(`${patientName}|${day}`);
          return { ...t, transactionNo: txNo || t.transactionNo };
        });
      }
    }
    return profiles;
  };

  const getPatientProfiles = useCallback(async () => {
    try {
      if (!userId || userId === "demo-user") {
        const cached = getCache<Record<string, Omit<PatientProfile, "patient_name">>>(CACHE_KEYS.PROFILES) || {};
        // Normalize cached data
        for (const key of Object.keys(cached)) {
          if (cached[key].face_treatments) {
            cached[key].face_treatments = normalizeFaceTreatments(cached[key].face_treatments!);
          }
        }
        return assignGlobalTransactionNumbers(cached);
      }

      const { data, error } = await supabase
        .from("patient_profiles")
        .select("*")
        .eq("user_id", userId);

      if (!error && data) {
        const profiles: Record<string, Omit<PatientProfile, "patient_name">> = {};
        data.forEach((p: any) => {
          profiles[p.patient_name] = {
            phone: p.phone,
            tc_no: p.tc_no,
            birth_date: p.birth_date,
            address: p.address,
            meds: p.meds,
            notes_list: p.notes_list,
            stock_history: p.stock_history,
            face_treatments: normalizeFaceTreatments(p.face_treatments || []),
            face_gender: p.face_gender || 'female',
            before_after_photos: p.before_after_photos || [],
          };
        });
        const finalProfiles = assignGlobalTransactionNumbers(profiles);
        setCache(CACHE_KEYS.PROFILES, finalProfiles);
        return finalProfiles;
      }
    } catch (e) {
      console.warn("fetchFreshProfiles failed, falling back to cache", e);
    }

    const fallback = getCache<Record<string, Omit<PatientProfile, "patient_name">>>(CACHE_KEYS.PROFILES) || {};
    for (const key of Object.keys(fallback)) {
      if (fallback[key].face_treatments) {
        fallback[key].face_treatments = normalizeFaceTreatments(fallback[key].face_treatments!);
      }
    }
    return assignGlobalTransactionNumbers(fallback);
  }, [userId]);

  const savePatientProfile = useCallback(async (rawName: string, profile: Omit<PatientProfile, "patient_name">) => {
    if (!userId) return;
    const name = rawName.toLocaleUpperCase("tr-TR");

    if (userId !== "demo-user") {
      const { data: existing } = await supabase
        .from("patient_profiles")
        .select("id")
        .eq("patient_name", name)
        .eq("user_id", userId)
        .maybeSingle();

      const payload: any = {
        user_id: userId,
        patient_name: name,
        phone: profile.phone || "",
        tc_no: profile.tc_no || "",
        birth_date: profile.birth_date || "",
        address: profile.address || "",
        meds: profile.meds || [],
        notes_list: profile.notes_list || [],
        stock_history: profile.stock_history || [],
        face_treatments: profile.face_treatments || [],
        face_gender: profile.face_gender || 'female',
        before_after_photos: profile.before_after_photos || [],
      };

      if (existing) payload.id = existing.id;

      const { error } = await supabase.from("patient_profiles").upsert(payload, { onConflict: "id" });
      if (error) {
        console.error("Supabase Save Patient Profile Error:", error);
        throw error;
      }
    }
    
    const cached = getCache<Record<string, Omit<PatientProfile, "patient_name">>>(CACHE_KEYS.PROFILES) || {};
    cached[name] = profile;
    const finalCached = assignGlobalTransactionNumbers(cached);
    setCache(CACHE_KEYS.PROFILES, finalCached);
  }, [userId]);

  // ─── Inventory ─────────────────────────────────────────────────

  const getInventory = useCallback(async () => {
    try {
      if (!userId || userId === "demo-user") {
        const cached = getCache<{ stock: Record<string, number>; items: InventoryItem[] }>(CACHE_KEYS.INVENTORY);
        return cached ? normalizeInventory(cached) : { stock: {}, items: [] };
      }

      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("user_id", userId);

      if (!error && data) {
        // Load existing cache to preserve fields not in DB (kod, fiyat)
        const existingCache = getCache<{ stock: Record<string, number>; items: InventoryItem[] }>(CACHE_KEYS.INVENTORY);
        const cachedItemMap = new Map<string, InventoryItem>();
        if (existingCache) {
          existingCache.items.forEach(ci => cachedItemMap.set(ci.id, ci));
        }

        const stock: Record<string, number> = {};
        const items: InventoryItem[] = data.map((d: any) => {
          stock[d.item_id] = parseFloat(d.quantity);
          let birim = d.unit;
          if (d.name.toLowerCase().includes("anestezi krem") && birim.toLowerCase() === "kutu") {
            birim = "Gram";
          } else if (d.name.toLowerCase().includes("eldiven") && birim.toLowerCase() === "kutu") {
            birim = "Adet";
          }
          // Merge with cached item to preserve kod/fiyat
          const cachedItem = cachedItemMap.get(d.item_id);
          return {
            id: d.item_id,
            ad: d.name,
            birim: birim,
            kritik_stok: parseFloat(d.kritik_stok),
            kod: d.kod || cachedItem?.kod || undefined,
            fiyat: d.fiyat != null ? parseFloat(d.fiyat) : cachedItem?.fiyat,
            toplam_deger: d.toplam_deger != null ? parseFloat(d.toplam_deger) : cachedItem?.toplam_deger,
            hareketler: (d.hareketler && d.hareketler.length > 0) ? d.hareketler : (cachedItem?.hareketler || []),
          };
        });

        // Also include items that exist ONLY in cache (not in DB)
        if (existingCache) {
          const dbItemIds = new Set(data.map((d: any) => d.item_id));
          existingCache.items.forEach(ci => {
            if (!dbItemIds.has(ci.id)) {
              items.push(ci);
              stock[ci.id] = existingCache.stock[ci.id] || 0;
            }
          });
        }

        const result = { stock, items };
        setCache(CACHE_KEYS.INVENTORY, result);

        // Auto-sync cached data to Supabase if Supabase is missing fields
        if (existingCache && userId !== "demo-user") {
          const updatesToPush: any[] = [];
          items.forEach(item => {
            const dbData = data.find((d: any) => d.item_id === item.id);
            if (dbData) {
              let needsUpdate = false;
              if (item.fiyat !== undefined && dbData.fiyat == null) needsUpdate = true;
              if (item.kod !== undefined && dbData.kod == null) needsUpdate = true;
              if (item.toplam_deger !== undefined && dbData.toplam_deger == null) needsUpdate = true;
              if (item.hareketler && item.hareketler.length > 0 && (!dbData.hareketler || dbData.hareketler.length === 0)) needsUpdate = true;
              
              if (needsUpdate) {
                updatesToPush.push({
                  id: dbData.id,
                  user_id: userId,
                  item_id: item.id,
                  name: item.ad,
                  unit: item.birim,
                  quantity: stock[item.id] || 0,
                  kritik_stok: item.kritik_stok || 10,
                  fiyat: item.fiyat,
                  kod: item.kod,
                  toplam_deger: item.toplam_deger,
                  hareketler: item.hareketler
                });
              }
            }
          });
          
          if (updatesToPush.length > 0) {
            try {
              const { error: syncError } = await supabase.from("inventory").upsert(updatesToPush, { onConflict: "id" });
              if (syncError) {
                console.error("Auto-sync upsert error:", syncError);
              } else {
                console.log(`Auto-sync: ${updatesToPush.length} inventory items synced to Supabase`);
              }
            } catch (e) {
              console.warn("Auto-sync failed:", e);
            }
          }
        }

        return result;
      }
    } catch (e) {
      console.warn("fetchFreshInventory failed, falling back to cache", e);
    }

    const fallback = getCache<{ stock: Record<string, number>; items: InventoryItem[] }>(CACHE_KEYS.INVENTORY);
    return fallback ? normalizeInventory(fallback) : { stock: {}, items: [] };
  }, [userId]);

  const saveInventoryItem = useCallback(async (item: InventoryItem, quantity: number) => {
    if (!userId) return;

    if (userId !== "demo-user") {
      try {
        const { data: existing } = await supabase
          .from("inventory")
          .select("id")
          .eq("item_id", item.id)
          .eq("user_id", userId)
          .maybeSingle();

        const payload: any = {
          user_id: userId,
          item_id: item.id,
          name: item.ad,
          unit: item.birim,
          quantity: quantity,
          kritik_stok: item.kritik_stok || 10,
        };

        if (existing) payload.id = existing.id;
        
        if (item.kod !== undefined) payload.kod = item.kod;
        if (item.fiyat !== undefined) payload.fiyat = item.fiyat;
        if (item.toplam_deger !== undefined) payload.toplam_deger = item.toplam_deger;
        if (item.hareketler !== undefined) payload.hareketler = item.hareketler;

        const { error: upsertError } = await supabase.from("inventory").upsert(payload, { onConflict: "id" });
        if (upsertError) {
          console.error("saveInventoryItem upsert error:", upsertError);
        }
      } catch (e) {
        console.warn("saveInventoryItem supabase failed, saving to cache", e);
      }
    }
    // Always update cache regardless of supabase result
    const cached = getCache<{ stock: Record<string, number>; items: InventoryItem[] }>(CACHE_KEYS.INVENTORY) || {
      stock: {},
      items: [],
    };
    cached.stock[item.id] = quantity;
    const existingIdx = cached.items.findIndex((i) => i.id === item.id);
    if (existingIdx > -1) {
      // Update existing item properties (kod, fiyat, kritik_stok etc.)
      cached.items[existingIdx] = { ...cached.items[existingIdx], ...item };
    } else {
      cached.items.push(item);
    }
    setCache(CACHE_KEYS.INVENTORY, cached);
  }, [userId]);
  const deleteInventoryItem = useCallback(async (itemId: string) => {
    if (!userId) return;
    if (userId !== "demo-user") {
      const { error } = await supabase.from("inventory").delete().eq("item_id", itemId).eq("user_id", userId);
      if (error) throw error;
    }

    const cached = getCache<{ stock: Record<string, number>; items: InventoryItem[] }>(CACHE_KEYS.INVENTORY);
    if (cached) {
      cached.items = cached.items.filter((i) => i.id !== itemId);
      delete cached.stock[itemId];
      setCache(CACHE_KEYS.INVENTORY, cached);
    }
  }, [userId]);

  // ─── Services ──────────────────────────────────────────────────

  const getServices = useCallback(async (): Promise<Service[]> => {
    try {
      if (!userId || userId === "demo-user") return getCache<Service[]>(CACHE_KEYS.SERVICES) || [];

      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setCache(CACHE_KEYS.SERVICES, data);
        return data as Service[];
      }
    } catch (e) {
      console.warn("getServices failed, falling back to cache", e);
    }
    return getCache<Service[]>(CACHE_KEYS.SERVICES) || [];
  }, [userId]);

  const saveService = useCallback(async (service: Omit<Service, "id"> & { id?: string | number }) => {
    if (!userId) throw new Error("Oturum kapatılmış.");

    if (userId === "demo-user") {
      const saved = { ...service, id: service.id || "demo_srv_" + Date.now() } as Service;
      const cached = getCache<Service[]>(CACHE_KEYS.SERVICES) || [];
      const idx = cached.findIndex(s => s.id === saved.id || s.id === service.id);
      if (idx > -1) cached[idx] = saved;
      else cached.push(saved);
      setCache(CACHE_KEYS.SERVICES, cached);
      return saved;
    }

    const payload: any = {
      user_id: userId,
      ad: service.ad,
      sure: service.sure,
      fiyat: service.fiyat,
      renk: service.renk,
    };

    if (service.id && (typeof service.id !== "string" || !service.id.startsWith("temp_"))) {
      payload.id = service.id;
    }

    let { data, error } = await supabase
      .from("services")
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.error("Supabase Save Error:", error);
      throw new Error(`DB Hatası: ${error.message} (Kod: ${error.code})`);
    }
    
    if (!data || data.length === 0) {
      console.error("Supabase returned empty data after insert/update. Payload:", payload);
      // Fallback: If it inserted but couldn't read back, we return the payload as is
      data = [{ ...payload, id: payload.id || "temp_" + Date.now() }];
    }

    const cached = getCache<Service[]>(CACHE_KEYS.SERVICES) || [];
    const saved = data[0];
    const idx = cached.findIndex(s => s.id === saved.id || s.id === service.id);
    if (idx > -1) cached[idx] = saved;
    else cached.push(saved);
    
    setCache(CACHE_KEYS.SERVICES, cached);
    return saved as Service;
  }, [userId]);

  const deleteService = useCallback(async (id: string | number) => {
    if (!userId) return;
    if (userId !== "demo-user") {
      const { error } = await supabase.from("services").delete().eq("id", id).eq("user_id", userId);
      if (error) throw error;
    }

    const cached = getCache<Service[]>(CACHE_KEYS.SERVICES) || [];
    const filtered = cached.filter(s => s.id !== id);
    setCache(CACHE_KEYS.SERVICES, filtered);
  }, [userId]);

  // ─── Consent Records ──────────────────────────────────────────

  const saveConsentRecord = useCallback(async (record: ConsentRecord) => {
    if (!userId) throw new Error("Oturum kapatılmış, lütfen tekrar giriş yapın.");

    if (userId === "demo-user") {
      const newConsent = { ...record, id: record.id || "demo_cons_" + Date.now() };
      let cached = getCache<ConsentRecord[]>(CACHE_KEYS.CONSENTS) || [];
      if (record.id) {
        cached = cached.filter(c => c.id !== record.id);
      }
      cached.push(newConsent);
      setCache(CACHE_KEYS.CONSENTS, cached);
      return newConsent;
    }

    const payload: any = {
      user_id: userId,
      patient_name: record.patient_name,
      appointment_id: record.appointment_id || null,
      appointment_date: record.appointment_date || null,
      appointment_time: record.appointment_time || null,
      consent_text: record.consent_text,
      signature_data: record.signature_data || null,
      checkboxes: record.checkboxes || {},
      patient_tc: record.patient_tc || null,
      patient_phone: record.patient_phone || null,
    };

    if (record.id && !record.id.startsWith("demo_")) {
      payload.id = record.id;
    }

    const { data, error } = await supabase
      .from("consent_records")
      .upsert(payload, { onConflict: "id" })
      .select();

    if (error) throw error;

    // Update cache
    let cached = getCache<ConsentRecord[]>(CACHE_KEYS.CONSENTS) || [];
    if (data && data[0]) {
      cached = cached.filter(c => c.id !== data[0].id);
      cached.push(data[0]);
    }
    setCache(CACHE_KEYS.CONSENTS, cached);

    return data?.[0];
  }, [userId]);

  const deleteConsentRecord = useCallback(async (id: string) => {
    if (!userId) return;
    if (userId !== "demo-user") {
      const { error } = await supabase.from("consent_records").delete().eq("id", id).eq("user_id", userId);
      if (error) throw error;
    }

    const cached = getCache<ConsentRecord[]>(CACHE_KEYS.CONSENTS) || [];
    const filtered = cached.filter(c => c.id !== id);
    setCache(CACHE_KEYS.CONSENTS, filtered);
  }, [userId]);

  const getConsentRecords = useCallback(async (patientName?: string): Promise<ConsentRecord[]> => {
    try {
      if (!userId || userId === "demo-user") {
        const cached = getCache<ConsentRecord[]>(CACHE_KEYS.CONSENTS) || [];
        if (patientName) return cached.filter(c => c.patient_name === patientName);
        return cached;
      }

      let query = supabase
        .from("consent_records")
        .select("*")
        .eq("user_id", userId)
        .order("signed_at", { ascending: false });

      if (patientName) {
        query = query.eq("patient_name", patientName);
      }

      const { data, error } = await query;

      if (!error && data) {
        if (!patientName) setCache(CACHE_KEYS.CONSENTS, data);
        return data as ConsentRecord[];
      }
    } catch (e) {
      console.warn("getConsentRecords failed, falling back to cache", e);
    }

    const cached = getCache<ConsentRecord[]>(CACHE_KEYS.CONSENTS) || [];
    if (patientName) return cached.filter(c => c.patient_name === patientName);
    return cached;
  }, [userId]);

  const getConsentByAppointment = useCallback(async (appointmentId: string): Promise<ConsentRecord | null> => {
    try {
      if (!userId) return null;
      if (userId === "demo-user") {
        const cached = getCache<ConsentRecord[]>(CACHE_KEYS.CONSENTS) || [];
        return cached.find(c => c.appointment_id === appointmentId) || null;
      }

      const { data, error } = await supabase
        .from("consent_records")
        .select("*")
        .eq("user_id", userId)
        .eq("appointment_id", appointmentId)
        .maybeSingle();

      if (!error && data) return data as ConsentRecord;
    } catch (e) {
      console.warn("getConsentByAppointment failed", e);
    }
    return null;
  }, [userId]);

  return {
    getAppointments,
    fetchFreshAppointments,
    saveAppointment,
    deleteAppointment,
    getPatientProfiles,
    savePatientProfile,
    getInventory,
    saveInventoryItem,
    deleteInventoryItem,
    getServices,
    saveService,
    deleteService,
    saveConsentRecord,
    deleteConsentRecord,
    getConsentRecords,
    getConsentByAppointment,
  };
}
