-- =====================================================
-- Plan Atama Sorunu Düzeltmesi
-- Supabase Dashboard > SQL Editor'da çalıştırın
-- =====================================================

-- ADIM 1: plan sütununun default değerini 'starter' yap
-- (Eğer sütun yoksa hata verir, bu durumda bu adımı atlayın)
ALTER TABLE profiles ALTER COLUMN plan SET DEFAULT 'starter';

-- ADIM 2: Mevcut trigger fonksiyonunu güncelle
-- Artık raw_user_meta_data'dan plan, billing_cycle, email değerlerini okuyor
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    clinic_name,
    email,
    role,
    is_approved,
    plan,
    payment_status,
    billing_cycle
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'clinic_name', new.raw_user_meta_data->>'full_name', 'Klinik'),
    new.email,
    'user',
    false,
    COALESCE(new.raw_user_meta_data->>'plan', 'starter'),
    COALESCE(new.raw_user_meta_data->>'payment_status', 'pending'),
    COALESCE(new.raw_user_meta_data->>'billing_cycle', 'monthly')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ADIM 3: Trigger'ın doğru bağlı olduğundan emin ol
-- (Zaten varsa hata vermez, yoksa oluşturur)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ADIM 4: "Nail Yeni" kullanıcısının planını düzelt
-- (a@abc.com email'li kullanıcıyı starter'a çevir)
UPDATE profiles 
SET plan = 'starter' 
WHERE email = 'a@abc.com';

-- ADIM 5: Doğrulama - güncel durumu kontrol et
SELECT id, clinic_name, email, plan, payment_status, billing_cycle, is_approved
FROM profiles 
WHERE email = 'a@abc.com';
