-- =====================================================
-- 🔴 YENİ KULLANICI KAYIT HATASI ÇÖZÜMÜ
-- =====================================================
-- Bu script'i Supabase Dashboard -> SQL Editor alanına yapıştırıp çalıştırın.
-- Eski/hatalı tetikleyiciyi güncel şemaya (clinic_name) uygun olarak düzeltir.

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

-- Trigger bağlantısının çalıştığından emin olmak için
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
