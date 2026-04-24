-- Supabase Profiles tablosuna yeni alanlar ekle
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- Email sütunu
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Ödeme durumu (pending = ödeme yapılmadı, paid = ödeme yapıldı)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';

-- Fatura dönemi (monthly = aylık, yearly = yıllık)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly';

-- Mevcut kullanıcıları "paid" olarak işaretle (eski kullanıcılar etkilenmesin)
UPDATE profiles SET payment_status = 'paid' WHERE payment_status IS NULL OR payment_status = '';

-- Admin kullanıcıları her zaman "paid" olsun
UPDATE profiles SET payment_status = 'paid' WHERE role = 'admin';

-- RLS politikası: Kullanıcılar kendi profillerini güncelleyebilsin
-- (Zaten varsa bu adımı atlayın)
-- CREATE POLICY "Users can update own profile" ON profiles
--   FOR UPDATE USING (auth.uid() = id);
