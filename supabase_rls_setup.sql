-- ==============================================================
-- 🔴 FAZ 6: SUPABASE RLS (ROW LEVEL SECURITY) KURULUM SCRİPTİ
-- ==============================================================
-- Güvenlik Raporundaki IDOR zafiyetlerini tamamen kapatmak için
-- her bir tablonun satır bazlı güvenlik politikalarını tanımlar.
-- Bu scripti Supabase Dashboard -> SQL Editor alanına yapıştırıp çalıştırınız.

-- 1. ADIM: Tüm tablolarda RLS'yi aktif et
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. ADIM: Var olan eski (varsa) güvensiz politikaları temizle
DROP POLICY IF EXISTS "Enable read access for all users" ON public.patient_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.patient_profiles;
DROP POLICY IF EXISTS "Users can only read their own patients" ON public.patient_profiles;
DROP POLICY IF EXISTS "Users can only insert their own patients" ON public.patient_profiles;
DROP POLICY IF EXISTS "Users can only update their own patients" ON public.patient_profiles;
DROP POLICY IF EXISTS "Users can only delete their own patients" ON public.patient_profiles;

DROP POLICY IF EXISTS "Users can read their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON public.appointments;

DROP POLICY IF EXISTS "Users can read their own services" ON public.services;
DROP POLICY IF EXISTS "Users can insert their own services" ON public.services;
DROP POLICY IF EXISTS "Users can update their own services" ON public.services;
DROP POLICY IF EXISTS "Users can delete their own services" ON public.services;

DROP POLICY IF EXISTS "Users can read their own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can insert their own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can update their own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can delete their own inventory" ON public.inventory;

DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 3. ADIM: 'patient_profiles' tablosu politikaları (Sadece Kendi Hastaları)
CREATE POLICY "Users can read their own patients" ON public.patient_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patients" ON public.patient_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patients" ON public.patient_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patients" ON public.patient_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- 4. ADIM: 'appointments' tablosu politikaları (Sadece Kendi Randevuları)
CREATE POLICY "Users can read their own appointments" ON public.appointments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" ON public.appointments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments" ON public.appointments
    FOR DELETE USING (auth.uid() = user_id);

-- 5. ADIM: 'services' tablosu politikaları (Sadece Kendi Hizmetleri)
CREATE POLICY "Users can read their own services" ON public.services
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own services" ON public.services
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services" ON public.services
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services" ON public.services
    FOR DELETE USING (auth.uid() = user_id);

-- 6. ADIM: 'inventory' tablosu politikaları (Sadece Kendi Envanteri)
CREATE POLICY "Users can read their own inventory" ON public.inventory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory" ON public.inventory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory" ON public.inventory
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory" ON public.inventory
    FOR DELETE USING (auth.uid() = user_id);

-- 7. ADIM: 'stock_definitions' tablosu politikaları
CREATE POLICY "Users can read their own stock_definitions" ON public.stock_definitions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock_definitions" ON public.stock_definitions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock_definitions" ON public.stock_definitions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock_definitions" ON public.stock_definitions
    FOR DELETE USING (auth.uid() = user_id);

-- 8. ADIM: 'profiles' (Admin Profilleri) tablosu politikaları (Sadece Kendi Profilini)
-- Not: users tablosunda id sütunu kullanılır
CREATE POLICY "Users can read their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
