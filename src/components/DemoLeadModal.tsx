"use client";

import { useState } from "react";
import { seedDemoData, DEMO_DURATION_MS } from "@/lib/demo-data";
import { Timer, Rocket, ArrowRight, User, Phone, Building2, Sparkles } from "lucide-react";

interface DemoLeadModalProps {
  open: boolean;
  onClose: () => void;
}

export function DemoLeadModal({ open, onClose }: DemoLeadModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [clinic, setClinic] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!open) return null;

  const handleStartWithLead = async () => {
    if (!name.trim() || !phone.trim()) return;
    setIsSending(true);

    // Save lead info locally
    localStorage.setItem("demo_lead", JSON.stringify({
      name: name.trim(),
      phone: phone.trim(),
      clinic: clinic.trim() || undefined,
      timestamp: new Date().toISOString(),
    }));

    // Fire-and-forget: send lead to Google Apps Script
    try {
      const LEAD_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPSOfJE332q-Ci1XOAfLtY6CBY0IzyB_HmpAJUgtPMoGzrFM_ND5RpHtzpzLX12-dM/exec';
      fetch(LEAD_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🎯 YENİ DEMO LEAD\nAd: ${name.trim()}\nTelefon: ${phone.trim()}\nKlinik: ${clinic.trim() || "Belirtilmedi"}`,
          sender: "Demo Lead Form",
        }),
      }).catch(() => {});
    } catch {}

    // Full 30-min demo
    localStorage.setItem("demo_duration_override", "30");
    seedDemoData();
    window.location.href = "/takvim";
  };

  const handleSkip = () => {
    // Reduced 15-min demo for skippers
    localStorage.setItem("demo_duration_override", "15");
    seedDemoData();
    window.location.href = "/takvim";
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-900/30 max-w-md w-full overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 fade-in duration-300">
        {/* Top gradient accent */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        {/* Header */}
        <div className="px-6 pt-7 pb-4 sm:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Ücretsiz Demo
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1.5">
            Platformu Keşfedin
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Bilgilerinizi bırakın, <span className="font-bold text-emerald-600">30 dakika</span> boyunca tüm özellikleri deneyin.
          </p>
        </div>

        {/* Form */}
        <div className="px-6 pb-2 sm:px-8 space-y-3">
          {/* Name */}
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Ad Soyad *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              autoFocus
            />
          </div>

          {/* Phone */}
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="tel"
              placeholder="Telefon *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
            />
          </div>

          {/* Clinic (optional) */}
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Klinik Adı (opsiyonel)"
              value={clinic}
              onChange={(e) => setClinic(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
            />
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="px-6 pt-3 pb-5 sm:px-8 space-y-2.5">
          {/* Primary CTA */}
          <button
            onClick={handleStartWithLead}
            disabled={!name.trim() || !phone.trim() || isSending}
            className="w-full flex items-center justify-center gap-2 bg-[#0a3d34] hover:bg-[#072b25] disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 px-6 rounded-2xl font-bold text-base shadow-xl shadow-[#0a3d34]/20 hover:-translate-y-0.5 transition-all active:scale-[0.98] group"
          >
            <Rocket className="w-4.5 h-4.5" />
            {isSending ? "Başlatılıyor..." : "Demoyu Başlat"}
            <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Separator */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400 font-medium">veya</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Skip */}
          <button
            onClick={handleSkip}
            className="w-full text-center text-sm font-semibold text-slate-400 hover:text-emerald-600 py-2 transition-colors"
          >
            Kayıt olmadan dene
            <span className="text-xs font-normal text-slate-300 ml-1">(15 dk)</span>
          </button>
        </div>

        {/* Trust footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 sm:px-8">
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            🔒 Bilgileriniz gizli tutulur. Spam göndermiyoruz.
          </p>
        </div>
      </div>
    </div>
  );
}
