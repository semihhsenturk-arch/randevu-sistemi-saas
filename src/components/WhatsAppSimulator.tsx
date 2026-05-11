"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Check, X, RefreshCw, Send } from "lucide-react";
import { useDatabase } from "@/hooks/use-database";
import { toast } from "sonner";

export function WhatsAppSimulator() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getAppointments, fetchFreshAppointments } = useDatabase();
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);

  const loadPending = async () => {
    const apts = await getAppointments();
    // In simulator, we just want to see appointments that are 'sent' or 'beklemede'
    const pending = apts.filter(a => a.whatsapp_status === 'sent' || a.durum === 'beklemede');
    setPendingMessages(pending);
  };

  const triggerCron = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/cron/whatsapp-reminder?forceAll=true");
      const data = await res.json();
      if (data.success) {
        toast.success(`Cron Çalıştı: ${data.sentIds.length} mesaj gönderildi.`);
        await fetchFreshAppointments();
        loadPending();
      } else {
        toast.error("Cron Hatası: " + data.error);
      }
    } catch (e: any) {
      toast.error("İstek Başarısız: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateReply = async (appointmentId: string, reply: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/whatsapp/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, reply })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Hasta "${reply}" yanıtı verdi.`);
        await fetchFreshAppointments();
        loadPending();
      } else {
        toast.error("Webhook Hatası: " + data.error);
      }
    } catch (e: any) {
      toast.error("İstek Başarısız: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => { setIsOpen(true); loadPending(); }}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#128C7E] shadow-xl text-white z-50 p-0"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 overflow-hidden flex flex-col">
      <div className="bg-[#075E54] text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <span className="font-bold">WhatsApp Simülatör</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
      </div>
      
      <div className="p-4 bg-slate-50 flex flex-col gap-3 max-h-[400px] overflow-y-auto">
        <Button onClick={triggerCron} disabled={isLoading} variant="outline" className="w-full font-bold border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Cron Job Çalıştır (Tümüne Gönder)
        </Button>
        
        {pendingMessages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm italic py-4">Bekleyen mesaj yok.</div>
        ) : (
          pendingMessages.map(apt => (
            <div key={apt.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-slate-700">{apt.musteriAdi}</span>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{apt.saat}</span>
              </div>
              
              {apt.whatsapp_status === 'sent' ? (
                <>
                  <div className="text-[0.7rem] text-slate-500 bg-[#E1F5FE] p-2 rounded-lg relative">
                    <span className="font-bold block mb-1">Klinik:</span>
                    Sayın {apt.musteriAdi}, yarın {apt.saat} randevunuzu onaylıyor musunuz? Lütfen EVET veya HAYIR yazın.
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Button onClick={() => simulateReply(apt.id, 'Evet')} disabled={isLoading} size="sm" className="flex-1 bg-[#25D366] hover:bg-[#128C7E] h-8 text-xs font-bold text-white">
                      Evet
                    </Button>
                    <Button onClick={() => simulateReply(apt.id, 'Hayır')} disabled={isLoading} size="sm" className="flex-1 bg-rose-500 hover:bg-rose-600 h-8 text-xs font-bold text-white">
                      Hayır
                    </Button>
                  </div>
                </>
              ) : apt.whatsapp_status === 'declined' ? (
                <div className="text-xs text-rose-600 font-bold flex items-center gap-1">
                  <X className="w-3 h-3" /> Reddedildi
                </div>
              ) : apt.whatsapp_status === 'confirmed' ? (
                <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Onaylandı
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic flex items-center gap-1">
                  Henüz mesaj gönderilmedi.
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
