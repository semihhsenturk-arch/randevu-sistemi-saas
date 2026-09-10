-- 🔴 FAZ 3: KVKK-02 SOFT DELETE SQL MIGRATION
-- Bu script, hastaların KVKK kapsamında tamamen silinmesi yerine (ilişkili verileri bozmamak için)
-- "is_deleted" olarak işaretlenmesini sağlar.

-- 1. patient_profiles tablosuna is_deleted sütununu ekle
ALTER TABLE public.patient_profiles 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 2. Hızlı filtreleme için indeks ekle
CREATE INDEX IF NOT EXISTS idx_patient_profiles_is_deleted 
ON public.patient_profiles (is_deleted);
