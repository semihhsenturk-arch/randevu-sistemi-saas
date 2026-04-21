# Randevu / Takvim Sistemi

## Genel Bakis
Kucuk isletmeler icin haftalik takvim gorunumlu randevu sistemi. Slota tiklayarak randevu olusturma, hizmet secimi, durum yonetimi ve localStorage ile kalicilik. API gerektirmez.

## Teknik Gereksinimler
- **Tek dosya:** `index.html` (inline CSS + JS)
- **Font:** DM Sans (Google Fonts)
- **Tema:** Koyu (#0a0a0a arka plan), aksent renk #8b5cf6 (mor)
- **Dil:** Turkce
- **Framework:** Yok — vanilla HTML/CSS/JS
- **Veri:** localStorage ile kalici

## Sayfa Yapisi

### Header
- Sol: "Randevu Sistemi" baslik + bugunun tarihi (ornek: "27 Mart 2026, Cuma")
- Orta: Hafta navigasyonu — "<" onceki hafta | "Bu Hafta: 23-29 Mart 2026" | sonraki hafta ">"
- Sag: "Yeni Randevu" butonu (#8b5cf6)

### Istatistik Kartlari (4 kart, tek satir)
1. **Bugunun Randevulari** — sayi (ornek: 8)
2. **Bu Haftaki** — sayi (ornek: 34)
3. **Onaylanan** — sayi + yuzde (ornek: 28 / %82)
4. **Bugunun Geliri** — tutar (ornek: 3.250 TL)

Her kart: #141414 arka plan, mor aksent sol border

### Ana Layout (2 sutun)

#### Sol: Haftalik Takvim (%75 genislik)
- 7 gun sutunu (Pazartesi-Pazar), her sutunun ustunde gun adi + tarih
- Bugunun sutunu vurgulu (hafif mor arka plan #8b5cf610)
- Dikey: 09:00 - 18:00 arasi, 30 dakikalik slotlar (18 slot/gun)
- Her slot 50px yukseklik, border-bottom #1a1a1a
- Bos slot hover'da hafif mor overlay, tiklanabilir (cursor pointer)

**Randevu Gosterimi:**
- Dolmus slotlar renk kodlu kart olarak gorulur
- Kart icinde: saat, musteri adi, hizmet adi
- 30dk randevu: 1 slot yukseklik
- 60dk randevu: 2 slot yukseklik (Cilt Bakimi, Masaj)
- Durum renkleri:
  - Onaylandi: #10b981 (yesil) sol border + hafif yesil arka plan
  - Beklemede: #f59e0b (amber) sol border + hafif amber arka plan
  - Iptal Edildi: #ef4444 (kirmizi) sol border + hafif kirmizi arka plan, ustu cizili yazi

**Randevu Kartina Tiklama:**
Tiklandiginda detay popup'i acilir:
- Musteri bilgileri (ad, telefon)
- Hizmet ve ucret
- Notlar
- Durum degistirme butonlari: "Onayla" / "Iptal Et"
- "Sil" butonu

#### Sag: Bugunun Listesi (%25 genislik)
Baslik: "Bugunun Programi"
Dikey liste, kronolojik sira:
- Her satir: saat (sol, bold), musteri adi + hizmet (sag)
- Durum noktasi (renkli daire, 8px)
- Gecmis saatler soluk (opacity 0.5)
- Simdiki/sonraki randevu vurgulu (mor sol border)
- Listenin altinda:
  - "Bos Slot: 4" bilgisi
  - "Tahmini Gelir: 4.750 TL"

### Hizmetler
```javascript
const hizmetler = [
  { id: 1, ad: 'Sac Kesimi', sure: 30, fiyat: 250, renk: '#3b82f6' },
  { id: 2, ad: 'Sakal Tirasi', sure: 30, fiyat: 150, renk: '#10b981' },
  { id: 3, ad: 'Cilt Bakimi', sure: 60, fiyat: 400, renk: '#f59e0b' },
  { id: 4, ad: 'Masaj', sure: 60, fiyat: 500, renk: '#8b5cf6' },
  { id: 5, ad: 'Konsultasyon', sure: 30, fiyat: 100, renk: '#6b7280' }
];
```

### Yeni Randevu Modal
Bos slota tiklandiginda veya "Yeni Randevu" butonuyla:
- **Musteri Adi:** text input (zorunlu)
- **Telefon:** tel input, +90 prefix (zorunlu)
- **Hizmet:** dropdown (hizmet listesinden, fiyat yaninda gorulur)
- **Tarih:** date picker (slot tiklandiysa otomatik dolu)
- **Saat:** time picker (slot tiklandiysa otomatik dolu, 30dk araliklar: 09:00, 09:30, ... 17:30)
- **Notlar:** textarea (opsiyonel)
- **Durum:** radio — Onaylandi (varsayilan) / Beklemede
- "Kaydet" ve "Iptal" butonlari
- Kaydettiginde:
  - localStorage'a yaz
  - Takvimi guncelle
  - Basari toast mesaji

### Cakisma Kontrolu
Ayni gun + ayni saatte zaten randevu varsa:
- Kaydetmeye calistiginda uyari goster: "Bu saat diliminde zaten bir randevu var!"
- Formu kapatma, kullanici saati degistirebilsin

### On Yuklu Randevular (10+ kayit)
Bugunun tarihine ve bu haftaya yayilmis:

```
Bugun (ornek: Persembe):
09:00 - Mehmet Ozturk - Sac Kesimi - Onaylandi
09:30 - (bos)
10:00 - Ayse Demir - Cilt Bakimi (60dk) - Onaylandi
10:30 - (Ayse devam)
11:00 - Can Yilmaz - Sakal Tirasi - Beklemede
11:30 - Elif Kara - Sac Kesimi - Onaylandi
12:00-13:00 - (oglen arasi, gri)
13:00 - Fatma Celik - Masaj (60dk) - Onaylandi
13:30 - (Fatma devam)
14:00 - Burak Sahin - Konsultasyon - Iptal Edildi
14:30 - Selin Arslan - Sac Kesimi - Beklemede
15:00 - (bos)
15:30 - Hakan Korkmaz - Sakal Tirasi - Onaylandi

Diger gunler (3-4 ek randevu):
Pazartesi 10:00 - Deniz Yildiz - Cilt Bakimi - Onaylandi
Sali 14:00 - Omer Gunes - Sac Kesimi - Onaylandi
Carsamba 11:00 - Zehra Aksoy - Masaj - Beklemede
Cuma 09:30 - Ali Dogan - Konsultasyon - Onaylandi
Cuma 16:00 - Nergis Tekin - Sac Kesimi - Onaylandi
```

Not: Randevular dinamik olarak bugunun gercek tarihine gore olusturulacak.

### localStorage Yapisi
```javascript
// Anahtar: 'randevular'
// Deger: JSON array
[
  {
    id: 'uuid',
    musteriAdi: 'Mehmet Ozturk',
    telefon: '+905551234567',
    hizmetId: 1,
    tarih: '2026-03-27',
    saat: '09:00',
    durum: 'onaylandi', // 'onaylandi' | 'beklemede' | 'iptal'
    notlar: '',
    olusturma: '2026-03-25T10:30:00'
  }
]
```

Sayfa ilk acilisinda:
1. localStorage'da veri var mi kontrol et
2. Yoksa on yuklu verileri yaz
3. Varsa mevcut verileri kullan

### Ek Ozellikler
- Randevu kartlarini surukle-birak ile saatler arasi tasima (opsiyonel, bonus)
- Ctrl+Z ile son silme/degisikligi geri alma
- Hafta degistirme animasyonu (slide)

## Stil Detaylari
```
Arka plan: #0a0a0a
Kart arka plan: #141414
Takvim hucre: #111111
Takvim border: #1a1a1a
Bugun vurgu: #8b5cf610
Aksent: #8b5cf6
Aksent hover: #a78bfa
Onaylandi: #10b981 border, #10b98115 arka plan
Beklemede: #f59e0b border, #f59e0b15 arka plan
Iptal: #ef4444 border, #ef444415 arka plan
Yazi: #e5e5e5
Ikincil yazi: #888888
Slot hover: #8b5cf610
```

## Responsive
- 1024px+: 2 sutun layout (takvim + sidebar)
- 768px-: Tek sutun, bugunun listesi uste cik, takvim yatay scroll
