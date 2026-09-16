-- =====================================================================
-- FAZ 1 GÜVENLİK DÜZELTMELERİ — Supabase SQL Editor'da Çalıştırın
-- Tarih: 16 Eylül 2026
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1.4: PROFILES TABLOSU — Hassas Sütun Koruma Trigger'ı
-- ─────────────────────────────────────────────────────────────────────
-- Problem: Kullanıcılar tarayıcı konsolundan kendi profillerinde
-- role, payment_status, plan, is_approved gibi alanları değiştirebilir.
-- Çözüm: Bu trigger, service_role dışındaki kullanıcıların bu alanları
-- değiştirmesini engeller.
-- ─────────────────────────────────────────────────────────────────────

-- Önce varsa eski trigger'ı temizle
DROP TRIGGER IF EXISTS protect_profile_fields ON public.profiles;
DROP FUNCTION IF EXISTS prevent_sensitive_field_change();

CREATE OR REPLACE FUNCTION prevent_sensitive_field_change()
RETURNS TRIGGER AS $$
BEGIN
  -- role değişikliği engelle
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot change role field directly';
  END IF;

  -- payment_status değişikliği engelle
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    RAISE EXCEPTION 'Cannot change payment_status field directly';
  END IF;

  -- plan değişikliği engelle
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    RAISE EXCEPTION 'Cannot change plan field directly';
  END IF;

  -- is_approved değişikliği engelle
  IF NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
    RAISE EXCEPTION 'Cannot change is_approved field directly';
  END IF;

  -- billing_cycle değişikliği engelle
  IF NEW.billing_cycle IS DISTINCT FROM OLD.billing_cycle THEN
    RAISE EXCEPTION 'Cannot change billing_cycle field directly';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sadece anon ve authenticated rollerinde çalışır,
-- service_role ile yapılan güncellemeler (API route'lar) etkilenmez.
CREATE TRIGGER protect_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
WHEN (current_setting('request.jwt.claims', true)::json->>'role' != 'service_role')
EXECUTE FUNCTION prevent_sensitive_field_change();


-- ─────────────────────────────────────────────────────────────────────
-- 1.5: TÜM TABLOLARDA UPDATE WITH CHECK EKLEMELERİ
-- ─────────────────────────────────────────────────────────────────────
-- Problem: UPDATE politikalarında WITH CHECK olmadığı için kullanıcı
-- güncelleme sırasında user_id'yi başka bir kullanıcının ID'sine
-- değiştirebilir (tenant hijacking).
-- Çözüm: WITH CHECK (auth.uid() = user_id) ekliyoruz.
-- ─────────────────────────────────────────────────────────────────────

-- appointments tablosu
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
CREATE POLICY "Users can update their own appointments" ON public.appointments
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- patient_profiles tablosu
DROP POLICY IF EXISTS "Users can update their own patient_profiles" ON public.patient_profiles;
CREATE POLICY "Users can update their own patient_profiles" ON public.patient_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- consent_records tablosu
DROP POLICY IF EXISTS "Users can update their own consent_records" ON public.consent_records;
CREATE POLICY "Users can update their own consent_records" ON public.consent_records
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- inventory tablosu
DROP POLICY IF EXISTS "Users can update their own inventory" ON public.inventory;
CREATE POLICY "Users can update their own inventory" ON public.inventory
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- services tablosu
DROP POLICY IF EXISTS "Users can update their own services" ON public.services;
CREATE POLICY "Users can update their own services" ON public.services
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- stock_definitions tablosu
DROP POLICY IF EXISTS "Users can update their own stock_definitions" ON public.stock_definitions;
CREATE POLICY "Users can update their own stock_definitions" ON public.stock_definitions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- profiles tablosu (id = auth.uid() kullanır, user_id değil)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);


-- ─────────────────────────────────────────────────────────────────────
-- DOĞRULAMA SORGUSU — Trigger ve politikaların doğru çalıştığını test et
-- ─────────────────────────────────────────────────────────────────────
-- Aşağıdaki sorguyu çalıştırarak trigger'ın oluştuğunu doğrulayın:

-- SELECT tgname, tgrelid::regclass, tgenabled
-- FROM pg_trigger
-- WHERE tgname = 'protect_profile_fields';

-- Politikaları doğrulamak için:
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('appointments','patient_profiles','consent_records','inventory','services','stock_definitions','profiles')
--   AND cmd = 'UPDATE';
