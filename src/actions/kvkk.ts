"use server";

import { getAuthenticatedUser, createServiceClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

/**
 * KVKK-02: Hasta profilini soft-delete yapar.
 * Veriler fiziksel olarak silinmez, ancak is_deleted=true olarak işaretlenir.
 * KVKK md. 7 — "silme, yok etme veya anonim hale getirme" hakkı.
 */
export async function softDeletePatientProfile(patientId: string, reason?: string) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createServiceClient();

  // Hastanın bu kullanıcıya ait olduğunu doğrula
  const { data: profile, error: fetchError } = await supabase
    .from("patient_profiles")
    .select("id, user_id")
    .eq("id", patientId)
    .single();

  if (fetchError || !profile) throw new Error("Hasta bulunamadı");
  if (profile.user_id !== user.id) throw new Error("Unauthorized: Ownership mismatch");

  const { error } = await supabase
    .from("patient_profiles")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deletion_reason: reason || "Hasta talebi (KVKK md. 7)",
    })
    .eq("id", patientId);

  if (error) throw new Error(error.message);

  revalidatePath("/hasta-listesi");
  return true;
}

/**
 * KVKK-02: Hasta verisini kalıcı olarak siler (hard delete).
 * Audit log'larındaki hassas veriler de maskelenir.
 * Bu işlem geri alınamaz.
 */
export async function hardDeletePatientProfile(patientId: string) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createServiceClient();

  // Hastanın bu kullanıcıya ait olduğunu doğrula
  const { data: profile, error: fetchError } = await supabase
    .from("patient_profiles")
    .select("id, user_id, patient_name")
    .eq("id", patientId)
    .single();

  if (fetchError || !profile) throw new Error("Hasta bulunamadı");
  if (profile.user_id !== user.id) throw new Error("Unauthorized: Ownership mismatch");

  // 1. İlişkili onam kayıtlarını sil
  await supabase
    .from("consent_records")
    .delete()
    .eq("user_id", user.id)
    .eq("patient_name", profile.patient_name);

  // 2. Audit log'larındaki hassas veriyi maskele
  // old_data ve new_data içindeki tc_no, phone, address alanlarını "***MASKED***" yap
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, old_data, new_data")
    .eq("record_id", patientId)
    .eq("table_name", "patient_profiles");

  if (logs && logs.length > 0) {
    for (const log of logs) {
      const maskedOld = maskSensitiveFields(log.old_data);
      const maskedNew = maskSensitiveFields(log.new_data);
      await supabase
        .from("audit_logs")
        .update({ old_data: maskedOld, new_data: maskedNew })
        .eq("id", log.id);
    }
  }

  // 3. Hasta profilini sil
  const { error } = await supabase
    .from("patient_profiles")
    .delete()
    .eq("id", patientId);

  if (error) throw new Error(error.message);

  revalidatePath("/hasta-listesi");
  return true;
}

/**
 * KVKK-01: Hasta KVKK rızasını kaydet.
 * Sağlık verisinin dijital ortamda işlenmesine ilişkin açık rıza.
 */
export async function saveKvkkConsent(
  patientName: string,
  consentType: "kvkk_health_data" | "kvkk_data_transfer",
  consentText: string,
  checkboxes: Record<string, boolean>
) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createServiceClient();

  // consent_records tablosuna KVKK rızası kaydı ekle
  const { error } = await supabase.from("consent_records").insert({
    user_id: user.id,
    patient_name: patientName,
    consent_type: consentType,
    consent_text: consentText,
    checkboxes,
    signed_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  // patient_profiles tablosunda kvkk_consent_given güncelle
  await supabase
    .from("patient_profiles")
    .update({
      kvkk_consent_given: true,
      kvkk_consent_date: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("patient_name", patientName);

  return true;
}

/**
 * KVKK-01: KVKK rızasını geri çek.
 * KVKK md. 7 kapsamında rıza geri çekme hakkı.
 */
export async function withdrawKvkkConsent(consentId: string, reason?: string) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createServiceClient();

  // Kaydın bu kullanıcıya ait olduğunu doğrula
  const { data: record, error: fetchError } = await supabase
    .from("consent_records")
    .select("id, user_id, patient_name")
    .eq("id", consentId)
    .single();

  if (fetchError || !record) throw new Error("Rıza kaydı bulunamadı");
  if (record.user_id !== user.id) throw new Error("Unauthorized: Ownership mismatch");

  const { error } = await supabase
    .from("consent_records")
    .update({
      is_withdrawn: true,
      withdrawn_at: new Date().toISOString(),
      withdrawn_reason: reason || "Hasta talebi",
    })
    .eq("id", consentId);

  if (error) throw new Error(error.message);

  // patient_profiles tablosunda kvkk_consent_given güncelle
  await supabase
    .from("patient_profiles")
    .update({ kvkk_consent_given: false })
    .eq("user_id", user.id)
    .eq("patient_name", record.patient_name);

  return true;
}

/**
 * KVKK-03: Erişim logu kaydet.
 * Kimin, ne zaman, hangi hasta kaydına baktığını kaydeder.
 */
export async function logAccess(
  tableName: string,
  recordId?: string,
  action: string = "SELECT",
  details?: Record<string, any>
) {
  const user = await getAuthenticatedUser();
  if (!user) return; // Demo mode veya auth yok ise sessizce geç

  const supabase = await createServiceClient();

  await supabase.from("access_logs").insert({
    user_id: user.id,
    table_name: tableName,
    record_id: recordId,
    action,
    details: details || {},
  });
}

/**
 * KVKK-03: Klinik kullanıcısının kendi erişim loglarını getir.
 */
export async function getAccessLogs(
  limit: number = 50,
  offset: number = 0,
  tableName?: string
) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createServiceClient();

  let query = supabase
    .from("access_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (tableName) {
    query = query.eq("table_name", tableName);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data || [];
}

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────

function maskSensitiveFields(data: any): any {
  if (!data) return data;
  const masked = { ...data };
  const sensitiveKeys = ["tc_no", "phone", "address", "patient_tc", "patient_phone", "telefon"];
  for (const key of sensitiveKeys) {
    if (masked[key]) {
      masked[key] = "***KVKK_MASKED***";
    }
  }
  // notes_list içindeki content alanlarını maskele
  if (masked.notes_list && Array.isArray(masked.notes_list)) {
    masked.notes_list = masked.notes_list.map((n: any) => ({
      ...n,
      content: "***KVKK_MASKED***",
    }));
  }
  return masked;
}
