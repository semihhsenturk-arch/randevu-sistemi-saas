"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addDays, startOfWeek, parseISO, isValid } from "date-fns";
import { tr } from "date-fns/locale/tr";
import { DatePicker } from "@/components/ui/date-picker";
import { useDatabase, Appointment, CACHE_KEYS, getCacheSync, Service } from "@/hooks/use-database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Check, X, AlertTriangle, Trash2, Loader2, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// DND Kit Imports
import { 
  DndContext, 
  pointerWithin, 
  MouseSensor,
  TouchSensor,
  useSensor, 
  useSensors, 
  DragEndEvent,
  DragOverlay,
  DragStartEvent
} from "@dnd-kit/core";

// Components
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { DraggableAppointment } from "@/components/calendar/DraggableAppointment";
import { DroppableSlot } from "@/components/calendar/DroppableSlot";

const GOOGLE_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwPSOfJE332q-Ci1XOAfLtY6CBY0IzyB_HmpAJUgtPMoGzrFM_ND5RpHtzpzLX12-dM/exec";

const SHIFTS = Array.from({ length: 18 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9;
  const min = (i % 2) * 30;
  return `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
});

export default function CalendarPage() {
  const { profile } = useAuth();
  const { getAppointments, saveAppointment, deleteAppointment, getServices } = useDatabase();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [currentApt, setCurrentApt] = useState<Partial<Appointment>>({});
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0); // For mobile single day view
  const [isMounted, setIsMounted] = useState(false);
  const [sheetModalOpen, setSheetModalOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(profile?.google_sheet_url || "");

  useEffect(() => {
    if (profile?.google_sheet_url) {
      setSheetUrl(profile.google_sheet_url);
    }
  }, [profile?.google_sheet_url]);

  // Client-side initialization
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // DND Sensors - Using specific sensors for better performance and instant response
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 3, // Start dragging after moving 3px
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250, // Slight delay for touch to allow scrolling
      tolerance: 5,
    },
  });
  
  const sensors = useSensors(mouseSensor, touchSensor);

  useEffect(() => {
    // Load from cache first for instant feedback
    const cached = getCacheSync<Appointment[]>(CACHE_KEYS.APPOINTMENTS);
    if (cached) setAppointments(cached);
    
    const cachedServices = getCacheSync<Service[]>(CACHE_KEYS.SERVICES);
    if (cachedServices) setServices(cachedServices);
    
    loadData();
  }, [getAppointments, getServices]);

  const loadData = async () => {
    try {
      const [data, svcs] = await Promise.all([getAppointments(), getServices()]);
      setAppointments(data);
      if (svcs) setServices(svcs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const targetUrl = profile?.google_sheet_url;
      if (!targetUrl) {
        toast.error("Google Sheet Bağlı Değil", {
          description: "Lütfen ayarlar ikonuna tıklayarak Google Sheet URL'nizi girin.",
        });
        setSyncing(false);
        return;
      }
      const response = await fetch(targetUrl);
      const rawData = await response.json();
      if (rawData.status === "success" && rawData.data) {
        let freshApts = [...appointments];
        let newAptsCount = 0;
        let skippedCount = 0;

        for (const row of rawData.data) {
          const ad = row["Ad Soyad"] || row["Ad"] || row["Müşteri Adı"] || row["İsim"] || "";
          let tel = (row["Telefon Numarası"] || row["Telefon"] || row["Tel"] || row["İletişim"] || "").toString();
          
          let tarihRaw = (row["Tercih Edilen Tarih"] || row["Tarih"] || row["Randevu Tarihi"] || "").toString();
          let tarih = "";
          let saat = (row["Saat"] || row["Randevu Saati"] || "").toString();

          if (tarihRaw.includes(" ")) {
            const parts = tarihRaw.split(" ");
            tarih = parts[0];
            if (!saat) saat = parts[1];
          } else {
            tarih = tarihRaw;
          }

          if (tarih.includes(".")) {
            const parts = tarih.split(".");
            if (parts.length === 3) tarih = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          
          if (tarih.length > 10) tarih = tarih.substring(0, 10);

          if (!saat || saat === "00:00") saat = "09:00";
          if (saat.length > 5) saat = saat.substring(0, 5);

          if (!ad || !tarih || tarih === "undefined") {
            skippedCount++;
            continue;
          }

          let durum: "beklemede" | "onaylandi" | "iptal" = "beklemede";
          const hizmetAd = row["İlgilendiği Tedavi"] || row["Hizmet"] || row["Hizmet Tipi"] || row["İşlem"] || "";
          let notlar = row["Notlar"] || row["Not"] || row["Açıklama"] || "";
          if (hizmetAd) notlar = notlar ? `İstek: ${hizmetAd}\n${notlar}` : `İstek: ${hizmetAd}`;

          let hId: string | number = services[0]?.id || 1;
          const muayeneHizmet = services.find(h => h.ad.toLowerCase().includes("muayene"));
          if (muayeneHizmet) hId = muayeneHizmet.id;

          // Eşsiz ID üretimi için hem index hem de isim/tarih kullanıyoruz
          const sheetRowId = "gs_" + (row["_sheetRowIndex"] || Math.random().toString(36).substr(2, 5));
          const existingIdx = freshApts.findIndex(a => a.id === sheetRowId || (a.tarih === tarih && a.saat === saat && a.musteriAdi === ad));

          if (existingIdx > -1) {
            const existing = freshApts[existingIdx];
            if (existing.durum === "onaylandi" || existing.durum === "iptal") {
              continue; 
            }
          }

          const newData = {
            id: existingIdx > -1 ? freshApts[existingIdx].id : sheetRowId,
            musteriAdi: ad,
            telefon: tel,
            hizmetId: hId.toString(),
            tarih,
            saat,
            durum,
            notlar
          };

          if (existingIdx > -1) {
            freshApts[existingIdx] = { ...freshApts[existingIdx], ...newData };
            await saveAppointment(newData as Appointment).catch(e => console.error(e));
          } else {
            freshApts.push(newData);
            newAptsCount++;
            await saveAppointment(newData as Appointment).catch(err => {
              toast.error("Kayıt Başarısız: " + ad, { description: err.message });
            });
          }
        }
        setAppointments(freshApts);
        toast.success("Senkronizasyon Tamamlandı", {
          description: `${newAptsCount} yeni kayıt eklendi. (Atlanan: ${skippedCount})`,
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Senkronizasyon Hatası", {
        description: "Google Sheets verileri çekilemedi.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    const aptId = active.id as string;
    const { date, time } = over.data.current as { date: string; time: string };

    const apt = appointments.find(a => a.id === aptId);
    if (!apt) return;

    if (apt.tarih === date && apt.saat === time) return;

    // Conflict Check
    const conflicts = appointments.filter(a => a.tarih === date && a.saat === time && a.id !== aptId && a.durum === "onaylandi");
    if (conflicts.length >= 2) {
      toast.warning("Kapasite Dolu", {
        description: "Bu saatte zaten maksimum (2) onaylı randevu bulunmaktadır.",
      });
      return;
    }

    const updated = { ...apt, tarih: date, saat: time };
    setAppointments(prev => prev.map(a => a.id === aptId ? updated : a));
    try {
      const saved = await saveAppointment(updated);
      if (saved && saved.id !== aptId) {
        setAppointments(prev => prev.map(a => a.id === aptId ? { ...a, id: saved.id } : a));
      }
    } catch (e) {
      console.error("Sürükleme hatası:", e);
    }
  };

  const handleApprove = async (apt: Appointment) => {
    const conflicts = appointments.filter(a => a.tarih === apt.tarih && a.saat === apt.saat && a.id !== apt.id && a.durum === "onaylandi");
    if (conflicts.length >= 2) {
      toast.warning("Kapasite Dolu", {
        description: "Bu saatte zaten maksimum (2) onaylı randevu var.",
      });
      return;
    }
    const updated = { ...apt, durum: "onaylandi" as const };
    setAppointments(prev => prev.map(a => a.id === apt.id ? updated : a));
    try {
      const saved = await saveAppointment(updated);
      if (saved && saved.id !== apt.id) {
        setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, id: saved.id } : a));
      }
    } catch (e) {
      console.error("Onaylama hatası:", e);
    }
  };

  const handleReject = async (apt: Appointment) => {
    const updated = { ...apt, durum: "iptal" as const };
    setAppointments(prev => prev.map(a => a.id === apt.id ? updated : a));
    try {
      const saved = await saveAppointment(updated);
      if (saved && saved.id !== apt.id) {
        setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, id: saved.id } : a));
      }
    } catch (e) {
      console.error("Reddetme hatası:", e);
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentApt.tarih || !currentApt.saat || !currentApt.musteriAdi) return;

    const tempId = currentApt.id || "temp_" + Math.random().toString(36).substr(2, 9);
    const payload = {
      ...(currentApt as Appointment),
      id: tempId,
      hizmetId: currentApt.hizmetId || "1",
      durum: currentApt.durum || "beklemede"
    };

    setAppointments(prev => currentApt.id ? prev.map(a => a.id === payload.id ? payload : a) : [...prev, payload]);
    setModalOpen(false);
    
    try {
      const saved = await saveAppointment(payload);
      // Veritabanından dönen gerçek ID ile local state'i güncelle
      if (saved && saved.id !== tempId) {
        setAppointments(prev => prev.map(a => a.id === tempId ? { ...a, id: saved.id } : a));
      }
    } catch (e) {
      console.error("Randevu kaydedilemedi:", e);
      toast.error("Kayıt Hatası", { description: "Randevu kaydedilemedi." });
    }
  };

  const handleDelete = async () => {
    if (!currentApt.id) return;
    
    // Google Sheets'ten gelen randevular için veritabanında 'iptal' olarak işaretliyoruz (hafıza takibi için)
    if (currentApt.id.startsWith("gs_")) {
      const updated = { ...currentApt, durum: "iptal" as const } as Appointment;
      setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
      await saveAppointment(updated);
    } else {
      setAppointments(prev => prev.filter(a => a.id !== currentApt.id));
      await deleteAppointment(currentApt.id);
    }
    
    setConfirmOpen(false);
    setModalOpen(false);
  };

  const handleSaveSheetUrl = async () => {
    if (!profile?.id) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ google_sheet_url: sheetUrl })
        .eq('id', profile.id);
      
      if (error) throw error;
      toast.success("Ayarlar Kaydedildi", { description: "Google Sheet URL'niz güncellendi." });
      setSheetModalOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Hata", { description: "Ayarlar kaydedilemedi." });
    }
  };

  const getWeekRange = () => {
    const today = new Date();
    const monday = addDays(startOfWeek(today, { weekStartsOn: 1 }), weekOffset * 7);
    const sunday = addDays(monday, 6);
    return { monday, sunday };
  };

  const { monday, sunday } = getWeekRange();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const stats = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const weekLabels = weekDays.map(d => format(d, "yyyy-MM-dd"));
    const todays = appointments.filter(a => a.tarih === todayStr && a.durum !== "iptal");
    const weekApts = appointments.filter(a => weekLabels.includes(a.tarih) && a.durum !== "iptal");
    const weekConfirmed = weekApts.filter(a => a.durum === "onaylandi");
    
    const income = weekConfirmed.reduce((sum, a) => {
      const svc = services.find(h => h.id.toString() === a.hizmetId.toString());
      return sum + (svc?.fiyat || 0);
    }, 0);

    const occupancy = Math.round((weekConfirmed.length / 96) * 100);
    return { todayCount: todays.length, weekCount: weekApts.length, income, occupancy };
  }, [appointments, weekDays]);

  const waitingApps = useMemo(() => {
    return appointments.filter(a => a.durum === "beklemede").sort((a,b) => a.tarih.localeCompare(b.tarih) || a.saat.localeCompare(b.saat));
  }, [appointments]);

  const draggedApt = activeDragId ? appointments.find(a => a.id === activeDragId) : null;

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 relative">
      <CalendarHeader 
        monday={monday} 
        sunday={sunday} 
        weekOffset={weekOffset} 
        setWeekOffset={setWeekOffset} 
        syncing={syncing}
        onSync={handleSync}
        onNewAppointment={(t, s) => { setCurrentApt({ tarih: t, saat: s, durum: "beklemede", musteriAdi: "" }); setModalOpen(true); }}
        stats={stats}
        clinicName={profile?.clinic_name}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start pb-20">
        {/* Sol Kolon: Takvim Alanı */}
        <div className="flex-1 w-full bg-transparent min-w-0">
          <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {/* Mobile Day Selector */}
            <div className="lg:hidden grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDayIndex(i)}
                  className={`flex flex-col items-center py-2 rounded-xl transition-all ${
                    selectedDayIndex === i 
                      ? 'bg-[#0a3d34] text-white shadow-md' 
                      : 'bg-white text-slate-400 border border-slate-100'
                  }`}
                >
                  <span className="text-[0.6rem] font-bold uppercase">{format(d, "EEE", { locale: tr })}</span>
                  <span className="text-sm font-black">{format(d, "d")}</span>
                </button>
              ))}
            </div>

            <div className="flex items-stretch gap-2 mb-2">
              <div className="w-[60px] md:w-[70px] shrink-0 flex flex-col items-center justify-center gap-2">
                 <Button variant="outline" size="icon" className={`h-10 w-10 md:h-11 md:w-11 ${syncing ? 'border-[#0a3d34] text-[#0a3d34]' : 'text-slate-400'}`} onClick={handleSync}>
                    <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#0a3d34]" onClick={() => setSheetModalOpen(true)}>
                    <Settings className="w-4 h-4" />
                 </Button>
              </div>
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-7 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {weekDays.map((d, i) => (
                  <div key={i} className={`p-3 text-center border-l border-slate-100 first:border-0 ${format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? 'bg-emerald-50/50' : ''} ${selectedDayIndex === i ? 'block' : 'hidden lg:block'}`}>
                    <div className="text-[0.68rem] font-bold uppercase text-slate-500 mb-0.5 tracking-wider">{format(d, "EEEE", { locale: tr })}</div>
                    <div className="text-[1.2rem] font-extrabold text-slate-900">{format(d, "d")}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[60px_1fr] md:grid-cols-[70px_1fr] bg-white border border-slate-200 rounded-2xl shadow-sm h-[700px] md:h-[900px] overflow-y-auto no-scrollbar relative mb-10">
              <div className="flex flex-col border-r border-slate-100 bg-slate-50/50">
                {SHIFTS.map((t, i) => {
                  if (t === "12:30") return <div key="lunch-l" className="h-[100px] flex items-center justify-center text-[0.65rem] font-bold text-slate-400 [writing-mode:vertical-rl] rotate-180 bg-slate-100">ÖĞLE ARASI</div>;
                  if (t === "13:00") return null;
                  return <div key={i} className="h-[50px] flex items-center justify-center text-[0.7rem] font-semibold text-slate-400 border-b border-slate-100">{t}</div>
                })}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-7 relative">
                {weekDays.map((d, i) => {
                  const dStr = format(d, "yyyy-MM-dd");
                  const colApts = appointments.filter(a => a.tarih === dStr && (a.durum === "onaylandi" || a.durum === "beklemede"));
                  return (
                    <div key={i} className={`flex flex-col border-l border-slate-100 relative min-h-[700px] md:min-h-[900px] ${selectedDayIndex === i ? 'block' : 'hidden lg:block'}`}>
                      {SHIFTS.map((t, j) => {
                        if (t === "12:30") return <div key="lunch-s" className="h-[100px] bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,#f1f5f9_4px,#f1f5f9_5px)] border-y border-slate-200 flex items-center justify-center text-[0.65rem] uppercase font-bold text-slate-400 tracking-wider">Öğle Arası</div>;
                        if (t === "13:00") return null;
                        return (
                          <DroppableSlot key={j} id={`${dStr}_${t}`} date={dStr} time={t} onClick={() => { setCurrentApt({ tarih: dStr, saat: t, durum: "beklemede" }); setModalOpen(true); }}>
                            <div className="h-[50px] border-b border-slate-50"></div>
                          </DroppableSlot>
                        );
                      })}

                      {colApts.map((a) => {
                        if (a.durum === "beklemede" && !activeDragId) return null;
                        const svc = services.find(h => h.id.toString() === a.hizmetId.toString());
                        const idx = SHIFTS.indexOf(a.saat);
                        if (idx === -1) return null;
                        const sameSlotApts = colApts.filter(ca => ca.saat === a.saat);
                        const slotLen = sameSlotApts.length;
                        const cIdx = sameSlotApts.findIndex(ca => ca.id === a.id);
                        const top = idx * 50 + 5;
                        const height = ((svc?.sure || 30) / 30) * 50 - 10;
                        const wPct = 100 / slotLen;
                        return (
                          <DraggableAppointment 
                            key={a.id} 
                            appointment={a} 
                            service={svc} 
                            onClick={openEditApt} 
                            style={{ top: `${top}px`, height: `${height}px`, width: `calc(${wPct}% - 8px)`, left: `calc(${cIdx * wPct}% + 4px)` }} 
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            <DragOverlay>
              {draggedApt ? (
                <div className={`appointment-card-legacy ${draggedApt.durum} opacity-90 cursor-grabbing shadow-2xl scale-105 transition-transform`} style={{ width: '160px', height: '45px', position: 'static', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span className="apt-name">{draggedApt.musteriAdi}</span>
                  <span className="apt-service text-[0.6rem] opacity-70">
                    {services.find(h => h.id.toString() === draggedApt.hizmetId.toString())?.ad || "Bilinmeyen Hizmet"}
                  </span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Sağ Kolon: Sidebar / Bekleme Odası */}
        <div className="w-full flex flex-col gap-4 sticky top-16">
          <Card className="rounded-[20px] shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-slate-50">
              <CardTitle className="text-[0.95rem] font-extrabold text-[#1e293b] flex items-center justify-between">
                Bekleme Odası {waitingApps.length > 0 && <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-[0.7rem]">{waitingApps.length}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
               <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto no-scrollbar">
                 {waitingApps.length === 0 ? <div className="text-center p-8 text-xs italic text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">Bekleyen randevu yok</div> : waitingApps.map(a => (
                   <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-1 shadow-sm hover:border-amber-400 group cursor-pointer transition-all hover:translate-x-1" onClick={() => openEditApt(a)}>
                      <div className="text-[0.65rem] font-bold text-amber-600 uppercase tracking-wider">{format(parseISO(a.tarih), "d MMM", { locale: tr })} · {a.saat}</div>
                      <div className="font-bold text-[0.82rem] text-[#1e293b] line-height-tight">{a.musteriAdi}</div>
                      <div className="text-[0.7rem] text-slate-500 font-medium">
                        {services.find(h => h.id.toString() === a.hizmetId.toString())?.ad}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="h-8 text-[0.7rem] font-bold flex-1 border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" onClick={(e) => { e.stopPropagation(); handleApprove(a); }}><Check className="w-3 h-3 mr-1" /> Onayla</Button>
                        <Button size="sm" variant="outline" className="h-8 text-[0.7rem] font-bold w-10 border-red-100 bg-red-50 text-red-600 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); handleReject(a); }}><X className="w-3 h-3" /></Button>
                      </div>
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modallar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-[0_20px_40px_-8px_rgba(0,0,0,0.18)] rounded-[20px] bg-white [&>button:last-child]:hidden">
          <div className="p-8">
            <div className="flex justify-between items-center mb-5">
              <DialogTitle className="text-[1.3rem] font-extrabold text-[#1e293b]">
                {currentApt.id ? "Randevu Düzenle" : "Randevu Oluştur"}
              </DialogTitle>
              <button 
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-[30px] h-[30px] bg-[#f1f5f9] text-[#64748b] rounded-full flex items-center justify-center hover:bg-[#e2e8f0] hover:text-[#1e293b] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSaveModal}>
              <div className="space-y-1.5">
                <Label className="block text-[0.75rem] font-bold text-[#64748b] uppercase tracking-[0.05em]">
                  ADI SOYADI
                </Label>
                <Input 
                  required 
                  placeholder="Hasta Adı ve Soyadı"
                  className="h-12 border-slate-200 rounded-xl focus-visible:ring-[#0a3d34] focus-visible:ring-offset-0"
                  value={currentApt.musteriAdi || ""} 
                  onChange={e => setCurrentApt(prev => ({...prev, musteriAdi: e.target.value}))} 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="block text-[0.75rem] font-bold text-[#64748b] uppercase tracking-[0.05em]">
                  İletişim Numarası
                </Label>
                <Input 
                  placeholder="+90 (___) ___ __ __"
                  className="h-12 border-slate-200 rounded-xl focus-visible:ring-[#0a3d34]"
                  value={currentApt.telefon || ""} 
                  onChange={e => setCurrentApt(prev => ({...prev, telefon: e.target.value}))} 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="block text-[0.75rem] font-bold text-[#64748b] uppercase tracking-[0.05em]">
                  Hizmet Tipi
                </Label>
                <Select value={currentApt.hizmetId?.toString() || "1"} onValueChange={v => setCurrentApt(prev => ({...prev, hizmetId: v}))}>
                  <SelectTrigger className="h-12 border-slate-200 rounded-xl focus:ring-[#0a3d34]">
                    <SelectValue/>
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(h => <SelectItem key={h.id} value={h.id.toString()}>{h.ad} ({h.fiyat} ₺)</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="block text-[0.75rem] font-bold text-[#64748b] uppercase tracking-[0.05em]">
                    Randevu Tarihi
                  </Label>
                  <DatePicker 
                    date={currentApt.tarih ? parseISO(currentApt.tarih) : undefined} 
                    setDate={(val) => setCurrentApt(prev => ({...prev, tarih: val ? format(val, "yyyy-MM-dd") : ""}))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="block text-[0.75rem] font-bold text-[#64748b] uppercase tracking-[0.05em]">
                    Seçilen Saat
                  </Label>
                  <Select value={currentApt.saat || "09:00"} onValueChange={v => setCurrentApt(prev => ({...prev, saat: v}))}>
                    <SelectTrigger className="h-12 border-slate-200 rounded-xl focus:ring-[#0a3d34]">
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom" align="start" className="max-h-[200px] overflow-y-auto">
                      {SHIFTS.filter(t => t !== "12:30" && t !== "13:00").map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="block text-[0.75rem] font-bold text-[#64748b] uppercase tracking-[0.05em]">
                  Notlar
                </Label>
                <Textarea 
                  placeholder="Hastaya dair tıbbi notlar veya hatırlatıcılar..."
                  className="min-h-[80px] border-slate-200 rounded-xl focus-visible:ring-[#0a3d34]"
                  value={currentApt.notlar || ""} 
                  onChange={e => setCurrentApt(prev => ({...prev, notlar: e.target.value}))} 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="block text-[0.75rem] font-bold text-[#64748b] uppercase tracking-[0.05em]">
                  Randevu Durumu
                </Label>
                <div className="flex gap-2.5 mt-1.5">
                  {[
                    { id: "onaylandi", label: "Onaylandı", activeBg: "bg-[#ecfdf5]", activeText: "text-[#065f46]", activeBorder: "border-[#10b981]" },
                    { id: "beklemede", label: "Beklemede", activeBg: "bg-[#fffbeb]", activeText: "text-[#92400e]", activeBorder: "border-[#f59e0b]" },
                    { id: "iptal", label: "İptal Edildi", activeBg: "bg-[#fef2f2]", activeText: "text-[#991b1b]", activeBorder: "border-[#ef4444]" }
                  ].map(d => (
                    <button 
                      key={d.id} 
                      type="button" 
                      onClick={() => setCurrentApt(prev => ({...prev, durum: d.id as any}))} 
                      className={`flex-1 py-[9px] text-[0.78rem] font-bold rounded-lg border-2 transition-all ${
                        currentApt.durum === d.id 
                          ? `${d.activeBg} ${d.activeText} ${d.activeBorder}` 
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2.5 mt-6">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-5 py-[11px] rounded-lg font-bold text-[0.85rem] border border-slate-200 bg-[#f8fafc] text-[#1e293b] hover:bg-[#e2e8f0] transition-all flex items-center justify-center"
                >
                  Kapat
                </button>
                {currentApt.id && (
                  <button 
                    type="button" 
                    onClick={() => setConfirmOpen(true)}
                    className="flex-1 px-5 py-[11px] rounded-lg font-bold text-[0.85rem] border border-[#fecaca] bg-[#fef2f2] text-[#ef4444] hover:bg-[#fee2e2] transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4"/>
                    Sil
                  </button>
                )}
                <button 
                  type="submit" 
                  className="flex-1 px-5 py-[11px] rounded-lg font-bold text-[0.85rem] bg-[#0a3d34] hover:bg-[#072b25] text-white shadow-[0_4px_14px_-3px_rgba(10,61,52,0.3)] transition-all flex items-center justify-center gap-2 hover:-translate-y-[2px]"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-[0_20px_40px_-8px_rgba(0,0,0,0.18)] rounded-[20px] bg-white [&>button:last-child]:hidden">
          <div className="p-[30px] text-center">
            <div className="w-16 h-16 rounded-full bg-[#fef2f2] flex items-center justify-center mx-auto mb-5 text-[#ef4444]">
              <Trash2 className="w-8 h-8" />
            </div>
            <DialogTitle className="text-[1.25rem] font-extrabold text-[#1e293b] mb-2.5">
              Randevuyu Silmek Üzeresiniz
            </DialogTitle>
            <DialogDescription className="text-[0.9rem] text-[#64748b] mb-6 leading-relaxed">
              Bu işlem kalıcıdır ve geri alınamaz. Randevuyu sistemden silmek istediğinize emin misiniz?
            </DialogDescription>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setConfirmOpen(false)}
                className="flex-1 px-5 py-[11px] rounded-lg font-bold text-[0.85rem] border border-slate-200 bg-[#f8fafc] text-[#1e293b] hover:bg-[#e2e8f0] transition-all flex items-center justify-center"
              >
                Vazgeç
              </button>
              <button 
                type="button" 
                onClick={handleDelete}
                className="flex-1 px-5 py-[11px] rounded-lg font-bold text-[0.85rem] bg-[#ef4444] hover:bg-[#dc2626] text-white transition-all flex items-center justify-center"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={sheetModalOpen} onOpenChange={setSheetModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-[0_20px_40px_-8px_rgba(0,0,0,0.18)] rounded-[20px] bg-white">
          <div className="p-8">
            <div className="flex justify-between items-center mb-5">
              <DialogTitle className="text-[1.3rem] font-extrabold text-[#1e293b]">
                Google Sheet Ayarları
              </DialogTitle>
              <button 
                type="button"
                onClick={() => setSheetModalOpen(false)}
                className="w-[30px] h-[30px] bg-[#f1f5f9] text-[#64748b] rounded-full flex items-center justify-center hover:bg-[#e2e8f0] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[0.75rem] font-bold text-[#64748b] uppercase tracking-wider">
                  Google Apps Script Web App URL
                </Label>
                <Input 
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="h-12 border-slate-200 rounded-xl focus:ring-[#0a3d34]"
                />
                <p className="text-[0.7rem] text-slate-500 leading-relaxed">
                  Randevularınızı Google Sheets'ten senkronize etmek için yayınladığınız Web App URL'sini buraya girin.
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSheetModalOpen(false)}
                  className="flex-1 h-12 rounded-xl font-bold"
                >
                  Vazgeç
                </Button>
                <Button 
                  onClick={handleSaveSheetUrl}
                  className="flex-1 h-12 rounded-xl font-bold bg-[#0a3d34] hover:bg-[#072b25]"
                >
                  Kaydet
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  function openEditApt(apt: Appointment) {
    setCurrentApt(apt);
    setModalOpen(true);
  }
}
