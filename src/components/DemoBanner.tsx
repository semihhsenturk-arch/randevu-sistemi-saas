"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getDemoTimeRemaining, getDemoDurationMs, clearDemoData } from "@/lib/demo-data";
import { Timer, Rocket, ArrowRight, RotateCcw, Phone } from "lucide-react";

export function DemoBanner() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(30 * 60 * 1000);
  const [isExpired, setIsExpired] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only run on client
    const dur = getDemoDurationMs();
    setDuration(dur);
    
    const initial = getDemoTimeRemaining();
    setRemaining(initial);
    if (initial !== null && initial <= 0) setIsExpired(true);

    const timer = setInterval(() => {
      const r = getDemoTimeRemaining();
      setRemaining(r);
      if (r !== null && r <= 0) {
        setIsExpired(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleEndDemo = useCallback(() => {
    clearDemoData();
    window.location.href = "/";
  }, []);

  const handleRegister = useCallback(() => {
    clearDemoData();
    window.location.href = "/register";
  }, []);

  // Not in demo mode
  if (remaining === null && !isExpired) return null;

  const minutes = remaining ? Math.floor(remaining / 60000) : 0;
  const seconds = remaining ? Math.floor((remaining % 60000) / 1000) : 0;
  const percentage = remaining ? (remaining / duration) * 100 : 0;

  // Dynamic color based on time remaining
  const barColor = percentage > 50 ? "#10b981" : percentage > 20 ? "#f59e0b" : "#ef4444";
  const textColor = percentage > 50 ? "text-emerald-400" : percentage > 20 ? "text-amber-400" : "text-red-400";
  const pulseClass = percentage <= 20 && percentage > 0 ? "animate-pulse" : "";

  // EXPIRED OVERLAY
  if (isExpired) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Backdrop blur */}
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" />
        
        {/* Card */}
        <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-900/30 max-w-lg w-[92%] mx-4 overflow-hidden">
          {/* Top accent */}
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          
          <div className="px-6 py-8 sm:px-10 sm:py-10 text-center space-y-6">
            {/* Timer icon with ring */}
            <div className="mx-auto w-20 h-20 rounded-full bg-red-50 flex items-center justify-center ring-4 ring-red-100">
              <Timer className="w-10 h-10 text-red-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Demo Süreniz Doldu
              </h2>
              <p className="text-slate-500 text-base leading-relaxed max-w-sm mx-auto">
                {Math.round(duration / 60000)} dakikalık deneme süreniz sona erdi. Kliniğinizi dijitalleştirmeye hazır mısınız?
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleRegister}
                className="w-full flex items-center justify-center gap-2 bg-[#0a3d34] hover:bg-[#072b25] text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-xl shadow-[#0a3d34]/20 hover:-translate-y-0.5 transition-all active:scale-[0.98] group"
              >
                <Rocket className="w-5 h-5" />
                7 Gün Ücretsiz Deneyin
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <a
                href="https://wa.me/905XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 py-3.5 px-6 rounded-2xl font-bold text-base transition-all hover:bg-emerald-50"
              >
                <Phone className="w-4 h-4" />
                Bizi Arayın
              </a>

              <button
                onClick={handleEndDemo}
                className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors mt-1"
              >
                Ana Sayfaya Dön
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE DEMO BANNER (sticky top bar)
  return (
    <div className="fixed top-0 left-0 right-0 z-[3000] xl:left-[280px]">
      <div className="bg-[#1e293b]/95 backdrop-blur-md border-b border-white/5 px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Demo label + timer */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Demo
          </div>
          <div className={`flex items-center gap-1.5 font-mono font-bold text-sm ${textColor} ${pulseClass}`}>
            <Timer className="w-3.5 h-3.5" />
            <span>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span>
          </div>
        </div>

        {/* Center: Progress bar (hidden on very small screens) */}
        <div className="hidden sm:flex flex-1 max-w-xs items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${percentage}%`, backgroundColor: barColor }}
            />
          </div>
          <span className="text-[10px] text-white/40 font-medium whitespace-nowrap">
            {Math.round(percentage)}%
          </span>
        </div>

        {/* Right: CTA buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRegister}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95"
          >
            Hemen Başla
          </button>
          <button
            onClick={handleEndDemo}
            className="text-white/40 hover:text-white/70 text-xs font-medium transition-colors hidden sm:block"
          >
            Çıkış
          </button>
        </div>
      </div>
    </div>
  );
}
