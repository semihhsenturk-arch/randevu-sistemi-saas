"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { PLAN_PRICES, PlanType, BillingCycle } from "@/lib/iyzico-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Settings,
  CreditCard,
  Crown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  XCircle,
  Shield,
  Zap,
  ShieldCheck,
  Star,
  Mail,
  Building2,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

const PLANS: { key: PlanType; icon: any; color: string; bg: string; border: string; features: string[] }[] = [
  {
    key: "starter",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    features: ["Randevu Takvimi", "E-posta & WhatsApp Desteği", "KVKK Uyumu"],
  },
  {
    key: "professional",
    icon: ShieldCheck,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    features: ["Starter'daki her şey", "Hasta Listesi & Kayıt Yönetimi", "Dijital Onam Formu"],
  },
  {
    key: "advanced",
    icon: Star,
    color: "text-purple-500",
    bg: "bg-purple-50",
    border: "border-purple-200",
    features: ["Professional'daki her şey", "Stok Yönetimi", "Detaylı Analiz & Raporlama", "Google Sheets Senkronu"],
  },
];

export default function AyarlarPage() {
  const { user, profile, refreshProfile, isTrialActive } = useAuth();
  const router = useRouter();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState<"success" | "error" | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [changingPlan, setChangingPlan] = useState(false);

  if (!profile || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const plan = (profile.plan || "starter") as PlanType;
  const cycle = (profile.billing_cycle || "monthly") as BillingCycle;
  const planData = PLAN_PRICES[plan];
  const price = planData[cycle];
  const isCancelled = profile.payment_status === "cancelled";
  const isPaid = profile.payment_status === "paid";
  const isDemo = typeof window !== "undefined" && localStorage.getItem("demo_mode") === "true";

  const PlanIcon = plan === "starter" ? Zap : plan === "professional" ? ShieldCheck : Star;
  const planColorClass =
    plan === "starter"
      ? "text-amber-500 bg-amber-50 border-amber-200"
      : plan === "professional"
      ? "text-emerald-500 bg-emerald-50 border-emerald-200"
      : "text-purple-500 bg-purple-50 border-purple-200";

  const handleCancelSubscription = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch("/api/payment/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCancelResult("success");
        await refreshProfile();
      } else {
        setCancelResult("error");
        setCancelError(data.error || "Beklenmeyen bir hata oluştu.");
      }
    } catch {
      setCancelResult("error");
      setCancelError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setCancelling(false);
    }
  };

  const handleChangePlan = async (newPlan: PlanType) => {
    setChangingPlan(true);
    try {
      const res = await fetch("/api/auth/set-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          plan: newPlan,
          billingCycle: cycle,
          email: profile.email || user.email,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshProfile();
        setUpgradeDialogOpen(false);
        // Ödeme sayfasına yönlendir
        router.push("/odeme");
      }
    } catch (e) {
      console.error("Plan change error:", e);
    } finally {
      setChangingPlan(false);
    }
  };

  const handleResubscribe = (newPlan?: PlanType) => {
    if (newPlan && newPlan !== plan) {
      // Önce planı değiştir, sonra ödemeye git
      handleChangePlan(newPlan);
    } else {
      // Aynı planla devam — direkt ödemeye git
      // payment_status'u pending'e çekmek için set-plan API'sini kullan
      handleChangePlan(plan);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hesap Ayarları</h1>
          <p className="text-sm text-slate-500">Abonelik ve hesap bilgilerinizi yönetin.</p>
        </div>
      </div>

      {/* Hesap Bilgileri */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-400" />
            Hesap Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Klinik Adı</p>
              <p className="text-sm font-bold text-slate-900">{profile.clinic_name}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">E-posta</p>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                {profile.email || user.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abonelik Durumu */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-400" />
            Abonelik Durumu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Paket Kartı */}
          <div className={`rounded-2xl border-2 p-5 ${planColorClass}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${planColorClass}`}>
                  <PlanIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-900 text-lg">{planData.name}</h3>
                    {isPaid && !isCancelled && (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        <CheckCircle2 className="w-3 h-3" /> Aktif
                      </span>
                    )}
                    {isCancelled && (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        <XCircle className="w-3 h-3" /> İptal Edildi
                      </span>
                    )}
                    {isTrialActive && !isPaid && !isCancelled && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Deneme
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {cycle === "monthly" ? "Aylık" : "Yıllık"} Abonelik
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-900">
                  {price.toLocaleString("tr-TR")} ₺
                </p>
                <p className="text-xs font-bold text-slate-400">
                  / {cycle === "monthly" ? "ay" : "yıl"}
                </p>
              </div>
            </div>
          </div>

          {/* Deneme Süresi Bilgisi */}
          {isTrialActive && !isPaid && !isCancelled && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <Calendar className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">Deneme Süreniz Devam Ediyor</p>
                <p className="text-xs text-amber-600 mt-1">
                  7 günlük ücretsiz deneme süreniz aktif. Süre sonunda ödeme yapmanız gerekmektedir.
                </p>
              </div>
            </div>
          )}

          {/* İptal Edilmiş — Tekrar Abone Ol */}
          {isCancelled && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-800">Aboneliğiniz İptal Edildi</p>
                  <p className="text-xs text-red-600 mt-1">
                    Aşağıdan mevcut paketinizle devam edebilir veya farklı bir paket seçerek yeniden abone olabilirsiniz.
                  </p>
                </div>
              </div>

              {/* Tekrar Abone Ol — Paket Seçimi */}
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-700">Paket Seçin ve Tekrar Abone Olun:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PLANS.map((p) => {
                    const Icon = p.icon;
                    const pd = PLAN_PRICES[p.key];
                    const isCurrentPlan = p.key === plan;
                    return (
                      <button
                        key={p.key}
                        onClick={() => handleResubscribe(p.key)}
                        disabled={changingPlan}
                        className={`relative text-left rounded-2xl border-2 p-4 transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] ${
                          isCurrentPlan
                            ? `${p.border} ${p.bg} ring-2 ring-offset-2 ring-${p.color.replace("text-", "")}`
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        {isCurrentPlan && (
                          <span className="absolute -top-2 right-3 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Mevcut
                          </span>
                        )}
                        <div className={`w-9 h-9 rounded-lg ${p.bg} flex items-center justify-center mb-3`}>
                          <Icon className={`w-5 h-5 ${p.color}`} />
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{pd.name}</h4>
                        <p className="text-lg font-black text-slate-900 mt-1">
                          {pd.monthly.toLocaleString("tr-TR")} ₺
                          <span className="text-xs text-slate-400 font-bold"> /ay</span>
                        </p>
                        <ul className="mt-2 space-y-1">
                          {p.features.map((f, i) => (
                            <li key={i} className="text-[11px] text-slate-500 flex items-start gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Aktif Kullanıcı — Paket Yükselt + İptal */}
          {isPaid && !isCancelled && !isDemo && profile.role !== "admin" && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
              {plan !== "advanced" && (
                <button
                  onClick={() => setUpgradeDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors group"
                >
                  <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  Paket Yükselt
                </button>
              )}
              <button
                onClick={() => setCancelDialogOpen(true)}
                className="text-sm font-semibold text-red-400 hover:text-red-600 transition-colors underline underline-offset-2"
              >
                Aboneliğimi İptal Et
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Güvenlik */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-400" />
            Güvenlik ve Gizlilik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-slate-600">Verileriniz AES-256 şifreleme ile korunmaktadır.</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-slate-600">KVKK uyumlu veri işleme politikaları uygulanmaktadır.</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-slate-600">Klinik verileri Row Level Security (RLS) ile izole edilmiştir.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paket Yükselt Modalı */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Crown className="w-7 h-7 text-emerald-600" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-slate-900 text-center">
              Paket Yükselt
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-slate-500 pt-1">
              Daha fazla özelliğe erişmek için paketinizi yükseltin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {PLANS.filter((p) => {
              const currentTier = plan === "starter" ? 0 : plan === "professional" ? 1 : 2;
              const thisTier = p.key === "starter" ? 0 : p.key === "professional" ? 1 : 2;
              return thisTier > currentTier;
            }).map((p) => {
              const Icon = p.icon;
              const pd = PLAN_PRICES[p.key];
              return (
                <button
                  key={p.key}
                  onClick={() => {
                    setSelectedPlan(p.key);
                    handleChangePlan(p.key);
                  }}
                  disabled={changingPlan}
                  className={`w-full text-left rounded-2xl border-2 ${p.border} ${p.bg} p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] group`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl ${p.bg} border ${p.border} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${p.color}`} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900">{pd.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {p.features.join(" • ")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xl font-black text-slate-900">{pd.monthly.toLocaleString("tr-TR")} ₺</p>
                      <p className="text-[10px] font-bold text-slate-400">/ay</p>
                    </div>
                  </div>
                  {changingPlan && selectedPlan === p.key ? (
                    <div className="mt-3 flex items-center justify-center gap-2 text-sm text-emerald-600 font-bold">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Yönlendiriliyor...
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-sm font-bold text-emerald-600 group-hover:text-emerald-700">
                      Bu Pakete Geç
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* İptal Onay Modalı */}
      <Dialog open={cancelDialogOpen} onOpenChange={(open) => {
        if (!cancelling) {
          setCancelDialogOpen(open);
          if (!open) {
            setCancelResult(null);
            setCancelError(null);
          }
        }
      }}>
        <DialogContent className="sm:max-w-[440px]">
          {cancelResult === "success" ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">Abonelik İptal Edildi</h3>
                <p className="text-sm text-slate-500">
                  Aboneliğiniz başarıyla iptal edilmiştir. Dilediğiniz zaman aynı sayfadan tekrar abone olabilirsiniz.
                </p>
              </div>
              <Button
                onClick={() => setCancelDialogOpen(false)}
                className="w-full bg-[#0a3d34] hover:bg-[#072b25] font-bold"
              >
                Tamam
              </Button>
            </div>
          ) : cancelResult === "error" ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">İptal Başarısız</h3>
                <p className="text-sm text-slate-500">{cancelError}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="flex-1">Kapat</Button>
                <Button onClick={handleCancelSubscription} disabled={cancelling} className="flex-1 bg-red-600 hover:bg-red-700 font-bold">Tekrar Dene</Button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                <DialogTitle className="text-xl font-extrabold text-slate-900 text-center">Aboneliği İptal Et</DialogTitle>
                <DialogDescription className="text-center text-sm text-slate-500 pt-2">
                  Aboneliğinizi iptal etmek istediğinizden emin misiniz?
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                  {["Dönem sonunda tüm özelliklerinize erişim kapanır.", "Kullanılmayan günler için kısmi iade yapılmaz.", "Verileriniz 30 gün boyunca saklanır, sonra silinir.", "Dilediğiniz zaman Ayarlar'dan tekrar abone olabilirsiniz."].map((t, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-amber-800">
                      <span className="shrink-0 mt-0.5">•</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="flex-1 font-bold" disabled={cancelling}>Vazgeç</Button>
                <Button onClick={handleCancelSubscription} disabled={cancelling} className="flex-1 bg-red-600 hover:bg-red-700 font-bold">
                  {cancelling ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" />İptal Ediliyor...</>) : "Evet, İptal Et"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
