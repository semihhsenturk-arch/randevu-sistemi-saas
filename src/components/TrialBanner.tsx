"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Clock, Sparkles, ArrowRight, CreditCard } from "lucide-react";

export function TrialBanner() {
  const { profile, isTrialActive, isLoading } = useAuth();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!profile?.approved_at || !isTrialActive) return;

    const calcRemaining = () => {
      const approvedAt = new Date(profile.approved_at!).getTime();
      const expiresAt = approvedAt + 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calcRemaining();
    const timer = setInterval(calcRemaining, 1000);
    return () => clearInterval(timer);
  }, [profile?.approved_at, isTrialActive]);

  // Don't render if: loading, not in trial, already paid, is admin, or no time data
  if (
    isLoading ||
    !isTrialActive ||
    profile?.payment_status === "paid" ||
    profile?.payment_status === "cancelled" ||
    profile?.role === "admin" ||
    !timeLeft
  ) {
    return null;
  }

  const totalSeconds =
    timeLeft.days * 86400 +
    timeLeft.hours * 3600 +
    timeLeft.minutes * 60 +
    timeLeft.seconds;
  const totalTrialSeconds = 7 * 24 * 60 * 60;
  const percentage = (totalSeconds / totalTrialSeconds) * 100;

  // Color transitions based on time remaining
  const isUrgent = timeLeft.days <= 1;
  const isWarning = timeLeft.days <= 3 && !isUrgent;

  const barColor = isUrgent ? "#ef4444" : isWarning ? "#f59e0b" : "#10b981";
  const accentBg = isUrgent
    ? "bg-red-500/15 text-red-400"
    : isWarning
    ? "bg-amber-500/15 text-amber-400"
    : "bg-emerald-500/15 text-emerald-400";
  const dotColor = isUrgent
    ? "bg-red-400"
    : isWarning
    ? "bg-amber-400"
    : "bg-emerald-400";
  const timerColor = isUrgent
    ? "text-red-400"
    : isWarning
    ? "text-amber-400"
    : "text-emerald-300";

  const TimeUnit = ({
    value,
    label,
  }: {
    value: number;
    label: string;
  }) => (
    <div className="flex flex-col items-center">
      <span className="text-sm font-mono font-black leading-none">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[8px] uppercase tracking-wider opacity-60 mt-0.5 font-bold">
        {label}
      </span>
    </div>
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-[3000] xl:left-[280px]">
      <div className="bg-gradient-to-r from-[#1e293b] via-[#1e293b] to-[#0f172a] backdrop-blur-md border-b border-white/5 px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Trial badge + countdown */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex items-center gap-1.5 ${accentBg} px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shrink-0`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`}
            />
            <Sparkles className="w-3 h-3" />
            Deneme
          </div>

          {/* Timer display */}
          <div className={`flex items-center gap-2 ${timerColor}`}>
            <Clock className="w-3.5 h-3.5 shrink-0 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              {timeLeft.days > 0 && (
                <>
                  <TimeUnit value={timeLeft.days} label="Gün" />
                  <span className="text-xs opacity-40 font-bold">:</span>
                </>
              )}
              <TimeUnit value={timeLeft.hours} label="Saat" />
              <span className="text-xs opacity-40 font-bold">:</span>
              <TimeUnit value={timeLeft.minutes} label="Dk" />
              <span className="text-xs opacity-40 font-bold hidden sm:inline">
                :
              </span>
              <span className="hidden sm:block">
                <TimeUnit value={timeLeft.seconds} label="Sn" />
              </span>
            </div>
          </div>
        </div>

        {/* Center: Progress bar (desktop only) */}
        <div className="hidden md:flex flex-1 max-w-xs items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${percentage}%`, backgroundColor: barColor }}
            />
          </div>
          <span className="text-[10px] text-white/40 font-medium whitespace-nowrap">
            {timeLeft.days} gün kaldı
          </span>
        </div>

        {/* Right: CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => router.push("/odeme")}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 group"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Şimdi Abone Ol</span>
            <span className="sm:hidden">Abone Ol</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
