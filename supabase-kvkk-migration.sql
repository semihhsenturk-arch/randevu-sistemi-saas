-- =====================================================
-- KVKK-01: Hasta Seviyesi KVKK Açık Rıza Mekanizması
-- consent_records tablosuna consent_type alanı eklenir
-- ve rıza geri çekme mekanizması desteklenir.
-- Bu SQL'i Supabase Dashboard > SQL Editor'dan çalıştırın.
-- =====================================================

-- 1. consent_type kolonu ekle (tıbbi onam / kvkk rızası ayrımı)
ALTER TABLE consent_records
  ADD COLUMN IF NOT EXISTS consent_type TEXT DEFAULT 'medical'
    CHECK (consent_type IN ('medical', 'kvkk_health_data', 'kvkk_data_transfer'));

-- 2. Rıza geri çekme desteği
ALTER TABLE consent_records
  ADD COLUMN IF NOT EXISTS is_withdrawn BOOLEAN DEFAULT FALSE;
ALTER TABLE consent_records
  ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ;
ALTER TABLE consent_records
  ADD COLUMN IF NOT EXISTS withdrawn_reason TEXT;

-- 3. patient_profiles tablosuna soft delete desteği (KVKK-02)
ALTER TABLE patient_profiles
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE patient_profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE patient_profiles
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- 4. patient_profiles tablosuna kvkk_consent_given alanı
ALTER TABLE patient_profiles
  ADD COLUMN IF NOT EXISTS kvkk_consent_given BOOLEAN DEFAULT FALSE;
ALTER TABLE patient_profiles
  ADD COLUMN IF NOT EXISTS kvkk_consent_date TIMESTAMPTZ;

-- 5. Erişim logları tablosu (KVKK-03)
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    action TEXT NOT NULL DEFAULT 'SELECT',
    ip_address TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Klinik kullanıcıları sadece kendi erişim loglarını görebilir
CREATE POLICY "Users can view own access logs"
  ON access_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_access_logs_user_date ON access_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_table ON access_logs(user_id, table_name);

-- 6. consent_records tablosuna audit trigger ekle (eksikti)
DROP TRIGGER IF EXISTS audit_consent_records ON public.consent_records;
CREATE TRIGGER audit_consent_records
AFTER INSERT OR UPDATE OR DELETE ON public.consent_records
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- 7. access_logs tablosuna tetikleyici yok — bu tablo zaten log tablosu
