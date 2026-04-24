# Supabase Trigger Düzeltmesi - Plan Atama Sorunu

## Sorun
Yeni kullanıcı kaydolduğunda, seçtiği paket (örn: "Starter") doğru şekilde kaydedilmiyor ve otomatik olarak "Advanced" olarak atanıyordu.

## Neden
Supabase'deki `handle_new_user` trigger fonksiyonu, yeni kullanıcı oluşturulduğunda `profiles` tablosuna satır ekliyor. Bu trigger, `plan` sütununa ya hardcoded bir değer atıyor ya da sütun default değeri `'advanced'` olarak ayarlanmış.

## Çözüm (2 Parça)

### Parça 1: Kod Düzeltmesi (✅ Yapıldı)
- Kayıt sırasında `service_role` key kullanan sunucu taraflı API endpoint oluşturuldu
- RLS bypass edilerek plan güvenilir şekilde yazılıyor
- Race condition ortadan kalktı

### Parça 2: Supabase SQL (⚠️ Çalıştırılmalı)
Aşağıdaki SQL'i **Supabase Dashboard > SQL Editor**'da çalıştırın.

Bu SQL:
1. `plan` sütununun default değerini `'starter'` olarak değiştirir
2. Trigger fonksiyonunu günceller — artık `raw_user_meta_data`'dan `plan` değerini okur
3. Mevcut "Nail Yeni" kullanıcısının planını `starter` olarak düzeltir
