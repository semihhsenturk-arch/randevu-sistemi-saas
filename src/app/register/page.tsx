"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PLAN_PRICES, PlanType, BillingCycle } from "@/lib/iyzico-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, ArrowLeft, ArrowRight, Zap, ShieldCheck, Star, CheckCircle2 } from "lucide-react";

const PLAN_FEATURES: Record<PlanType, { included: string[]; excluded: string[]; icon: any; desc: string }> = {
  starter: {
    included: ["Randevu Takvimi", "E-posta & WhatsApp Desteği", "KVKK Uyumu", "Ömür Boyu Güncellemeler"],
    excluded: ["Hasta Listesi & Kayıt Yönetimi", "Stok Yönetimi", "Detaylı Analiz & Raporlama"],
    icon: Zap,
    desc: "Bireysel hekimler ve yeni başlayan klinikler için.",
  },
  professional: {
    included: ["Randevu Takvimi", "E-posta & WhatsApp Desteği", "KVKK Uyumu", "Ömür Boyu Güncellemeler", "Hasta Listesi & Kayıt Yönetimi"],
    excluded: ["Stok Yönetimi", "Detaylı Analiz & Raporlama"],
    icon: ShieldCheck,
    desc: "Hasta takibi gerektiren büyüyen klinikler için.",
  },
  advanced: {
    included: ["Randevu Takvimi", "E-posta & WhatsApp Desteği", "KVKK Uyumu", "Ömür Boyu Güncellemeler", "Hasta Listesi & Kayıt Yönetimi", "Stok Yönetimi", "Detaylı Analiz & Raporlama", "Google Sheets Senkronizasyonu"],
    excluded: [],
    icon: Star,
    desc: "Tüm özelliklere ihtiyaç duyan profesyonel klinikler için.",
  },
};

function RegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Step 1: Bilgiler, Step 2: Paket Seçimi
  const [step, setStep] = useState(1);

  // Form state
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("starter");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  // UI state
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // URL'den paket parametresini oku
  useEffect(() => {
    const planParam = searchParams.get("plan");
    if (planParam && (planParam === "starter" || planParam === "professional" || planParam === "advanced")) {
      setSelectedPlan(planParam);
    }
  }, [searchParams]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName.trim() || !email.trim() || !password.trim()) {
      setErrorMsg("Lütfen tüm alanları doldurunuz.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    setErrorMsg("");
    setStep(2);
  };

  const handleRegister = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: clinicName,
          clinic_name: clinicName,
          plan: selectedPlan,
          payment_status: "pending",
          billing_cycle: billingCycle,
        },
      },
    });

    if (error) {
      setErrorMsg("Hata: " + (error.message || "Kayıt sırasında bir problem oluştu."));
      setLoading(false);
      return;
    }

    // Profili sunucu tarafında güncelle (service_role key ile RLS bypass)
    // Bu, auth trigger'ın plan değerini üzerine yazmasını engeller
    if (data?.user?.id) {
      try {
        const res = await fetch("/api/auth/set-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: data.user.id,
            plan: selectedPlan,
            billingCycle: billingCycle,
            email: email,
          }),
        });

        const result = await res.json();
        if (!res.ok) {
          console.error("set-plan API error:", result.error);
          // API başarısız olsa bile kayıt işlemi devam etsin
        } else {
          console.log("Plan successfully set via API:", result);
        }
      } catch (apiErr) {
        console.error("set-plan API call failed:", apiErr);
        // API çağrısı başarısız olsa bile kayıt devam etsin
      }
    }

    // Çıkış yapalım ki otomatik login olup sisteme düşmesin
    await supabase.auth.signOut().catch(() => {});
    setSuccess(true);
    setLoading(false);
  };

  const currentPrice = PLAN_PRICES[selectedPlan][billingCycle];
  const monthlyEquivalent = billingCycle === "yearly" 
    ? Math.round(currentPrice / 12) 
    : currentPrice;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative">
      <Link
        href="/"
        className="absolute top-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-700 transition-colors md:left-6 left-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Ana Sayfaya Dön
      </Link>

      {success ? (
        <Card className="w-full max-w-md shadow-lg border-emerald-100">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900">Kayıt Başarılı! 🎉</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-emerald-50 rounded-2xl p-4 space-y-2">
              <p className="text-sm font-bold text-emerald-800">Seçilen Paket</p>
              <p className="text-lg font-extrabold text-emerald-900">{PLAN_PRICES[selectedPlan].name}</p>
              <p className="text-sm text-emerald-700">
                {billingCycle === "monthly" ? "Aylık" : "Yıllık"} — {currentPrice.toLocaleString("tr-TR")} ₺
              </p>
            </div>
            <p className="text-sm text-slate-500">
              Hesabınız başarıyla oluşturuldu. Yönetici onayından sonra giriş yapıp ödemenizi tamamlayabilirsiniz.
            </p>
            <Button asChild className="w-full h-12 text-base font-bold bg-[#0a3d34] hover:bg-[#072b25]">
              <Link href="/login">Giriş Sayfasına Dön</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-2xl shadow-lg border-emerald-100">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900">Klinik Yönetim Sistemi</CardTitle>
            <CardDescription className="font-medium text-slate-500">
              {step === 1 ? "Klinik bilgilerinizi girin" : "Hizmet paketinizi seçin"}
            </CardDescription>

            {/* Stepper */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                step === 1 ? "bg-[#0a3d34] text-white" : "bg-emerald-100 text-emerald-700"
              }`}>
                {step > 1 ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px]">1</span>}
                Bilgiler
              </div>
              <div className="w-8 h-[2px] bg-slate-200 rounded-full" />
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                step === 2 ? "bg-[#0a3d34] text-white" : "bg-slate-100 text-slate-400"
              }`}>
                <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px]">2</span>
                Paket Seçimi
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {step === 1 ? (
              /* ADIM 1: Bilgiler */
              <form onSubmit={handleNextStep} className="space-y-4 max-w-md mx-auto">
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Klinik Adı / Ünvan</Label>
                  <Input
                    id="clinicName"
                    type="text"
                    placeholder="Uzm. Dr. ..."
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    required
                    className="h-12 focus-visible:ring-emerald-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta Adresi</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@klinik.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 focus-visible:ring-emerald-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 focus-visible:ring-emerald-700"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-base font-bold bg-[#0a3d34] hover:bg-[#072b25] group">
                  Devam Et
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            ) : (
              /* ADIM 2: Paket Seçimi */
              <div className="space-y-6">
                {/* Aylık / Yıllık Toggle */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                      billingCycle === "monthly"
                        ? "bg-[#0a3d34] text-white shadow-lg"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    Aylık
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("yearly")}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                      billingCycle === "yearly"
                        ? "bg-[#0a3d34] text-white shadow-lg"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    Yıllık
                    <span className="bg-emerald-400/30 text-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                      %20 İNDİRİM
                    </span>
                  </button>
                </div>

                {/* Paket Kartları */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(Object.keys(PLAN_PRICES) as PlanType[]).map((planKey) => {
                    const plan = PLAN_PRICES[planKey];
                    const features = PLAN_FEATURES[planKey];
                    const Icon = features.icon;
                    const isSelected = selectedPlan === planKey;
                    const price = plan[billingCycle];
                    const monthlyEq = billingCycle === "yearly" ? Math.round(price / 12) : price;

                    return (
                      <button
                        key={planKey}
                        type="button"
                        onClick={() => setSelectedPlan(planKey)}
                        className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-300 ${
                          isSelected
                            ? planKey === "advanced"
                              ? "border-[#0a3d34] bg-[#0a3d34] text-white shadow-xl shadow-[#0a3d34]/20 scale-[1.02]"
                              : "border-[#0a3d34] bg-emerald-50 shadow-xl shadow-emerald-500/10 scale-[1.02]"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                        }`}
                      >
                        {planKey === "advanced" && (
                          <div className="absolute -top-3 right-4 bg-emerald-500 text-white px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                            Tam Paket
                          </div>
                        )}

                        {/* Seçim indicator */}
                        <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? planKey === "advanced"
                              ? "border-emerald-400 bg-emerald-400"
                              : "border-[#0a3d34] bg-[#0a3d34]"
                            : "border-slate-300"
                        }`}>
                          {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-4 h-4 ${
                            isSelected && planKey === "advanced" ? "text-emerald-400" :
                            planKey === "starter" ? "text-amber-500" :
                            planKey === "professional" ? "text-emerald-500" : "text-purple-500"
                          }`} />
                          <h3 className={`text-sm font-extrabold ${
                            isSelected && planKey === "advanced" ? "text-white" : "text-slate-900"
                          }`}>
                            {plan.name}
                          </h3>
                        </div>

                        <p className={`text-xs mb-3 ${
                          isSelected && planKey === "advanced" ? "text-slate-300" : "text-slate-500"
                        }`}>
                          {features.desc}
                        </p>

                        <div className="flex items-baseline gap-1 mb-3">
                          <span className={`text-2xl font-black ${
                            isSelected && planKey === "advanced" ? "text-white" : "text-slate-900"
                          }`}>
                            {monthlyEq.toLocaleString("tr-TR")} ₺
                          </span>
                          <span className={`text-xs font-bold ${
                            isSelected && planKey === "advanced" ? "text-slate-400" : "text-slate-400"
                          }`}>
                            / ay
                          </span>
                        </div>

                        {billingCycle === "yearly" && (
                          <p className={`text-[10px] font-bold mb-3 ${
                            isSelected && planKey === "advanced" ? "text-emerald-400" : "text-emerald-600"
                          }`}>
                            Yıllık toplam: {price.toLocaleString("tr-TR")} ₺
                          </p>
                        )}

                        <div className="space-y-1.5">
                          {features.included.slice(0, 4).map((f, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected && planKey === "advanced" ? "text-emerald-400" : "text-emerald-500"
                              }`} />
                              <span className={`text-[11px] font-semibold ${
                                isSelected && planKey === "advanced" ? "text-white/90" : "text-slate-700"
                              }`}>
                                {f}
                              </span>
                            </div>
                          ))}
                          {features.included.length > 4 && (
                            <p className={`text-[10px] font-bold pl-5 ${
                              isSelected && planKey === "advanced" ? "text-emerald-400" : "text-emerald-600"
                            }`}>
                              +{features.included.length - 4} özellik daha
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Alt Butonlar */}
                  <div className="space-y-6">
                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 transition-all hover:border-emerald-200 group">
                      <div className="relative flex items-center h-5">
                        <input
                          id="legal-agree"
                          type="checkbox"
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-[#0a3d34] focus:ring-[#0a3d34] transition-all cursor-pointer"
                        />
                      </div>
                      <label htmlFor="legal-agree" className="text-[11px] leading-relaxed text-slate-600 cursor-pointer select-none">
                        <Link href="/legal/kullanim-sartlari" className="text-[#0a3d34] font-bold hover:underline" target="_blank">Kullanım Şartlarını</Link>,{" "}
                        <Link href="/legal/gizlilik-sozlesmesi" className="text-[#0a3d34] font-bold hover:underline" target="_blank">Gizlilik Sözleşmesini</Link> ve{" "}
                        <Link href="/legal/kvkk" className="text-[#0a3d34] font-bold hover:underline" target="_blank">KVKK Aydınlatma Metnini</Link> okudum, özel nitelikli verilerimin yurtdışı sunucularında işlenmesini ve aktarılmasını kabul ediyorum.
                      </label>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setStep(1); setErrorMsg(""); }}
                        className="h-12 px-6 font-bold w-full sm:w-auto order-2 sm:order-1"
                      >
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Geri
                      </Button>
                      <Button
                        type="button"
                        disabled={loading || !agreed}
                        onClick={handleRegister}
                        className={`flex-1 h-12 text-base font-bold order-1 sm:order-2 transition-all ${
                          agreed 
                            ? "bg-[#0a3d34] hover:bg-[#072b25] text-white" 
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {loading ? "Hesap Oluşturuluyor..." : "Kayıt Ol"}
                      </Button>
                    </div>
                  </div>
              </div>
            )}
          </CardContent>

          {step === 1 && (
            <CardFooter className="flex justify-center border-t py-6 bg-slate-50/50 rounded-b-xl border-emerald-50">
              <p className="text-sm text-slate-500">
                Zaten hesabınız var mı?{" "}
                <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline">
                  Giriş Yapın
                </Link>
              </p>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}

import { Suspense } from "react";
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">Yükleniyor...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
