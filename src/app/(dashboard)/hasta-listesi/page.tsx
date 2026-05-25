"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDatabase, Appointment, PatientProfile, FaceTreatment, InventoryItem, Service, ConsentRecord, getCacheSync, CACHE_KEYS } from "@/hooks/use-database";
import { FaceMap } from "@/components/FaceMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Contact, Search, Package, Users, Clock, CheckCircle2, History, Pill, FileText, Box, Trash2, Plus, X, Edit2, Notebook as Emerald, Loader2, Shield, MessageCircle, CalendarDays, Syringe } from "lucide-react";
import { ConsentFormModal } from "@/components/ConsentFormModal";
import { WhatsAppSimulator } from "@/components/WhatsAppSimulator";
import { format, parseISO, isValid } from "date-fns";
import { tr } from "date-fns/locale/tr";
import { DatePicker } from "@/components/ui/date-picker";
import { InputDatePicker } from "@/components/ui/input-date-picker";
import { useAuth } from "@/hooks/use-auth";
import { UpgradeScreen } from "@/components/UpgradeScreen";
import { toast } from "sonner";

export default function PatientListPage() {
  const router = useRouter();
  const { profile, isLoading, checkAccess } = useAuth();

  const isLocked = !checkAccess("professional");
  const canUseInventory = checkAccess("advanced");
  
  const { getAppointments, getPatientProfiles, savePatientProfile, getInventory, saveInventoryItem, getServices, getConsentRecords } = useDatabase();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Omit<PatientProfile, "patient_name">>>({});
  const [inventory, setInventory] = useState<{ stock: Record<string, number>; items: InventoryItem[] }>({ stock: {}, items: [] });
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Patient Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "timeline" | "meds" | "notes" | "stock" | "consent" | "facemap">("info");
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [selectedPatientPhone, setSelectedPatientPhone] = useState("");

  // Consent
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentAppointment, setConsentAppointment] = useState<Appointment | null>(null);
  const [patientConsents, setPatientConsents] = useState<ConsentRecord[]>([]);
  const [consentDetailOpen, setConsentDetailOpen] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState<ConsentRecord | null>(null);

  // Material Modal
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [currentCart, setCurrentCart] = useState<{ id: string; name: string; unit: string; amount: number }[]>([]);
  const [selectedStockId, setSelectedStockId] = useState("");
  const [stockAmount, setStockAmount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [newMedName, setNewMedName] = useState("");
  const [newMedUsage, setNewMedUsage] = useState("");
  const [noteSikayet, setNoteSikayet] = useState("");
  const [noteHikaye, setNoteHikaye] = useState("");
  const [noteMuayene, setNoteMuayene] = useState("");
  
  // Patient Info Fields
  const [pPhone, setPPhone] = useState("");
  const [pTC, setPTC] = useState("");
  const [pBirthDate, setPBirthDate] = useState("");
  const [pAddress, setPAddress] = useState("");

  // Note Editing
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Load from cache first
    const cachedApts = getCacheSync<Appointment[]>(CACHE_KEYS.APPOINTMENTS);
    if (cachedApts) setAppointments(cachedApts);
    
    const cachedProfs = getCacheSync<Record<string, Omit<PatientProfile, "patient_name">>>(CACHE_KEYS.PROFILES);
    if (cachedProfs) setProfiles(cachedProfs);
    
    const cachedInv = getCacheSync<{ stock: Record<string, number>; items: InventoryItem[] }>(CACHE_KEYS.INVENTORY);
    if (cachedInv) setInventory(cachedInv);

    const cachedSvc = getCacheSync<Service[]>(CACHE_KEYS.SERVICES);
    if (cachedSvc) setServices(cachedSvc);

    setIsMounted(true);
    loadData();
  }, [getAppointments, getPatientProfiles, getInventory, getServices]);

  const [filterType, setFilterType] = useState<"today" | "all">("today");

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, profs, inv, svcs] = await Promise.all([
        getAppointments(),
        getPatientProfiles(),
        getInventory(),
        getServices()
      ]);
      setAppointments(list);
      setProfiles(profs);
      setInventory(inv);
      if (svcs) setServices(svcs);
    } catch (e) {
      console.error("Data load failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const filteredPatients = useMemo(() => {
    return appointments.filter(a => {
      const isToday = a.tarih === todayStr;
      const isActive = a.durum === "onaylandi" || a.durum === "beklemede";
      const search = searchTerm.toLocaleUpperCase("tr-TR");
      const musteriAdi = a.musteriAdi || "";
      const telefon = a.telefon || "";
      const matchesSearch = musteriAdi.toLocaleUpperCase("tr-TR").includes(search) || telefon.includes(searchTerm);
      
      if (filterType === "today") {
        return isToday && isActive && matchesSearch;
      } else {
        // "Tümü" seçildiğinde durumu ne olursa olsun (geçmiş/gelecek) arama eşleşiyorsa göster
        return matchesSearch;
      }
    }).sort((a,b) => {
      const dateA = a.tarih || "";
      const dateB = b.tarih || "";
      const timeA = a.saat || "";
      const timeB = b.saat || "";
      const dateCompare = dateB.localeCompare(dateA);
      if (dateCompare !== 0) return dateCompare;
      return timeA.localeCompare(timeB);
    });
  }, [appointments, todayStr, searchTerm, filterType]);

  const stats = useMemo(() => ({
    total: filteredPatients.length,
    pending: filteredPatients.filter(a => a.durum === "beklemede").length,
    done: filteredPatients.filter(a => a.durum === "onaylandi").length
  }), [filteredPatients]);

  const openProfile = (rawName: string, phone: string) => {
    const name = rawName.toLocaleUpperCase("tr-TR");
    setSelectedPatientName(name);
    setSelectedPatientPhone(phone);
    const prof = profiles[name] || { notes_list: [], meds: [], stock_history: [] };
    
    // Load demographic fields
    setPPhone(prof.phone || phone || "");
    setPTC(prof.tc_no || "");
    setPBirthDate(prof.birth_date || "");
    setPAddress(prof.address || "");

    setNoteSikayet("");
    setNoteHikaye("");
    setNoteMuayene("");
    setModalOpen(true);
    setActiveTab("info");

    // Load consent records for this patient
    getConsentRecords(name).then(records => setPatientConsents(records)).catch(() => {});
  };

  const openConsent = (apt: Appointment) => {
    const name = apt.musteriAdi.toLocaleUpperCase("tr-TR");
    setSelectedPatientName(name);
    setSelectedPatientPhone(apt.telefon || "");
    setConsentAppointment(apt);
    setConsentModalOpen(true);
  };

  const openMaterial = (name: string) => {
    if (!canUseInventory) {
      setUpgradeModalOpen(true);
      return;
    }
    setSelectedPatientName(name);
    setCurrentCart([]);
    setSelectedStockId("");
    setStockAmount(1);
    setMaterialModalOpen(true);
  };

  const handleAddMed = async () => {
    if (!newMedName) return;
    const current = profiles[selectedPatientName] || { notes_list: [], meds: [], stock_history: [] };
    const mList = [...(current.meds || [])];
    mList.push({ name: newMedName, usage: newMedUsage, date: format(new Date(), "dd.MM.yyyy") });
    
    const updated = { ...current, meds: mList };
    setProfiles(prev => ({ ...prev, [selectedPatientName]: updated }));
    setNewMedName(""); setNewMedUsage("");

    savePatientProfile(selectedPatientName, updated).catch(err => console.error("Background save err:", err));
  };

  const handleUpdatePatientInfo = async () => {
    setIsSubmitting(true);
    const current = profiles[selectedPatientName] || { notes_list: [], meds: [], stock_history: [] };
    const updated = { 
      ...current, 
      phone: pPhone, 
      tc_no: pTC, 
      birth_date: pBirthDate, 
      address: pAddress 
    };
    
    try {
      setProfiles(prev => ({ ...prev, [selectedPatientName]: updated }));
      await savePatientProfile(selectedPatientName, updated);
      toast.success("Hasta bilgileri başarıyla güncellendi.");
    } catch (err: any) {
      console.error("Update info failed:", err);
      toast.error(`Güncelleme başarısız: ${err.message || "Bilinmeyen bir hata oluştu"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteSikayet && !noteHikaye && !noteMuayene) return;
    const content = `Şikayet: ${noteSikayet}\nHikaye: ${noteHikaye}\nMuayene: ${noteMuayene}`;
    const current = profiles[selectedPatientName] || { notes_list: [], meds: [], stock_history: [] };
    const nList = [...(current.notes_list || [])];
    nList.push({ date: format(new Date(), "dd.MM.yyyy HH:mm"), content });
    
    const updated = { ...current, notes_list: nList };
    setProfiles(prev => ({ ...prev, [selectedPatientName]: updated }));
    setNoteSikayet(""); setNoteHikaye(""); setNoteMuayene("");

    savePatientProfile(selectedPatientName, updated).catch(err => console.error("Background save err:", err));
  };

  const handleUpdateNote = async () => {
    if (editingNoteIndex === null || !editingNoteContent) return;
    const current = profiles[selectedPatientName] || { notes_list: [], meds: [], stock_history: [] };
    const nList = [...(current.notes_list || [])];
    nList[editingNoteIndex].content = editingNoteContent;
    
    const updated = { ...current, notes_list: nList };
    setProfiles(prev => ({ ...prev, [selectedPatientName]: updated }));
    setEditingNoteIndex(null);
    setEditingNoteContent("");

    savePatientProfile(selectedPatientName, updated).catch(err => console.error("Background save err:", err));
  };

  const startEditingNote = (realIndex: number, content: string) => {
    setEditingNoteIndex(realIndex);
    setEditingNoteContent(content);
  };

  const addToCart = () => {
    if (!selectedStockId) return;
    const item = inventory.items.find(i => i.id === selectedStockId);
    if (!item) return;

    const currentStock = inventory.stock[selectedStockId] || 0;
    if (stockAmount > currentStock) {
      alert(`Stokta yeterli miktar yok. Mevcut: ${currentStock}`);
      return;
    }

    const existing = currentCart.find(c => c.id === selectedStockId);
    if (existing) {
      setCurrentCart(currentCart.map(c => c.id === selectedStockId ? { ...c, amount: c.amount + stockAmount } : c));
    } else {
      setCurrentCart([...currentCart, { id: item.id, name: item.ad, unit: item.birim, amount: stockAmount }]);
    }
    setStockAmount(1);
  };

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    let finalCart = [...currentCart];

    // Try to add un-added selection if exists
    if (selectedStockId && stockAmount > 0) {
      const item = inventory.items.find(i => i.id === selectedStockId);
      if (item) {
        const currentStock = inventory.stock[selectedStockId] || 0;
        if (stockAmount > currentStock) {
           alert(`Stokta yeterli miktar yok. Mevcut: ${currentStock}`);
           return;
        }
        const existing = finalCart.find(c => c.id === selectedStockId);
        if (existing) {
          finalCart = finalCart.map(c => c.id === selectedStockId ? { ...c, amount: c.amount + stockAmount } : c);
        } else {
          finalCart.push({ id: item.id, name: item.ad, unit: item.birim, amount: stockAmount });
        }
        setSelectedStockId("");
        setStockAmount(1);
      }
    }

    if (finalCart.length === 0) return;

    setIsSubmitting(true);
    
    // 1. Optimistic Preparation
    const current = profiles[selectedPatientName] || { notes_list: [], meds: [], stock_history: [] };
    const history = [...(current.stock_history || [])];
    const detailStr = finalCart.map(c => `${c.amount} ${c.unit} ${c.name}`).join(", ");
    history.push({ date: format(new Date(), "dd.MM.yyyy HH:mm"), text: detailStr });

    const updatedProf = { ...current, stock_history: history };
    
    const newStockMap = { ...inventory.stock };
    for (const c of finalCart) {
      newStockMap[c.id] = (newStockMap[c.id] || 0) - c.amount;
    }

    // 2. Apply Optimistic Update Immediately
    setInventory(prev => ({ ...prev, stock: newStockMap }));
    setProfiles(prev => ({ ...prev, [selectedPatientName]: updatedProf }));
    setMaterialModalOpen(false);
    setCurrentCart([]);

    // 3. Background Saves
    try {
      await savePatientProfile(selectedPatientName, updatedProf);

      // Deduct from Inventory sequentially to prevent cache or network clobber
      // BUG-10 FIX: newStockMap'teki doğru değeri kullan (closure'daki eski inventory.stock yerine)
      for (const c of finalCart) {
        const item = inventory.items.find(i => i.id === c.id);
        if (item) {
          const newQty = Math.max(0, newStockMap[c.id] ?? 0);
          await saveInventoryItem(item, newQty);
        }
      }
    } catch(err) {
      console.error("Background save error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selProfile = profiles[selectedPatientName] || { notes_list: [], meds: [], stock_history: [] };
  const hstAppointments = appointments
    .filter(a => (a.musteriAdi || "") === selectedPatientName)
    .sort((a,b) => (b.tarih || "").localeCompare(a.tarih || ""));

  if (isLoading || !isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isLocked) {
    return (
      <UpgradeScreen 
        title="Hastalarınızı Tek Ekrandan Yönetin 👥" 
        description="Hasta kayıtları, ilaç takibi, muayene notları ve stok geçmişini tek bir panelden yönetin."
        requiredPlan="Professional"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col md:flex-row justify-between items-center bg-white/88 backdrop-blur-[20px] p-4 md:p-[14px_24px] rounded-[20px] border border-slate-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.07)] sticky top-3 z-[40] gap-4">
        <div className="flex flex-col gap-[2px] text-center md:text-left w-full md:w-auto">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#0a3d34] opacity-80 mb-[1px]">{(profile?.clinic_name || "Klinik").toUpperCase()}</span>
          <div className="flex items-center justify-center md:justify-start gap-3">
             <h1 className="text-[1.25rem] font-extrabold text-[#1e293b]">Hasta Listesi</h1>
             {loading && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
          </div>
          <div className="text-[0.78rem] font-medium text-[#64748b]">
            {format(new Date(), "d MMMM yyyy, eeee", { locale: tr })}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
           <div className="flex bg-slate-100 p-1 rounded-xl h-11 shrink-0 items-center">
              <button 
                onClick={() => setFilterType("today")} 
                className={`px-4 h-full text-sm font-bold rounded-lg transition-all ${filterType === "today" ? "bg-white shadow-sm text-emerald-700" : "text-slate-500"}`}
              >
                Bugün
              </button>
              <button 
                onClick={() => setFilterType("all")} 
                className={`px-4 h-full text-sm font-bold rounded-lg transition-all ${filterType === "all" ? "bg-white shadow-sm text-emerald-700" : "text-slate-500"}`}
              >
                Tümü
              </button>
           </div>
           <div className="relative flex-1 md:w-[300px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <Input 
                placeholder="Hasta adı veya no ara..." 
                className="pl-9 h-11 bg-slate-50 border-slate-200 focus-visible:ring-[#0a3d34] rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>
      </header>


      <div className="block md:hidden space-y-3 pb-28">
        {filteredPatients.length === 0 && !loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 italic">Kayıt bulunamadı.</div>
        ) : filteredPatients.map(p => {
          const h = p.hizmetId ? services.find(x => x.id.toString() === p.hizmetId.toString()) : null;
          return (
            <div key={p.id} className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 ${p.durum === 'beklemede' ? 'border-amber-200 bg-amber-50/10' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex flex-col flex-1 min-w-0 mr-3">
                  <span className="font-extrabold text-[#0a3d34] text-lg line-clamp-2 break-words" onClick={() => openProfile(p.musteriAdi, p.telefon || "")}>{p.musteriAdi}</span>
                  <span className="text-sm font-medium text-slate-500">{p.telefon || "Telefon Yok"}</span>
                </div>
                <span className="bg-slate-100 text-[#1e293b] px-3 py-1 rounded-lg text-[0.8rem] font-black shrink-0 h-fit mt-1">{p.saat}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-[0.7rem] font-bold">{h?.ad}</span>
                <div className="flex gap-2 items-center">
                  {p.whatsapp_status === 'declined' && (
                    <span className="text-[0.65rem] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100 flex items-center gap-1"><X className="w-3 h-3" /> Reddedildi</span>
                  )}
                  {p.whatsapp_status === 'sent' && (
                    <span className="text-[0.65rem] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Bekleniyor</span>
                  )}
                  {p.whatsapp_status === 'confirmed' && (
                    <span className="text-[0.65rem] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Onaylı</span>
                  )}
                  <Button variant="outline" size="sm" className="h-9 px-3 text-xs bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all rounded-xl border-indigo-600" onClick={() => openConsent(p)}>
                    <Shield className="w-3.5 h-3.5 mr-1" /> Onam
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 px-3 text-xs bg-[#0a3d34] text-white font-bold hover:bg-[#072b25] transition-all rounded-xl" onClick={() => openMaterial(p.musteriAdi)}>
                    <Package className="w-3.5 h-3.5 mr-1" /> Malzeme
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block bg-white rounded-[20px] shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="overflow-x-auto w-full">
        <Table className="min-w-[800px] w-full">
          <TableHeader className="bg-gradient-to-r from-slate-700 to-slate-800 hover:bg-transparent">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-white font-bold uppercase tracking-wider text-[0.72rem] py-4 text-center">Hasta Adı Soyadı</TableHead>
              <TableHead className="text-white font-bold uppercase tracking-wider text-[0.72rem] py-4 text-center">İletişim Numarası</TableHead>
              <TableHead className="text-white font-bold uppercase tracking-wider text-[0.72rem] py-4 text-center">Hizmet Türü</TableHead>
              <TableHead className="text-white font-bold uppercase tracking-wider text-[0.72rem] py-4 text-center">Saat</TableHead>
              <TableHead className="text-white font-bold uppercase tracking-wider text-[0.72rem] py-4 text-center">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 && !loading ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500">Kayıt bulunamadı.</TableCell></TableRow>
            ) : filteredPatients.map(p => {
              const h = p.hizmetId ? services.find(x => x.id.toString() === p.hizmetId.toString()) : null;
              return (
                <TableRow key={p.id} className={`hover:bg-emerald-50/30 transition-colors ${p.durum === 'beklemede' ? 'bg-amber-50/20' : ''}`}>
                  <TableCell className="text-center py-4">
                     <span className="font-bold text-[#0a3d34] cursor-pointer hover:underline underline-offset-4" onClick={() => openProfile(p.musteriAdi, p.telefon || "")}>
                        {p.musteriAdi}
                     </span>
                  </TableCell>
                  <TableCell className="text-center py-4 font-medium text-slate-600">{p.telefon || "-"}</TableCell>
                  <TableCell className="text-center py-4">
                     <div className="flex flex-col items-center gap-1.5">
                       <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-[0.7rem] font-bold">
                         {h?.ad}
                       </span>
                       {p.whatsapp_status === 'declined' && (
                         <span className="text-[0.6rem] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 flex items-center gap-1"><X className="w-3 h-3" /> Reddedildi</span>
                       )}
                       {p.whatsapp_status === 'sent' && (
                         <span className="text-[0.6rem] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Bekleniyor</span>
                       )}
                       {p.whatsapp_status === 'confirmed' && (
                         <span className="text-[0.6rem] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> WP Onaylı</span>
                       )}
                     </div>
                  </TableCell>
                  <TableCell className="text-center py-4 font-extrabold text-[#111827]">{p.saat}</TableCell>
                  <TableCell className="text-center py-4">
                     <div className="flex items-center justify-center gap-2">
                       <Button variant="outline" size="sm" className="h-8 text-xs bg-indigo-50 border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-none" onClick={() => openConsent(p)}>
                         <Shield className="w-3.5 h-3.5 mr-1" /> Onam
                       </Button>
                       <Button variant="outline" size="sm" className="h-8 text-xs bg-slate-50 border-slate-200 text-[#0a3d34] font-bold hover:bg-[#0a3d34] hover:text-white transition-all shadow-none" onClick={() => openMaterial(p.musteriAdi)}>
                         <Package className="w-3.5 h-3.5 mr-1" /> Malzeme
                       </Button>
                     </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </div>
      </div>
      <WhatsAppSimulator />

      {/* Patient Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className={`${activeTab === 'facemap' ? 'sm:max-w-[1050px] lg:ml-[140px]' : 'sm:max-w-[850px]'} p-0 overflow-hidden bg-white border-slate-200 flex flex-col md:flex-row shadow-2xl transition-all`}>
          
          {/* Left Sidebar */}
          <div className="w-full md:w-[280px] bg-slate-50/50 border-r border-slate-200/60 p-6 flex flex-col items-center md:items-start shrink-0">
             
             {/* Avatar / Profile Header */}
             <div className="flex items-center w-full gap-4 mb-10">
               <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0c4a40] to-[#177567] text-white flex items-center justify-center text-2xl font-extrabold shadow-lg shadow-[#0a3d34]/20 ring-4 ring-[#0a3d34]/5 shrink-0">
                 {selectedPatientName ? selectedPatientName.substring(0, 2).toUpperCase() : "HA"}
               </div>
               <div className="flex flex-col gap-1 min-w-0">
                 <DialogTitle className="text-xl font-extrabold text-[#1e293b] leading-tight truncate">{selectedPatientName}</DialogTitle>
                 <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-1">
                   <Contact className="w-4 h-4 text-[#0a3d34] opacity-70"/> {selectedPatientPhone || "Telefon Yok"}
                 </span>
               </div>
             </div>

             {/* Navigation */}
             <div className="flex flex-row md:flex-col gap-2 w-full overflow-x-auto md:overflow-visible pb-2 md:pb-0 no-scrollbar">
                {[
                  { id: 'info', label: 'Hasta Bilgileri', icon: Users, color: 'emerald' },
                  { id: 'consent', label: 'Onam Formları', icon: Shield, color: 'indigo' },
                  { id: 'timeline', label: 'Geçmiş İşlemler', icon: History, color: 'blue' },
                  { id: 'facemap', label: 'Yüz Haritası', icon: Syringe, color: 'rose' },
                  { id: 'meds', label: 'İlaçlar / Reçete', icon: Pill, color: 'rose' },
                  { id: 'notes', label: 'Muayene / Notlar', icon: Emerald, color: 'emerald' },
                  { id: 'stock', label: 'Stok Geçmişi', icon: Box, color: 'amber' },
                  { id: 'new-appointment', label: 'Yeni Randevu', icon: CalendarDays, color: 'emerald' }
                ].map(tab => {
                  const isActive = activeTab === tab.id;
                  const colors: Record<string, string> = {
                    blue: isActive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-slate-500 hover:bg-blue-50/50 hover:text-blue-600',
                    rose: isActive ? 'bg-rose-50 text-rose-700 border-rose-200' : 'text-slate-500 hover:bg-rose-50/50 hover:text-rose-600',
                    emerald: isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'text-slate-500 hover:bg-emerald-50/50 hover:text-emerald-600',
                    amber: isActive ? 'bg-amber-50 text-amber-700 border-amber-200' : 'text-slate-500 hover:bg-amber-50/50 hover:text-amber-600',
                    indigo: isActive ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'text-slate-500 hover:bg-indigo-50/50 hover:text-indigo-600',
                  };
                  const iconColors: Record<string, string> = {
                    blue: isActive ? 'text-blue-600' : 'text-blue-400 group-hover:text-blue-600',
                    rose: isActive ? 'text-rose-600' : 'text-rose-400 group-hover:text-rose-600',
                    emerald: isActive ? 'text-emerald-600' : 'text-emerald-400 group-hover:text-emerald-600',
                    amber: isActive ? 'text-amber-600' : 'text-amber-400 group-hover:text-amber-600',
                    indigo: isActive ? 'text-indigo-600' : 'text-indigo-400 group-hover:text-indigo-600',
                  };

                  return (
                    <button 
                      key={tab.id}
                      className={`flex items-center justify-center md:justify-start gap-3 px-4 py-4 rounded-2xl text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal border group
                        ${colors[tab.color] || ''} ${isActive ? 'shadow-sm shadow-black/5' : 'border-transparent'}
                      `}
                      onClick={() => {
                        if (tab.id === 'new-appointment') {
                          router.push(`/takvim?newApt=true&name=${encodeURIComponent(selectedPatientName)}&phone=${encodeURIComponent(pPhone || selectedPatientPhone)}`);
                        } else {
                          setActiveTab(tab.id as any);
                        }
                      }}
                    >
                      <tab.icon className={`w-5 h-5 transition-colors ${iconColors[tab.color] || ''}`} /> {tab.label}
                    </button>
                  );
                })}
             </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 bg-white flex flex-col h-[550px] relative">
             <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 shrink-0">
               <h3 className="text-lg font-extrabold text-[#1e293b]">
                 {activeTab === 'info' && 'Hasta Bilgileri'}
                 {activeTab === 'consent' && 'Onam Formları'}
                 {activeTab === 'timeline' && 'Geçmiş İşlemler'}
                 {activeTab === 'facemap' && 'Yüz Haritası — Botoks & Dolgu & Mezoterapi'}
                 {activeTab === 'meds' && 'İlaçlar ve Reçete'}
                 {activeTab === 'notes' && 'Muayene ve Notlar'}
                 {activeTab === 'stock' && 'Stok Geçmişi'}
               </h3>
             </div>

             <div className="flex-1 p-8 overflow-y-auto no-scrollbar bg-slate-50/30">
               {activeTab === 'info' && (
                 <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                     <div className="space-y-2">
                       <Label className="text-xs font-bold text-slate-500">Adı Soyadı</Label>
                       <Input value={selectedPatientName} disabled className="bg-slate-50 border-slate-200 font-bold text-[#0a3d34]" />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-xs font-bold text-slate-500">Telefon Numarası</Label>
                       <Input value={pPhone} onChange={e => setPPhone(e.target.value)} className="bg-white border-slate-200" placeholder="05xx xxx xx xx" />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-xs font-bold text-slate-500">TC Kimlik No</Label>
                       <Input value={pTC} onChange={e => setPTC(e.target.value)} maxLength={11} className="bg-white border-slate-200" placeholder="11 haneli TC No" />
                     </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500">Doğum Tarihi</Label>
                        <InputDatePicker 
                          date={pBirthDate && isValid(parseISO(pBirthDate)) ? parseISO(pBirthDate) : undefined} 
                          setDate={(val) => setPBirthDate(val ? format(val, "yyyy-MM-dd") : "")}
                          placeholder="GG.AA.YYYY"
                        />
                      </div>
                     <div className="md:col-span-2 space-y-2">
                       <Label className="text-xs font-bold text-slate-500">Adres Bilgisi</Label>
                       <Textarea value={pAddress} onChange={e => setPAddress(e.target.value)} className="bg-white border-slate-200 min-h-[80px] resize-none" placeholder="Hastanın açık adresi..." />
                     </div>
                   </div>
                    <Button 
                      onClick={handleUpdatePatientInfo} 
                      disabled={isSubmitting}
                      className="w-full bg-[#0a3d34] hover:bg-[#072b25] h-11 font-bold shadow-lg shadow-[#0a3d34]/20 rounded-xl"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {isSubmitting ? "Güncelleniyor..." : "Bilgileri Güncelle"}
                    </Button>
                 </div>
               )}

               {activeTab === 'consent' && (
                 <div className="space-y-4">
                   {patientConsents.length === 0 ? (
                     <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-3">
                       <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-400">
                         <Shield className="w-7 h-7" />
                       </div>
                       <span className="italic text-sm text-slate-400 font-medium">Bu hastaya ait onam formu kaydı bulunmuyor.</span>
                     </div>
                   ) : patientConsents.map((c: any, i: number) => (
                     <div key={c.id || i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer" onClick={() => { setSelectedConsent(c); setConsentDetailOpen(true); }}>
                       <div className="flex items-start justify-between mb-3">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100">
                             <Shield className="w-5 h-5" />
                           </div>
                           <div>
                             <div className="text-[0.85rem] font-extrabold text-[#1e293b]">Aydınlatılmış Onam Formu</div>
                             <div className="text-[0.7rem] font-bold text-slate-400 mt-0.5">
                               {c.appointment_date || ''} {c.appointment_time ? `· ${c.appointment_time}` : ''}
                             </div>
                           </div>
                         </div>
                         <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[0.65rem] font-bold border border-emerald-100">
                           <CheckCircle2 className="w-3 h-3" />
                           İmzalandı
                         </div>
                       </div>
                       {c.signature_data && (
                         <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                           <img src={c.signature_data} alt="İmza" className="h-12 w-auto opacity-70" />
                         </div>
                       )}
                       <div className="text-[0.65rem] text-slate-400 font-medium mt-3">
                         {c.signed_at ? format(new Date(c.signed_at), "d MMMM yyyy, HH:mm", { locale: tr }) : ''}
                       </div>
                     </div>
                   ))}
                 </div>
               )}

               {activeTab === 'timeline' && (
                 <div className="space-y-6">
                    {hstAppointments.length === 0 ? <div className="text-center py-10 italic text-slate-400 bg-white border border-slate-100 rounded-xl shadow-sm">Henüz işlem geçmişi bulunamadı.</div> : (
                      <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                         {hstAppointments.map(a => {
                           const h = a.hizmetId ? services.find(x => x.id.toString() === a.hizmetId.toString()) : null;
                           const isStatusDone = a.durum === 'onaylandi';
                           const dateFaceTreatments = (selProfile.face_treatments || []).filter(ft => ft.date.split(' ')[0] === (a.tarih ? format(new Date(a.tarih), 'dd.MM.yyyy') : ''));
                           return (
                             <div key={a.id} className="relative pl-6">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white ${isStatusDone ? 'bg-[#0a3d34]' : 'bg-amber-400'}`} />
                                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                   <div className="flex items-center justify-between mb-2">
                                      <div className="text-[0.7rem] font-bold text-slate-400 tracking-wide uppercase flex items-center gap-1.5">
                                        <Clock className="w-3 h-3 text-blue-500"/> {a.tarih} · {a.saat}
                                      </div>
                                      <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${isStatusDone ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                        {isStatusDone ? 'Tamamlandı' : 'Beklemede'}
                                      </span>
                                   </div>
                                   <div className="text-[0.95rem] font-bold text-[#111827]">{h?.ad}</div>
                                   {a.notlar && (
                                     <div className="mt-3 bg-slate-50 text-slate-600 text-[0.8rem] p-3 rounded-xl border border-slate-100">
                                       <span className="font-bold text-slate-400 text-[0.65rem] block uppercase mb-1">Not:</span>
                                       {a.notlar}
                                     </div>
                                   )}
                                   {dateFaceTreatments.length > 0 && (
                                     <button
                                       onClick={() => setActiveTab('facemap')}
                                       className="mt-3 flex items-center gap-1.5 text-[0.7rem] font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-100 transition-colors"
                                     >
                                       <Syringe className="w-3 h-3" /> Yüz Haritasını Gör ({dateFaceTreatments.length} işlem)
                                     </button>
                                   )}
                                </div>
                             </div>
                           )
                         })}
                      </div>
                    )}
                 </div>
               )}

               {activeTab === 'facemap' && (
                 <FaceMap
                   gender={selProfile.face_gender || 'female'}
                   treatments={selProfile.face_treatments || []}
                   onGenderChange={async (g) => {
                     const current = profiles[selectedPatientName] || { notes_list: [], meds: [], stock_history: [] };
                     const updated = { ...current, face_gender: g };
                     setProfiles(prev => ({ ...prev, [selectedPatientName]: updated }));
                     savePatientProfile(selectedPatientName, updated).catch(err => console.error('Gender save err:', err));
                   }}
                   onAddTreatment={async (t) => {
                     const current = profiles[selectedPatientName] || { notes_list: [], meds: [], stock_history: [] };
                     const list = [...(current.face_treatments || []), t];
                     const updated = { ...current, face_treatments: list };
                     setProfiles(prev => ({ ...prev, [selectedPatientName]: updated }));
                     savePatientProfile(selectedPatientName, updated).catch(err => console.error('Face treatment save err:', err));
                     toast.success('Tedavi kaydedildi.');
                   }}
                   onUpdateTreatment={async (t) => {
                     const current = profiles[selectedPatientName] || { notes_list: [], meds: [], stock_history: [] };
                     const list = (current.face_treatments || []).map(ft => ft.id === t.id ? t : ft);
                     const updated = { ...current, face_treatments: list };
                     setProfiles(prev => ({ ...prev, [selectedPatientName]: updated }));
                     savePatientProfile(selectedPatientName, updated).catch(err => console.error('Face treatment update err:', err));
                   }}
                   onDeleteTreatment={async (id) => {
                     const current = profiles[selectedPatientName] || { notes_list: [], meds: [], stock_history: [] };
                     const list = (current.face_treatments || []).filter(ft => ft.id !== id);
                     const updated = { ...current, face_treatments: list };
                     setProfiles(prev => ({ ...prev, [selectedPatientName]: updated }));
                     savePatientProfile(selectedPatientName, updated).catch(err => console.error('Face treatment delete err:', err));
                     toast.success('Tedavi silindi.');
                   }}
                 />
               )}

               {activeTab === 'meds' && (
                 <div className="space-y-6">
                    <div className="grid grid-cols-12 gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="col-span-12 md:col-span-5 space-y-1.5">
                        <Label className="text-[0.65rem] font-extrabold uppercase text-slate-500 ml-1">İlaç Adı</Label>
                        <Input placeholder="Örn: Roaccutane 20mg" value={newMedName} onChange={e => setNewMedName(e.target.value)} className="bg-slate-50 border-slate-200 focus-visible:ring-[#0a3d34] h-10" />
                      </div>
                      <div className="col-span-12 md:col-span-5 space-y-1.5">
                        <Label className="text-[0.65rem] font-extrabold uppercase text-slate-500 ml-1">Kullanım Şekli</Label>
                        <Input placeholder="Örn: Günde 1 tok" value={newMedUsage} onChange={e => setNewMedUsage(e.target.value)} className="bg-slate-50 border-slate-200 focus-visible:ring-[#0a3d34] h-10" />
                      </div>
                      <div className="col-span-12 md:col-span-2 flex items-end">
                        <Button className="w-full bg-[#0a3d34] hover:bg-[#072b25] h-10 shadow-md shadow-[#0a3d34]/20" onClick={handleAddMed} disabled={!newMedName}>
                          <Plus className="w-4 h-4"/>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {(selProfile.meds || []).slice().reverse().map((m: any, i: number) => (
                        <div key={i} className="flex gap-4 items-center bg-white p-4 border border-slate-100 rounded-2xl shadow-sm hover:border-slate-200 transition-colors">
                           <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                             <Pill className="w-5 h-5"/>
                           </div>
                           <div className="flex flex-col flex-1">
                              <span className="font-extrabold text-[0.95rem] text-[#111827]">{m.name}</span>
                              <span className="text-[0.75rem] font-medium text-slate-500">{m.usage}</span>
                           </div>
                           <span className="text-[0.65rem] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 shrink-0">{m.date}</span>
                        </div>
                      ))}
                      {(!selProfile.meds || selProfile.meds.length === 0) && <div className="text-center py-8 italic text-slate-400 bg-white border border-slate-100 rounded-xl">Kayıtlı reçete yok.</div>}
                    </div>
                 </div>
               )}

               {activeTab === 'notes' && (
                 <div className="space-y-6">
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                      <div className="space-y-1.5">
                        <Label className="text-[0.65rem] font-extrabold uppercase text-slate-500 ml-1 tracking-wide">Şikayet</Label>
                        <Textarea placeholder="Hastanın şikayetini buraya yazın..." value={noteSikayet} onChange={e => setNoteSikayet(e.target.value)} className="min-h-[80px] bg-slate-50 border-slate-200 focus-visible:ring-[#0a3d34] resize-none" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[0.65rem] font-extrabold uppercase text-slate-500 ml-1 tracking-wide">Hikaye & Özgeçmiş</Label>
                        <Textarea placeholder="Hastalık öyküsünü yazın..." value={noteHikaye} onChange={e => setNoteHikaye(e.target.value)} className="min-h-[80px] bg-slate-50 border-slate-200 focus-visible:ring-[#0a3d34] resize-none" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[0.65rem] font-extrabold uppercase text-slate-500 ml-1 tracking-wide">Muayene Bulguları & Notlar</Label>
                        <Textarea placeholder="Muayene sonuçlarını yazın..." value={noteMuayene} onChange={e => setNoteMuayene(e.target.value)} className="min-h-[80px] bg-slate-50 border-slate-200 focus-visible:ring-[#0a3d34] resize-none" />
                      </div>
                      <div className="pt-2">
                        <Button className="w-full bg-[#0a3d34] hover:bg-[#072b25] h-11 font-bold shadow-md shadow-[#0a3d34]/20" onClick={handleAddNote} disabled={!noteSikayet && !noteHikaye && !noteMuayene}>
                           <CheckCircle2 className="w-4 h-4 mr-2"/> Notu Kaydet
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                       <h4 className="text-[0.7rem] font-extrabold uppercase text-slate-400 tracking-wider mb-2 ml-1">Geçmiş Notlar</h4>
                       {(selProfile.notes_list || []).slice().reverse().map((n: any, i: number) => {
                          const originalArray = selProfile.notes_list || [];
                          const realIndex = originalArray.length - 1 - i;
                          const isEditing = editingNoteIndex === realIndex;
                          return (
                            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative hover:border-slate-200 transition-colors">
                               <div className="absolute top-0 right-6 -translate-y-1/2 flex items-center gap-2">
                                 <button onClick={() => isEditing ? setEditingNoteIndex(null) : startEditingNote(realIndex, n.content)} className={`bg-white text-slate-500 hover:text-[#0a3d34] hover:border-[#0a3d34] text-[0.65rem] font-bold px-2.5 py-1 rounded-full border ${isEditing ? 'border-[#0a3d34] text-[#0a3d34] shadow-sm' : 'border-slate-200 shadow-sm'} flex items-center gap-1.5 transition-colors cursor-pointer`}>
                                     {isEditing ? <X className="w-3 h-3"/> : <Edit2 className="w-3 h-3" />}
                                     {isEditing ? 'İptal' : 'Düzenle'}
                                 </button>
                                 <div className="bg-emerald-50 text-emerald-600 text-[0.65rem] font-bold px-3 py-1 rounded-full border border-emerald-100 shadow-sm flex items-center gap-1.5">
                                   <Emerald className="w-3 h-3"/> {n.date}
                                 </div>
                               </div>
                               
                               {isEditing ? (
                                 <div className="mt-4 space-y-3">
                                    <Textarea value={editingNoteContent} onChange={e => setEditingNoteContent(e.target.value)} className="min-h-[100px] bg-slate-50 border-slate-200 focus-visible:ring-[#0a3d34] text-[0.85rem]" />
                                    <div className="flex justify-end gap-2">
                                       <Button className="h-8 text-xs bg-[#0a3d34] hover:bg-[#072b25]" onClick={handleUpdateNote}>Kaydet</Button>
                                    </div>
                                 </div>
                               ) : (
                                 <div className="text-[0.85rem] text-slate-700 whitespace-pre-wrap leading-relaxed mt-2">{n.content}</div>
                               )}
                            </div>
                          )
                       })}
                       {(!selProfile.notes_list || selProfile.notes_list.length === 0) && <div className="text-center py-6 italic text-slate-400">Geçmiş not kaydı bulunmuyor.</div>}
                    </div>
                 </div>
               )}

               {activeTab === 'stock' && (
                 !canUseInventory ? (
                   <div className="flex flex-col items-center justify-center py-16 px-6 bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-amber-100/60 rounded-2xl text-center shadow-inner">
                      <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm mb-4 rotate-3">
                        <Box className="w-8 h-8" />
                      </div>
                      <h4 className="text-[1.1rem] font-extrabold text-[#111827] mb-2">Stok Takibi Özelliği</h4>
                      <p className="text-[0.85rem] font-medium text-slate-500 max-w-sm">
                        Hastaya özel kullanılan malzemeleri düşmek ve stok geçmişini görüntülemek için <strong className="text-amber-700">Advanced</strong> paketine geçmeniz gerekmektedir.
                      </p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                      {(selProfile.stock_history || []).slice().reverse().map((h: any, i: number) => (
                        <div key={i} className="flex gap-4 items-center bg-white p-4 border border-slate-100 rounded-2xl shadow-sm hover:border-slate-200 transition-colors">
                           <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0 border border-amber-100">
                              <Box className="w-5 h-5" />
                           </div>
                           <div className="flex flex-col flex-1">
                              <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> {h.date}</span>
                              <span className="text-[0.85rem] font-bold text-slate-700 leading-tight">{h.text}</span>
                           </div>
                        </div>
                      ))}
                      {(!selProfile.stock_history || selProfile.stock_history.length === 0) && (
                        <div className="text-center py-10 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-3">
                           <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                             <Box className="w-6 h-6"/>
                           </div>
                           <span className="italic text-sm text-slate-400 font-medium">Bu hastaya henüz malzeme verilmemiş.</span>
                        </div>
                      )}
                   </div>
                 )
               )}
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Material Modal */}
      <Dialog open={materialModalOpen} onOpenChange={setMaterialModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-[#111827]">Malzeme Kullanımı</DialogTitle>
            <DialogDescription className="text-xs">Hastaya uygulanan malzeme miktarlarını girerek ana stoktan düşüş yapın.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
             <div className="bg-[#f8fafc] p-4 rounded-xl border border-slate-200 flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label>Malzeme</Label>
                  <Select value={selectedStockId} onValueChange={setSelectedStockId}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                    <SelectContent>
                      {inventory.items.map(item => (
                        <SelectItem key={item.id} value={item.id}>{item.ad} ({inventory.stock[item.id] || 0} {item.birim})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-1">
                  <Label>Miktar</Label>
                  <Input type="number" min={1} value={stockAmount} onChange={e => setStockAmount(Number(e.target.value))} className="bg-white" />
                </div>
                <Button variant="outline" className="h-10 border-[#0a3d34] text-[#0a3d34] hover:bg-[#0a3d34] hover:text-white" onClick={addToCart}><Plus className="w-4 h-4"/></Button>
             </div>

             <div className="min-h-[100px] border border-slate-200 rounded-xl p-2 bg-white space-y-1">
                {currentCart.map(c => (
                  <div key={c.id} className="flex justify-between items-center bg-slate-50 p-2 px-3 rounded-lg border border-slate-100">
                    <span className="text-sm font-bold text-slate-700">{c.name}</span>
                    <div className="flex items-center gap-3">
                       <span className="text-xs font-extrabold text-[#0a3d34]">{c.amount} {c.unit}</span>
                       <button onClick={() => setCurrentCart(currentCart.filter(x => x.id !== c.id))}><X className="w-4 h-4 text-red-500"/></button>
                    </div>
                  </div>
                ))}
                {currentCart.length === 0 && <div className="text-center py-6 text-xs text-slate-400 italic">Liste boş.</div>}
             </div>

             <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setMaterialModalOpen(false)} disabled={isSubmitting}>İptal</Button>
                <Button className="flex-1 bg-[#0a3d34] hover:bg-[#072b25]" disabled={isSubmitting || (currentCart.length === 0 && !selectedStockId)} onClick={handleMaterialSubmit}>
                  {isSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal */}
      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="sm:max-w-[400px] text-center p-8 bg-white border-slate-200">
           <div className="mx-auto w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4 rotate-3 shadow-sm border border-amber-200/50">
             <Package className="w-8 h-8" />
           </div>
           <DialogHeader><DialogTitle className="text-center text-xl font-extrabold text-[#111827]">Stok Takibi Kilitli</DialogTitle></DialogHeader>
           <p className="text-sm font-medium text-slate-500 mb-6">Hastaya özel kullanılan malzemeleri kaydetmek ve stoklardan düşmek için <strong className="text-amber-700">Advanced</strong> paketine geçmeniz gerekmektedir.</p>
           <div className="flex gap-3 mt-2">
              <Button className="flex-1 bg-[#0a3d34] hover:bg-[#072b25] shadow-md shadow-[#0a3d34]/20" onClick={() => setUpgradeModalOpen(false)}>Tamam, Anladım</Button>
           </div>
        </DialogContent>
      </Dialog>

      {/* Consent Form Modal */}
      <ConsentFormModal
        open={consentModalOpen}
        onOpenChange={setConsentModalOpen}
        patientName={selectedPatientName}
        patientTC={profiles[selectedPatientName]?.tc_no || pTC}
        patientPhone={selectedPatientPhone || pPhone}
        appointmentId={consentAppointment?.id}
        appointmentDate={consentAppointment?.tarih}
        appointmentTime={consentAppointment?.saat}
        clinicName={profile?.clinic_name}
        onSuccess={() => {
          // Reload consents for the patient
          getConsentRecords(selectedPatientName).then(records => setPatientConsents(records)).catch(() => {});
        }}
      />

      {/* Consent Detail Dialog */}
      <Dialog open={consentDetailOpen} onOpenChange={setConsentDetailOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-[#1e293b] flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Onam Formu Detayı
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {selectedConsent?.signed_at ? format(new Date(selectedConsent.signed_at), "d MMMM yyyy, HH:mm", { locale: tr }) : ""}
              {selectedConsent?.appointment_date ? ` — Randevu: ${selectedConsent.appointment_date}` : ""}
              {selectedConsent?.appointment_time ? ` ${selectedConsent.appointment_time}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Consent Text */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 max-h-[300px] overflow-y-auto no-scrollbar">
              <p className="text-[0.8rem] text-slate-600 whitespace-pre-wrap leading-relaxed font-medium">
                {selectedConsent?.consent_text}
              </p>
            </div>

            {/* Checkboxes Status */}
            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
              <h4 className="text-[0.7rem] font-extrabold uppercase text-emerald-700 tracking-wider mb-3">Onaylanan Maddeler</h4>
              <div className="space-y-2">
                {selectedConsent?.checkboxes && Object.entries(selectedConsent.checkboxes).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2 text-[0.78rem] font-medium text-slate-700">
                    <CheckCircle2 className={`w-4 h-4 ${val ? 'text-emerald-500' : 'text-slate-300'}`} />
                    {key === 'bilgilendirme_okundu' && 'Bilgilendirme okundu ve anlaşıldı'}
                    {key === 'soru_sorma_hakki' && 'Soru sorma hakkı biliniyor'}
                    {key === 'kvkk_onay' && 'KVKK onayı verildi'}
                  </div>
                ))}
              </div>
            </div>

            {/* Signature */}
            {selectedConsent?.signature_data && (
              <div className="bg-white rounded-2xl p-5 border-2 border-slate-200">
                <h4 className="text-[0.7rem] font-extrabold uppercase text-slate-500 tracking-wider mb-3">Dijital İmza</h4>
                <img src={selectedConsent.signature_data} alt="Hasta İmzası" className="max-h-[120px] w-auto mx-auto" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
