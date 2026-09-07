-- ==============================================================
-- 🟠 FAZ 8: AUDIT LOG (İZ KAYDI) SİSTEMİ KURULUM SCRİPTİ
-- ==============================================================
-- Sağlık ve hasta verilerinin güvenliği / KVKK gereklilikleri için
-- veritabanında yapılan tüm ekleme, silme ve güncellemeleri kayıt altına alır.
-- Bu scripti Supabase Dashboard -> SQL Editor alanına yapıştırıp çalıştırınız.

-- 1. ADIM: Audit Logs Tablosunu Oluştur
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT, -- Etkilenen kaydın ID'si
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB, -- Güncelleme/Silme öncesi veri
    new_data JSONB, -- Ekleme/Güncelleme sonrası veri
    auth_user_id UUID, -- İşlemi yapan kullanıcının ID'si
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Audit loglarına dışarıdan müdahaleyi (Insert/Update/Delete) RLS ile tamamen kapat
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- Hiçbir politika (policy) eklemiyoruz, bu sayede kimse (sadece Postgres tetikleyicileri ve admin hariç) logları göremez ve silemez.

-- 2. ADIM: Tetikleyici (Trigger) Fonksiyonunu Yaz
CREATE OR REPLACE FUNCTION public.handle_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Supabase auth kontekstinden işlemi yapan kullanıcının ID'sini al
    current_user_id := auth.uid();

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, auth_user_id)
        VALUES (TG_TABLE_NAME::TEXT, OLD.id::TEXT, 'DELETE', row_to_json(OLD)::JSONB, current_user_id);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, auth_user_id)
        VALUES (TG_TABLE_NAME::TEXT, NEW.id::TEXT, 'UPDATE', row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB, current_user_id);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, new_data, auth_user_id)
        VALUES (TG_TABLE_NAME::TEXT, NEW.id::TEXT, 'INSERT', row_to_json(NEW)::JSONB, current_user_id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER: Bu fonksiyonun RLS'yi atlayarak log tablosuna yazabilmesini sağlar.

-- 3. ADIM: Hassas Tablolara Tetikleyicileri (Triggers) Ekle

-- patient_profiles tablosu için
DROP TRIGGER IF EXISTS audit_patient_profiles ON public.patient_profiles;
CREATE TRIGGER audit_patient_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.patient_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- appointments tablosu için
DROP TRIGGER IF EXISTS audit_appointments ON public.appointments;
CREATE TRIGGER audit_appointments
AFTER INSERT OR UPDATE OR DELETE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- profiles tablosu için
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();
