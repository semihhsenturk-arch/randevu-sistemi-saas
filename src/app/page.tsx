"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  CalendarDays, 
  ShieldCheck, 
  BarChart3, 
  Zap, 
  Smartphone, 
  CheckCircle2, 
  ArrowRight,
  Database,
  Brain,
  Menu,
  X as CloseIcon
} from "lucide-react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const promoImages = ["/promo-1.png", "/promo-2.png", "/promo-3.png"];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % promoImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navbar */}
      <nav className="fixed top-4 md:top-6 w-full z-[1000] px-4 md:px-6">
        <div className="max-w-7xl mx-auto h-20 md:h-24 bg-white/90 backdrop-blur-xl border border-[#0a3d34]/15 rounded-[24px] md:rounded-[32px] px-6 md:px-10 flex items-center justify-between shadow-2xl shadow-[#0a3d34]/5 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#0a3d34] rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl shadow-[#0a3d34]/20">
              <CalendarDays className="text-white w-6 h-6 md:w-7 md:h-7" />
            </div>
            <span className="font-black text-xl md:text-2xl tracking-tighter text-[#0a3d34]">BiCalendar</span>
          </div>
          
          <div className="flex-1 flex justify-end md:justify-center">
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-12 text-lg font-bold text-slate-600">
              <a href="#ozellikler" className="hover:text-[#0a3d34] transition-colors relative group">
                Özellikler
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0a3d34] transition-all group-hover:w-full" />
              </a>
              <a href="#fiyatlandirma" className="hover:text-[#0a3d34] transition-colors relative group">
                Paketler
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0a3d34] transition-all group-hover:w-full" />
              </a>
              <Link href="/login" className="text-lg font-black text-[#0a3d34] hover:text-[#072b25] transition-colors px-2">
                Giriş Yap
              </Link>
              <Link href="/register">
                <Button className="bg-[#0a3d34] hover:bg-[#072b25] text-white px-8 py-6 rounded-full font-black text-lg shadow-2xl shadow-[#0a3d34]/25 hover:-translate-y-1 transition-all active:scale-95">
                  Hemen Başla
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-[#0a3d34]" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <CloseIcon className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-28 left-4 right-4 bg-white border border-slate-100 rounded-3xl shadow-2xl p-8 flex flex-col gap-6 z-[1001] animate-in fade-in slide-in-from-top-4 duration-300">
            <a href="#ozellikler" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-slate-900 border-b border-slate-50 pb-4">Özellikler</a>
            <a href="#fiyatlandirma" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-slate-900 border-b border-slate-50 pb-4">Paketler</a>
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-black text-[#0a3d34]">Giriş Yap</Link>
            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full bg-[#0a3d34] py-8 rounded-2xl text-xl font-black shadow-xl shadow-[#0a3d34]/20">Hemen Başla</Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 md:pt-40 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 md:gap-16">
          <div className="flex-1 text-center lg:text-left space-y-6 md:space-y-8">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider">
              <Zap className="w-4 h-4 fill-current" />
              Klinik Yönetiminde Yeni Nesil Dönem
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              Klinik İşlerinizi <span className="text-[#0a3d34]">Otomatiğe</span> Alın.
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Randevu takibi, hasta kayıtları, stok yönetimi ve analizler. Hepsi tek bir platformda, her yerden erişilebilir.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link href="/register" className="w-full sm:w-auto">
                <Button className="w-full bg-[#0a3d34] hover:bg-[#072b25] text-white px-8 py-7 rounded-2xl text-lg font-bold shadow-2xl shadow-[#0a3d34]/20 hover:-translate-y-1 transition-all group">
                  Hemen Başla
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <div className="text-base font-medium text-slate-500 italic">
                7 Gün Ücretsiz Deneyin
              </div>
            </div>
          </div>

          <div className="flex-1 relative w-full max-w-2xl lg:max-w-none">
            <div className="absolute -top-10 -right-10 md:-top-20 md:-right-20 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-emerald-100/50 rounded-full blur-3xl -z-1" />
            <div className="relative bg-white border border-slate-100 rounded-[24px] md:rounded-[32px] p-2 shadow-2xl shadow-slate-200/60 overflow-hidden">
              <div className="relative aspect-square w-full overflow-hidden rounded-[20px] md:rounded-[28px]">
                {promoImages.map((src, index) => (
                  <div 
                    key={src}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      index === currentImageIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                    }`}
                  >
                    <Image 
                      src={src} 
                      alt={`Promo ${index + 1}`} 
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="ozellikler" className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Klinik Yönetiminde İhtiyacınız Olan Her Şey</h2>
            <p className="text-slate-500 text-base md:text-lg">Karmaşık süreçleri basitleştirin, sadece hastalarınıza odaklanın.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                icon: CalendarDays,
                title: "Akıllı Randevu Takvimi",
                desc: "Sürükle bırak özelliği ile randevularınızı saniyeler içinde organize edin. Çatışmaları otomatik önleyin."
              },
              {
                icon: Database,
                title: "Google Sheets Senkronu",
                desc: "Mevcut verilerinizi Google Sheets üzerinden anlık senkronize edin. Excel'den kurtulun."
              },
              {
                icon: BarChart3,
                title: "Detaylı Analizler",
                desc: "Gelir-gider dengesini, klinik doluluk oranlarını ve popüler hizmetlerin analizini anlık izleyin."
              },
              {
                icon: ShieldCheck,
                title: "KVKK Uyumu & Güvenlik",
                desc: "Hasta verilerini en yüksek güvenlik standartlarında, KVKK uyumlu bir şekilde saklayın."
              },
              {
                icon: Smartphone,
                title: "Mobil Uyumluluk",
                desc: "Klinik durumunuzu cebinizden takip edin. Nerede olursanız olun kontrol sizde."
              },
              {
                icon: CheckCircle2,
                title: "Stok Yönetimi",
                desc: "Kritik seviyeye inen tıbbi malzemelerden anında haberdar olun, maliyetleri kontrol edin."
              },
              {
                icon: Brain,
                title: "AI Destekli Hatırlatma",
                desc: "Randevu kaçırma (no-show) oranlarını AI destekli otomatik hatırlatmalar ile %40'a kadar düşürün."
              }
            ].map((f, i) => (
              <div key={i} className="bg-white px-5 py-5 rounded-[20px] border border-slate-100 hover:border-emerald-200 shadow-sm hover:shadow-lg hover:shadow-emerald-500/5 transition-all group">
                <div className="w-10 h-10 bg-slate-50 text-[#0a3d34] rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold mb-1.5">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="fiyatlandirma" className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Paketler</h2>
            <p className="text-slate-500 text-base md:text-lg">İhtiyacınıza en uygun paketi seçin, işinizi büyütmeye odaklanın.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Starter Paket */}
            <div className="flex flex-col h-full bg-white rounded-[40px] border-2 border-slate-100 px-7 py-6 hover:border-emerald-200 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
              <div className="space-y-3 flex-1">
                <div className="text-center">
                  <h3 className="text-xl font-extrabold mb-1 text-slate-900">Starter</h3>
                  <p className="text-slate-500 text-sm h-8">Bireysel hekimler ve yeni başlayan klinikler için.</p>
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black">999 ₺</span>
                  <span className="text-slate-400 font-bold text-sm">/ Ay</span>
                </div>
                <div className="py-4 border-t border-slate-100 flex flex-col gap-2.5">
                  {[
                    "Randevu Takvimi",
                    "E-posta & WhatsApp Desteği",
                    "KVKK Uyumu",
                    "Ömür Boyu Güncellemeler"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-[15px] font-semibold text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                  {[
                    "Hasta Listesi & Kayıt Yönetimi",
                    "Stok Yönetimi",
                    "Detaylı Analiz & Raporlama"
                  ].map((item, i) => (
                    <div key={i + 10} className="flex items-start gap-3 text-[15px] font-semibold text-slate-400">
                      <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/register?plan=starter" className="block mt-auto pt-4">
                <Button className="w-full py-4 rounded-2xl text-base font-bold border-2 border-slate-200 bg-white text-slate-900 hover:bg-[#0a3d34] hover:text-white hover:border-[#0a3d34] transition-all duration-300">
                  Hemen Başla
                </Button>
              </Link>
            </div>

            {/* Professional Paket */}
            <div className="flex flex-col h-full bg-white rounded-[40px] border-2 border-[#0a3d34]/10 px-7 py-6 hover:border-[#0a3d34]/40 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
              <div className="space-y-3 flex-1">
                <div className="text-center">
                  <h3 className="text-xl font-extrabold mb-1 text-slate-900">Professional</h3>
                  <p className="text-slate-500 text-sm h-8">Hasta takibi gerektiren büyüyen klinikler için.</p>
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black">1.999 ₺</span>
                  <span className="text-slate-400 font-bold text-sm">/ Ay</span>
                </div>
                <div className="py-4 border-t border-slate-100 flex flex-col gap-2.5">
                  {[
                    "Randevu Takvimi",
                    "E-posta & WhatsApp Desteği",
                    "KVKK Uyumu",
                    "Ömür Boyu Güncellemeler",
                    "Hasta Listesi & Kayıt Yönetimi"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-[15px] font-semibold text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                  {[
                    "Stok Yönetimi",
                    "Detaylı Analiz & Raporlama"
                  ].map((item, i) => (
                    <div key={i + 10} className="flex items-start gap-3 text-[15px] font-semibold text-slate-400">
                      <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/register?plan=professional" className="block mt-auto pt-4">
                <Button className="w-full py-4 rounded-2xl text-base font-bold border-2 border-[#0a3d34] bg-white text-[#0a3d34] hover:bg-[#0a3d34] hover:text-white transition-all duration-300">
                  Hemen Başla
                </Button>
              </Link>
            </div>

            {/* Advanced Paket */}
            <div className="flex flex-col h-full bg-[#0a3d34] rounded-[40px] border-2 border-[#0a3d34] px-7 py-6 shadow-2xl shadow-[#0a3d34]/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white px-6 py-1.5 rounded-bl-2xl font-bold text-xs uppercase tracking-wider">
                TAM PAKET
              </div>
              <div className="space-y-3 flex-1 text-white">
                <div className="text-center">
                  <h3 className="text-xl font-extrabold mb-1">Advanced</h3>
                  <p className="text-[#94a3b8] text-sm h-8">Tüm özelliklere ihtiyaç duyan profesyonel klinikler için.</p>
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black">2.999 ₺</span>
                  <span className="text-[#94a3b8] font-bold text-sm">/ Ay</span>
                </div>
                <div className="py-4 border-t border-white/10 flex flex-col gap-2.5">
                  {[
                    "Randevu Takvimi",
                    "E-posta & WhatsApp Desteği",
                    "KVKK Uyumu",
                    "Ömür Boyu Güncellemeler",
                    "Hasta Listesi & Kayıt Yönetimi",
                    "Stok Yönetimi",
                    "Detaylı Analiz & Raporlama",
                    "Google Sheets Senkronizasyonu"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-[15px] font-semibold text-white">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/register?plan=advanced" className="block mt-auto pt-4">
                <Button className="w-full bg-white border-2 border-white hover:bg-emerald-50 text-[#0a3d34] py-4 rounded-2xl text-base font-bold shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                  Hemen Başla
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-slate-800 pb-20">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <CalendarDays className="text-white w-5 h-5" />
                </div>
                <span className="font-extrabold text-xl tracking-tight text-white">BiCalendar</span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed">Modern kliniklerin iş akışını dijitalleştiren ve hasta deneyimini iyileştiren bulut tabanlı bir yönetim sistemi.</p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-white font-semibold uppercase tracking-widest text-xs">Bağlantılar</h4>
            <div className="flex flex-col gap-2.5 text-sm">
                <a href="#ozellikler" className="hover:text-emerald-400 transition-colors">Özellikler</a>
                <a href="#fiyatlandirma" className="hover:text-emerald-400 transition-colors">Paketler</a>
                <Link href="/login" className="hover:text-emerald-400 transition-colors">Giriş Yap</Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-semibold uppercase tracking-widest text-xs">Yasal</h4>
            <div className="flex flex-col gap-2.5 text-sm">
                <a href="#" className="hover:text-emerald-400 transition-colors">Gizlilik Sözleşmesi</a>
                <a href="#" className="hover:text-emerald-400 transition-colors">KVKK ve Güvenlik</a>
                <a href="#" className="hover:text-emerald-400 transition-colors">Kullanım Şartları</a>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-10 text-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 BiCalendar | Klinik Yönetim Sistemi. Tüm hakları saklıdır.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>

      {/* WhatsApp Button */}
      <WhatsAppButton />
    </div>
  );
}
