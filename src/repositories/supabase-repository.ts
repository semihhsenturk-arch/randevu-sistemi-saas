import { supabase } from "@/lib/supabase";

export class SupabaseRepository {
  static async upsertPatientProfile(payload: any) {
    // Requires UNIQUE INDEX ON (user_id, patient_name) in database!
    const { data, error } = await supabase
      .from("patient_profiles")
      .upsert(payload, { onConflict: "user_id, patient_name" });
      
    if (error) throw error;
    return data;
  }

  static async fetchPatientProfiles(userId: string) {
    const { data, error } = await supabase
      .from("patient_profiles")
      .select("*")
      .eq("user_id", userId)
      .or("is_deleted.is.null,is_deleted.eq.false");

    if (error) throw error;
    return data;
  }
}
