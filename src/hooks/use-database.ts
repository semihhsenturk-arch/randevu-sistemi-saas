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
};

export type FaceTreatment = {
  id: string;
  date: string;
  zone: string;
  type: 'botoks' | 'dolgu';
  amount: number;
  unit: string;
  product?: string;
  note?: string;
};

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

export type InventoryItem = {
  id: string;
  ad: string;
  birim: string;
  kritik_stok: number;
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
  APPOINTMENTS: "cache_appointments",
  PROFILES: "cache_patient_profiles",
  INVENTORY: "cache_inventory",
  ADMIN_USERS: "cache_admin_users",
  SERVICES: "cache_services",
  CONSENTS: "cache_consent_records",
};

export function getCacheSync<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
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

  const getPatientProfiles = useCallback(async () => {
    try {
      if (!userId || userId === "demo-user") return getCache<Record<string, Omit<PatientProfile, "patient_name">>>(CACHE_KEYS.PROFILES) || {};

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
            face_treatments: p.face_treatments || [],
            face_gender: p.face_gender || 'female',
            before_after_photos: p.before_after_photos || [],
          };
        });
        setCache(CACHE_KEYS.PROFILES, profiles);
        return profiles;
      }
    } catch (e) {
      console.warn("fetchFreshProfiles failed, falling back to cache", e);
    }

    return getCache<Record<string, Omit<PatientProfile, "patient_name">>>(CACHE_KEYS.PROFILES) || {};
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
    setCache(CACHE_KEYS.PROFILES, cached);
  }, [userId]);

  // ─── Inventory ─────────────────────────────────────────────────

  const getInventory = useCallback(async () => {
    try {
      if (!userId || userId === "demo-user") return getCache<{ stock: Record<string, number>; items: InventoryItem[] }>(CACHE_KEYS.INVENTORY) || { stock: {}, items: [] };

      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("user_id", userId);

      if (!error && data) {
        const stock: Record<string, number> = {};
        const items: InventoryItem[] = data.map((d: any) => {
          stock[d.item_id] = parseFloat(d.quantity);
          return {
            id: d.item_id,
            ad: d.name,
            birim: d.unit,
            kritik_stok: parseFloat(d.kritik_stok),
          };
        });
        const result = { stock, items };
        setCache(CACHE_KEYS.INVENTORY, result);
        return result;
      }
    } catch (e) {
      console.warn("fetchFreshInventory failed, falling back to cache", e);
    }

    return getCache<{ stock: Record<string, number>; items: InventoryItem[] }>(CACHE_KEYS.INVENTORY) || { stock: {}, items: [] };
  }, [userId]);

  const saveInventoryItem = useCallback(async (item: InventoryItem, quantity: number) => {
    if (!userId) return;

    if (userId !== "demo-user") {
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

      const { error } = await supabase.from("inventory").upsert(payload, { onConflict: "id" });
      if (error) return; // Silent fail handled by cache anyway
    }
      const cached = getCache<{ stock: Record<string, number>; items: InventoryItem[] }>(CACHE_KEYS.INVENTORY) || {
        stock: {},
        items: [],
      };
      cached.stock[item.id] = quantity;
      if (!cached.items.find((i) => i.id === item.id)) {
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
      const cached = getCache<ConsentRecord[]>(CACHE_KEYS.CONSENTS) || [];
      cached.push(newConsent);
      setCache(CACHE_KEYS.CONSENTS, cached);
      return newConsent;
    }

    const payload = {
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

    const { data, error } = await supabase
      .from("consent_records")
      .insert(payload)
      .select();

    if (error) throw error;

    // Update cache
    const cached = getCache<ConsentRecord[]>(CACHE_KEYS.CONSENTS) || [];
    if (data && data[0]) cached.push(data[0]);
    setCache(CACHE_KEYS.CONSENTS, cached);

    return data?.[0];
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
    getConsentRecords,
    getConsentByAppointment,
  };
}
