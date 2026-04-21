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
};

export type PatientProfile = {
  id?: string;
  patient_name: string;
  meds: any[];
  notes_list: { date: string; content: string }[];
  stock_history: any[];
};

export type InventoryItem = {
  id: string;
  ad: string;
  birim: string;
  kritik_stok: number;
};

const CACHE_KEYS = {
  APPOINTMENTS: "cache_appointments",
  PROFILES: "cache_patient_profiles",
  INVENTORY: "cache_inventory",
};

function getCache<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function setCache(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}

// Helper: get user ID from local session (no network call)
async function getUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
}

export function useDatabase() {

  // ─── Appointments ──────────────────────────────────────────────

  const getAppointments = useCallback(async (): Promise<Appointment[]> => {
    const cached = getCache<Appointment[]>(CACHE_KEYS.APPOINTMENTS);

    // Background fetch function
    const fetchFresh = async (): Promise<Appointment[] | null> => {
      try {
        const userId = await getUserId();
        if (!userId) return null;

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
          }));
          setCache(CACHE_KEYS.APPOINTMENTS, mapped);
          return mapped;
        }
        return null;
      } catch {
        return null;
      }
    };

    // SWR: Cache varsa hemen dön, arka planda güncelle
    if (cached && cached.length > 0) {
      fetchFresh(); // fire-and-forget background revalidation
      return cached;
    }

    // Cache yoksa sunucuyu bekle
    const fresh = await fetchFresh();
    return fresh || [];
  }, []);

  const fetchFreshAppointments = useCallback(async (): Promise<Appointment[]> => {
    const userId = await getUserId();
    if (!userId) return getCache<Appointment[]>(CACHE_KEYS.APPOINTMENTS) || [];

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
      }));
      setCache(CACHE_KEYS.APPOINTMENTS, mapped);
      return mapped;
    }
    return getCache<Appointment[]>(CACHE_KEYS.APPOINTMENTS) || [];
  }, []);

  const saveAppointment = useCallback(async (apt: Appointment) => {
    const userId = await getUserId();
    if (!userId) throw new Error("Oturum kapatılmış, lütfen tekrar giriş yapın.");

    const payload: any = {
      user_id: userId,
      musteri_adi: apt.musteriAdi,
      telefon: apt.telefon,
      hizmet_id: parseInt(apt.hizmetId.toString()) || 1,
      tarih: apt.tarih,
      saat: apt.saat,
      durum: apt.durum,
      notlar: apt.notlar,
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

    const cached = getCache<Appointment[]>(CACHE_KEYS.APPOINTMENTS) || [];
    const updatedApt: Appointment = {
      id: data[0].id,
      musteriAdi: data[0].musteri_adi,
      telefon: data[0].telefon,
      hizmetId: data[0].hizmet_id,
      tarih: data[0].tarih,
      saat: data[0].saat,
      durum: data[0].durum,
      notlar: data[0].notlar,
    };

    const idx = cached.findIndex((a) => a.id === updatedApt.id || a.id === apt.id);
    if (idx > -1) cached[idx] = updatedApt;
    else cached.push(updatedApt);
    setCache(CACHE_KEYS.APPOINTMENTS, cached);

    return updatedApt;
  }, []);

  const deleteAppointment = useCallback(async (id: string) => {
    const userId = await getUserId();
    if (!userId) return;
    const { error } = await supabase.from("appointments").delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;

    const cached = getCache<Appointment[]>(CACHE_KEYS.APPOINTMENTS) || [];
    const filtered = cached.filter((a) => a.id !== id);
    setCache(CACHE_KEYS.APPOINTMENTS, filtered);
  }, []);

  // ─── Patient Profiles ──────────────────────────────────────────

  const getPatientProfiles = useCallback(async () => {
    const cached = getCache<Record<string, Omit<PatientProfile, "patient_name">>>(CACHE_KEYS.PROFILES);

    const fetchFresh = async () => {
      try {
        const userId = await getUserId();
        if (!userId) return null;

        const { data, error } = await supabase
          .from("patient_profiles")
          .select("*")
          .eq("user_id", userId);
        if (error) return null;

        const profiles: Record<string, Omit<PatientProfile, "patient_name">> = {};
        data.forEach((p: any) => {
          profiles[p.patient_name] = {
            meds: p.meds,
            notes_list: p.notes_list,
            stock_history: p.stock_history,
          };
        });
        setCache(CACHE_KEYS.PROFILES, profiles);
        return profiles;
      } catch {
        return null;
      }
    };

    // SWR: Cache varsa hemen dön
    if (cached && Object.keys(cached).length > 0) {
      fetchFresh();
      return cached;
    }

    const fresh = await fetchFresh();
    return fresh || {};
  }, []);

  const savePatientProfile = useCallback(async (name: string, profile: Omit<PatientProfile, "patient_name">) => {
    const userId = await getUserId();
    if (!userId) return;

    const { data: existing } = await supabase
      .from("patient_profiles")
      .select("id")
      .eq("patient_name", name)
      .eq("user_id", userId)
      .maybeSingle();

    const payload: any = {
      user_id: userId,
      patient_name: name,
      meds: profile.meds || [],
      notes_list: profile.notes_list || [],
      stock_history: profile.stock_history || [],
    };

    if (existing) payload.id = existing.id;

    const { error } = await supabase.from("patient_profiles").upsert(payload, { onConflict: "id" });
    if (!error) {
      const cached = getCache<Record<string, Omit<PatientProfile, "patient_name">>>(CACHE_KEYS.PROFILES) || {};
      cached[name] = profile;
      setCache(CACHE_KEYS.PROFILES, cached);
    }
  }, []);

  // ─── Inventory ─────────────────────────────────────────────────

  const getInventory = useCallback(async () => {
    const cached = getCache<{ stock: Record<string, number>; items: InventoryItem[] }>(CACHE_KEYS.INVENTORY);

    const fetchFresh = async () => {
      try {
        const userId = await getUserId();
        if (!userId) return null;

        const { data, error } = await supabase
          .from("inventory")
          .select("*")
          .eq("user_id", userId);
        if (error) return null;

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
      } catch {
        return null;
      }
    };

    // SWR: Cache varsa hemen dön
    if (cached && cached.items.length > 0) {
      fetchFresh();
      return cached;
    }

    const fresh = await fetchFresh();
    return fresh || { stock: {}, items: [] };
  }, []);

  const saveInventoryItem = useCallback(async (item: InventoryItem, quantity: number) => {
    const userId = await getUserId();
    if (!userId) return;

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
    if (!error) {
      const cached = getCache<{ stock: Record<string, number>; items: InventoryItem[] }>(CACHE_KEYS.INVENTORY) || {
        stock: {},
        items: [],
      };
      cached.stock[item.id] = quantity;
      if (!cached.items.find((i) => i.id === item.id)) {
        cached.items.push(item);
      }
      setCache(CACHE_KEYS.INVENTORY, cached);
    }
  }, []);

  const deleteInventoryItem = useCallback(async (itemId: string) => {
    const userId = await getUserId();
    if (!userId) return;
    const { error } = await supabase.from("inventory").delete().eq("item_id", itemId).eq("user_id", userId);
    if (error) throw error;

    const cached = getCache<{ stock: Record<string, number>; items: InventoryItem[] }>(CACHE_KEYS.INVENTORY);
    if (cached) {
      cached.items = cached.items.filter((i) => i.id !== itemId);
      delete cached.stock[itemId];
      setCache(CACHE_KEYS.INVENTORY, cached);
    }
  }, []);

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
  };
}
