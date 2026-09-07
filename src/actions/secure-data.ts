"use server";

import { encryptData, decryptData } from "@/lib/encryption";
import { getAuthenticatedUser } from "@/lib/supabase-server";

// === PATIENT PROFILES ===

export async function encryptPatientProfile(profile: any) {
  const user = await getAuthenticatedUser();
  if (!user && profile.user_id !== "demo-user") throw new Error("Unauthorized");

  return {
    ...profile,
    tc_no: encryptData(profile.tc_no),
    phone: encryptData(profile.phone),
    address: encryptData(profile.address),
    notes_list: profile.notes_list?.map((n: any) => ({
      ...n,
      content: encryptData(n.content)
    })) || []
  };
}

export async function decryptPatientProfilesBatch(profiles: any[]) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  return profiles.map(p => ({
    ...p,
    tc_no: decryptData(p.tc_no),
    phone: decryptData(p.phone),
    address: decryptData(p.address),
    notes_list: p.notes_list?.map((n: any) => ({
      ...n,
      content: decryptData(n.content)
    })) || []
  }));
}


// === APPOINTMENTS ===

export async function encryptAppointment(apt: any) {
  const user = await getAuthenticatedUser();
  if (!user && apt.user_id !== "demo-user") throw new Error("Unauthorized");

  return {
    ...apt,
    telefon: encryptData(apt.telefon),
    notlar: encryptData(apt.notlar),
  };
}

export async function decryptAppointmentsBatch(apts: any[]) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  return apts.map(apt => ({
    ...apt,
    telefon: decryptData(apt.telefon),
    notlar: decryptData(apt.notlar),
  }));
}

// === CONSENT RECORDS ===

export async function encryptConsentRecord(record: any) {
  const user = await getAuthenticatedUser();
  if (!user && record.user_id !== "demo-user") throw new Error("Unauthorized");

  return {
    ...record,
    patient_tc: encryptData(record.patient_tc),
    patient_phone: encryptData(record.patient_phone),
  };
}

export async function decryptConsentRecordsBatch(records: any[]) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  return records.map(r => ({
    ...r,
    patient_tc: decryptData(r.patient_tc),
    patient_phone: decryptData(r.patient_phone),
  }));
}

