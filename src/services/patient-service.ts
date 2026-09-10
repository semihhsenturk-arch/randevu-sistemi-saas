import { PatientProfile, CACHE_KEYS, getCacheSync, setCache } from "@/hooks/use-database";
import { SupabaseRepository } from "@/repositories/supabase-repository";
import { encryptPatientProfile, decryptPatientProfilesBatch } from "@/actions/secure-data";

export class PatientService {
  static normalizeFaceTreatments(treatments: any[]): any[] {
    if (!treatments || treatments.length === 0) return treatments;
    return treatments.map(t => t.unit === "cc" ? { ...t, unit: "ünite" } : t);
  }

  static async getProfiles(userId: string | undefined): Promise<Record<string, Omit<PatientProfile, "patient_name">>> {
    if (!userId || userId === "demo-user") {
      const fallback = getCacheSync<Record<string, Omit<PatientProfile, "patient_name">>>(CACHE_KEYS.PROFILES) || {};
      for (const key of Object.keys(fallback)) {
        if (fallback[key].face_treatments) {
          fallback[key].face_treatments = PatientService.normalizeFaceTreatments(fallback[key].face_treatments!);
        }
      }
      return fallback;
    }

    try {
      const data = await SupabaseRepository.fetchPatientProfiles(userId);
      if (!data || data.length === 0) return {};

      const decryptedData = await decryptPatientProfilesBatch(data);
      
      const mapped: Record<string, Omit<PatientProfile, "patient_name">> = {};
      for (const d of decryptedData) {
        if (!d.patient_name) continue;
        mapped[d.patient_name.toLocaleUpperCase("tr-TR")] = {
          phone: d.phone || "",
          tc_no: d.tc_no || "",
          birth_date: d.birth_date || "",
          address: d.address || "",
          meds: d.meds || [],
          notes_list: d.notes_list || [],
          stock_history: d.stock_history || [],
          face_treatments: d.face_treatments || [],
          face_gender: d.face_gender || 'female',
          before_after_photos: d.before_after_photos || [],
        };
      }
      setCache(CACHE_KEYS.PROFILES, mapped);
      return mapped;
    } catch (e) {
      console.warn("fetchPatientProfiles failed, falling back to cache", e);
      return getCacheSync<Record<string, Omit<PatientProfile, "patient_name">>>(CACHE_KEYS.PROFILES) || {};
    }
  }

  static async saveProfile(
    userId: string | undefined, 
    rawName: string, 
    profile: Omit<PatientProfile, "patient_name">
  ): Promise<void> {
    if (!userId) return;
    const name = rawName.toLocaleUpperCase("tr-TR");

    if (userId !== "demo-user") {
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

      const encryptedPayload = await encryptPatientProfile(payload);
      
      await SupabaseRepository.upsertPatientProfile(encryptedPayload);
    }
    
    const cached = getCacheSync<Record<string, Omit<PatientProfile, "patient_name">>>(CACHE_KEYS.PROFILES) || {};
    cached[name] = profile;
    setCache(CACHE_KEYS.PROFILES, cached);
  }
}
