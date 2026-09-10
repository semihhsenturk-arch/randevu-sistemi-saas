-- ARC-02: Veritabanı İndeksleme ve N+1 Sorgu Çözümleri
-- Hasta sayısı arttıkça oluşacak yavaşlamaları önlemek için gerekli veritabanı indeksleri eklendi.

-- 1. patient_profiles tablosuna (user_id, patient_name) composite unique index
-- Not: user_id ve patient_name ikilisi ile unique kısıtlaması, upsert() işlemlerinin doğru çalışması için gereklidir.
CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_profiles_user_name 
ON public.patient_profiles (user_id, patient_name);

-- 2. appointments tablosuna (user_id, tarih) composite index
-- Not: user_id ve tarih alanına göre randevuların hızlı filtrelenebilmesi için eklenmiştir.
CREATE INDEX IF NOT EXISTS idx_appointments_user_tarih 
ON public.appointments (user_id, tarih);
