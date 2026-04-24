"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { PLAN_PRICES, PlanType, BillingCycle } from "@/lib/iyzico-config";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, CreditCard, Loader2, AlertCircle, ArrowRight, Shield, Zap, ShieldCheck, Star, Sparkles } from "lucide-react";

export default function OdemePage() {
  const { profile, user, isLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkoutHTML, setCheckoutHTML] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkoutRef = useRef<HTMLDivElement>(null);

  // URL params'dan callback durumu kontrol
  const callbackStatus = searchParams.get("status");
  const callbackMessage = searchParams.get("message");

  // Ödeme başarılıysa profili yenile ve yönlendir

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let safetyTimer: NodeJS.Timeout;
    
    if (callbackStatus === "success") {
      const handleSuccess = async () => {
        try {
          // Profil güncellemesini getir
          await refreshProfile();
          
          // Profil güncellendikten kısa bir süre sonra yönlendir
          timer = setTimeout(() => {
            console.log("Redirecting to /takvim...");
            router.replace("/takvim");
            router.refresh();
          }, 2000);
        } catch (err) {
          console.error("Success handling error:", err);
          router.replace("/takvim");
        }
      };
      
      handleSuccess();

      // Güvenlik zamanlayıcısı: 5 saniye sonra ne olursa olsun yönlendir
      safetyTimer = setTimeout(() => {
        router.replace("/takvim");
      }, 5000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, [callbackStatus, router, refreshProfile]);

  // Zaten ödeme yaptıysa dashboard'a yönlendir
  useEffect(() => {
    if (!isLoading && profile) {
      if (profile.payment_status === "paid" && !callbackStatus) {
        router.replace("/takvim");
      }
      if (profile.role === "admin") {
        router.replace("/takvim");
      }
    }
  }, [profile, isLoading, router, callbackStatus]);

  const initializePayment = async () => {
    if (!user || !profile) return;
    setLoadingPayment(true);
    setError(null);

    try {
      const res = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: profile.email || user.email,
          clinicName: profile.clinic_name,
          plan: profile.plan || "starter",
          billingCycle: profile.billing_cycle || "monthly",
        }),
      });

      const data = await res.json();

      if (res.ok && data.checkoutFormContent) {
        setCheckoutHTML(data.checkoutFormContent);
      } else {
        setError(data.error || "Ödeme formu yüklenemedi");
      }
    } catch (err) {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoadingPayment(false);
    }
  };

  // İyzico checkout formunu render et
  useEffect(() => {
    if (checkoutHTML && checkoutRef.current) {
      checkoutRef.current.innerHTML = checkoutHTML;
      // İyzico scriptlerini çalıştır
      const scripts = checkoutRef.current.querySelectorAll("script");
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) =>
          newScript.setAttribute(attr.name, attr.value)
        );
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, [checkoutHTML]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Başarı durumu
  if (callbackStatus === "success") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md shadow-2xl border-emerald-100">
          <CardContent className="text-center py-12 space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-30" />
              <div className="relative w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Ödeme Başarılı! 🎉</h2>
              <p className="text-slate-500">Hesabınız aktif edildi. Yönlendiriliyorsunuz...</p>
            </div>
            <div className="pt-4">
              <Button 
                onClick={() => router.replace("/takvim")}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold"
              >
                Takvime Git
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Hata durumu
  if (callbackStatus === "error") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md shadow-2xl border-red-100">
          <CardContent className="text-center py-12 space-y-6">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Ödeme Başarısız</h2>
              <p className="text-slate-500">{callbackMessage || "Ödeme işlemi tamamlanamadı."}</p>
            </div>
            <Button
              onClick={() => {
                router.replace("/odeme");
                setCheckoutHTML(null);
                setError(null);
              }}
              className="bg-[#0a3d34] hover:bg-[#072b25] font-bold"
            >
              Tekrar Dene
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const plan = (profile?.plan || "starter") as PlanType;
  const cycle = (profile?.billing_cycle || "monthly") as BillingCycle;
  const planData = PLAN_PRICES[plan];
  const price = planData[cycle];
  const monthlyEq = cycle === "yearly" ? Math.round(price / 12) : price;

  const PlanIcon = plan === "starter" ? Zap : plan === "professional" ? ShieldCheck : Star;
  const planColor = plan === "starter" ? "text-amber-500" : plan === "professional" ? "text-emerald-500" : "text-purple-500";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      {/* Ödeme formu gösteriliyorsa */}
      {checkoutHTML ? (
        <div className="w-full max-w-2xl">
          <Card className="shadow-2xl border-emerald-100">
            <CardHeader className="text-center border-b border-slate-100 pb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Güvenli Ödeme</span>
              </div>
              <CardTitle className="text-lg font-extrabold text-slate-900">
                {planData.name} — {price.toLocaleString("tr-TR")} ₺
                <span className="text-sm font-bold text-slate-400 ml-1">
                  / {cycle === "monthly" ? "ay" : "yıl"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div ref={checkoutRef} id="iyzipay-checkout-form" />
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Ödeme başlatma ekranı */
        <Card className="w-full max-w-lg shadow-2xl border-emerald-100">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-[#0a3d34]" />
            </div>
            <div>
              <CardTitle className="text-2xl font-extrabold text-slate-900 mb-2">Ödeme Yapın</CardTitle>
              <p className="text-sm text-slate-500">
                Hesabınız onaylandı! Aşağıdaki paketiniz için ödeme yaparak tüm özelliklere erişim sağlayın.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Paket Özeti Kartı */}
            <div className="bg-gradient-to-br from-slate-50 to-emerald-50/50 rounded-2xl p-6 border border-emerald-100/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    plan === "advanced" ? "bg-purple-100" : plan === "professional" ? "bg-emerald-100" : "bg-amber-100"
                  }`}>
                    <PlanIcon className={`w-5 h-5 ${planColor}`} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900">{planData.name}</h3>
                    <p className="text-xs text-slate-500">{cycle === "monthly" ? "Aylık Abonelik" : "Yıllık Abonelik"}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-center">
                  <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                    <span className="text-[1.35rem] sm:text-2xl font-black text-slate-900">{monthlyEq.toLocaleString("tr-TR")} ₺</span>
                    <span className="text-xs sm:text-sm text-slate-400 font-bold">/ ay</span>
                  </div>
                </div>
              </div>

              {cycle === "yearly" && (
                <div className="bg-emerald-100 text-emerald-800 rounded-xl p-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold">
                    Yıllık ödeme: {price.toLocaleString("tr-TR")} ₺ (%20 indirim uygulandı)
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              onClick={initializePayment}
              disabled={loadingPayment}
              className="w-full h-14 text-base font-bold bg-[#0a3d34] hover:bg-[#072b25] shadow-xl shadow-[#0a3d34]/20 hover:-translate-y-0.5 transition-all group"
            >
              {loadingPayment ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Ödeme Formu Yükleniyor...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Ödemeye Geç
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>Ödemeleriniz 256-bit SSL şifreleme ve iyzico güvencesiyle korunmaktadır.</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
