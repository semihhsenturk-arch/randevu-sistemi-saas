"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already accepted or declined cookies
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-10">
      <div className="max-w-5xl mx-auto bg-slate-900 text-slate-200 p-4 md:p-6 rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1 pr-4">
          <h3 className="text-white font-bold mb-1">Çerez (Cookie) Kullanımı</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Size daha iyi hizmet sunabilmek ve platform performansını analiz edebilmek için çerezler (cookies) kullanıyoruz. 
            Detaylı bilgi için <Link href="/legal/kvkk" className="text-emerald-400 hover:underline">Çerez ve KVKK Aydınlatma Metni</Link>'ni inceleyebilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDecline}
            className="flex-1 md:flex-none border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Reddet
          </Button>
          <Button 
            size="sm" 
            onClick={handleAccept}
            className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            Kabul Et
          </Button>
          <button 
            onClick={handleDecline} 
            className="p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
