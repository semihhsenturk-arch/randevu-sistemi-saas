"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, Star, Zap, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { PLAN_PRICES, PlanType, BillingCycle } from "@/lib/iyzico-config";

interface UpgradeScreenProps {
  title: string;
  description: string;
  requiredPlan?: string;
}

export function UpgradeScreen({ title, description, requiredPlan = "Advanced" }: UpgradeScreenProps) {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);

  const handleUpgrade = async (selectedPlan: PlanType) => {
    if (!profile || !user) return;
    setLoadingPlan(selectedPlan);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          plan: selectedPlan, 
          payment_status: "pending", 
          billing_cycle: cycle 
        })
        .eq("id", profile.id);

      if (!error) {
        await refreshProfile();
        // State güncellemelerinin (Sidebar yönlendirmesi vs) Next.js router ile çakışıp ekranı kilitlemesini (transition freeze) önlemek için push işlemini mikro-gecikmeyle (timeout) kuyruğa alıyoruz.
        setTimeout(() => {
          router.push("/odeme");
        }, 100);
      } else {
        alert("Paket güncellenirken bir hata oluştu.");
      }
    } catch (err) {
      console.error(err);
      alert("Bir hata oluştu, lütfen tekrar deneyin.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const plansToShow: PlanType[] = profile?.plan === "professional" 
    ? ["advanced"] 
    : ["professional", "advanced"];

  const gridColsClass = plansToShow.length === 1 
    ? "grid-cols-1 max-w-md" 
    : "grid-cols-1 md:grid-cols-2 max-w-3xl";

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] py-8 px-4">
      <div className="max-w-4xl w-full text-center mb-8">
        <div className="w-16 h-16 bg-emerald-50 text-[#0a3d34] rounded-2xl flex items-center justify-center mx-auto mb-6 shrink-0">
          <Lock className="w-8 h-8" />
        </div>
        
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3">{title}</h2>
        <p className="text-slate-500 mb-4 max-w-xl mx-auto leading-relaxed">
          {description}
        </p>
        <p className="text-sm font-bold bg-amber-50 text-amber-700 inline-block px-4 py-2 rounded-full border border-amber-200">
          Bu özellik en az {requiredPlan} Pakete sahip kullanıcılar içindir.
        </p>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 border border-slate-200 w-full max-w-[300px] mx-auto">
        <button
          onClick={() => setCycle("monthly")}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
            cycle === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Aylık Ödeme
        </button>
        <button
          onClick={() => setCycle("yearly")}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            cycle === "yearly" ? "bg-[#0a3d34] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Yıllık <span className="text-[0.65rem] bg-emerald-400 text-[#0a3d34] px-1.5 py-0.5 rounded-md font-black">-20%</span>
        </button>
      </div>

      <div className={`grid gap-6 w-full mx-auto ${gridColsClass}`}>
        {plansToShow.map((planStr) => {
          const planData = PLAN_PRICES[planStr];
          const price = planData[cycle];
          const monthlyEq = cycle === "yearly" ? Math.round(price / 12) : price;
          const isProf = planStr === "professional";
          const Icon = isProf ? ShieldCheck : Star;
          
          return (
            <div key={planStr} className={`bg-white rounded-3xl p-6 border-2 transition-all flex flex-col ${isProf ? "border-emerald-200 shadow-xl shadow-emerald-500/5 hover:border-emerald-400" : "border-purple-200 shadow-xl shadow-purple-500/5 hover:border-purple-400"} relative`}>
              {planStr === "advanced" && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-black tracking-wide flex items-center gap-1 shadow-md">
                  <Star className="w-3 h-3" /> EN KAPSAMLI
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isProf ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-extrabold text-slate-900">{planData.name}</h3>
                  <div className="text-sm text-slate-500 font-medium">İhtiyacınıza uygun özellikler</div>
                </div>
              </div>

              <div className="mb-6 flex gap-2 items-end">
                <span className="text-3xl font-black text-slate-900">{monthlyEq.toLocaleString("tr-TR")} ₺</span>
                <span className="text-slate-400 font-semibold mb-1">/ ay</span>
              </div>
              
              {cycle === "yearly" && (
                <div className="bg-emerald-50 text-emerald-700 text-xs font-bold p-2.5 rounded-xl border border-emerald-100 flex items-center gap-2 mb-6">
                  <Sparkles className="w-4 h-4 shrink-0" /> Yılda {price.toLocaleString("tr-TR")} ₺ ödenir.
                </div>
              )}
              {cycle === "monthly" && <div className="h-4 mb-6"></div>}

              <div className="mt-auto">
                <Button 
                  onClick={() => handleUpgrade(planStr)}
                  disabled={!!loadingPlan}
                  className={`w-full py-6 rounded-2xl text-[1rem] font-bold shadow-xl transition-all hover:-translate-y-0.5 ${
                    isProf 
                      ? "bg-[#0a3d34] hover:bg-[#072b25] text-white shadow-[#0a3d34]/20" 
                      : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20"
                  }`}
                >
                  {loadingPlan === planStr ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Yönlendiriliyor...</>
                  ) : (
                    "Hemen Yükselt"
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
