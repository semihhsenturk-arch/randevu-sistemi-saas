-- =====================================================
-- Dijital Onam Formu Tablosu — consent_records
-- Bu SQL'i Supabase Dashboard > SQL Editor'dan çalıştırın
-- =====================================================

CREATE TABLE IF NOT EXISTS consent_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_name TEXT NOT NULL,
  appointment_id TEXT,
  appointment_date TEXT,
  appointment_time TEXT,
  consent_text TEXT NOT NULL,
  signature_data TEXT,
  checkboxes JSONB DEFAULT '{}',
  patient_tc TEXT,
  patient_phone TEXT,
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own consent records"
  ON consent_records FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consent_patient ON consent_records(user_id, patient_name);
CREATE INDEX IF NOT EXISTS idx_consent_appointment ON consent_records(user_id, appointment_id);
