"use client";

import { useState, useEffect, useMemo } from "react";
import { useDatabase, Appointment, PatientProfile, InventoryItem, getCacheSync, CACHE_KEYS } from "@/hooks/use-database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Contact, Search, Package, Users, Clock, CheckCircle2, History, Pill, FileText, Box, Trash2, Plus, X, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale/tr";
import { useAuth } from "@/hooks/use-auth";

const HIZMETLER = [
  { id: 1, ad: "Klinik Muayene", sure: 30, fiyat: 600 },
  { id: 2, ad: "Dermoskopi", sure: 30, fiyat: 450 },
  { id: 3, ad: "Botoks Uygulaması", sure: 30, fiyat: 2500 },
  { id: 4, ad: "Lazer Tedavisi", sure: 30, fiyat: 1800 },
  { id: 5, ad: "Cilt Bakımı", sure: 30, fiyat: 1200 },
];

export default function PatientListPage() {
  const { profile } = useAuth();
  const { getAppointments, getPatientProfiles, savePatientProfile, getInventory, saveInventoryItem } = useDatabase();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Omit<PatientProfile, "patient_name">>>({});
  const [inventory, setInventory] = useState<{ stock: Record<string, number>; items: InventoryItem[] }>({ stock: {}, items: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Patient Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "meds" | "notes" | "stock">("timeline");
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [selectedPatientPhone, setSelectedPatientPhone] = useState("");

  // Material Modal
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [currentCart, setCurrentCart] = useState<{ id: string; name: string; unit: string; amount: number }[]>([]);
  const [selectedStockId, setSelectedStockId] = useState("");
  const [stockAmount, setStockAmount] = useState(1);

  // Forms
  const [newMedName, setNewMedName] = useState("");
  const [newMedUsage, setNewMedUsage] = useState("");
  const [noteSikayet, setNoteSikayet] = useState("");
  const [noteHikaye, setNoteHikaye] = useState("");
  const [noteMuayene, setNoteMuayene] = useState("");

  // Note Editing
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");

  useEffect(() => {
    // Load from cache first
    const cachedApts = getCacheSync<Appointment[]>(CACHE_KEYS.APPOINTMENTS);
    if (cachedApts) setAppointments(cachedApts);
    
    const cachedProfs = getCacheSync<Record<string, Omit<PatientProfile, "patient_name">>>(CACHE_KEYS.PROFILES);
    if (cachedProfs) setProfiles(cachedProfs);
    
    const cachedInv = getCacheSync<{ stock: Record<string, number>; items: InventoryItem[] }>(CACHE_KEYS.INVENTORY);
    if (cachedInv) setInventory(cachedInv);

    loadData();
  }, [getAppointments, getPatientProfiles, getInventory]);

  const loadData = async () => {
    try {
      const [list, profs, inv] = await Promise.all([
        getAppointments(),
        getPatientProfiles(),
        getInventory()
      ]);
      setAppointments(list);
      setProfiles(profs);
      setInventory(inv);
    } catch (e) {
      console.error("Data load failed:", e);
    }
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const filteredPatients = useMemo(() => {
    return appointments.filter(a => {
      const isToday = a.tarih === todayStr;
      const isActive = a.durum === "onaylandi" || a.durum === "beklemede";
      const search = searchTerm.toLowerCase();
      const matchesSearch = a.musteriAdi.toLowerCase().includes(search) || (a.telefon && a.telefon.includes(search));
      return isToday && isActive && matchesSearch;
    }).sort((a,b) => a.saat.localeCompare(b.saat));
  }, [appointments, todayStr, searchTerm]);

  const stats = useMemo(() => ({
    total: filteredPatients.length,
    pending: filteredPatients.filter(a => a.durum === "beklemede").length,
    done: filteredPatients.filter(a => a.durum === "onaylandi").length
  }), [filteredPatients]);

  const openProfile = (name: string, phone: string) => {
    setSelectedPatientName(name);
    setSelectedPatientPhone(phone);
    const prof = profiles[name] || { notes_list: [], meds: [], stock_history: [] };
    // Load last note into fields if needed, or leave blank for new entry
    setNoteSikayet("");
    setNoteHikaye("");
    setNoteMuayene("");
    setModalOpen(true);
    setActiveTab("timeline");
  };

  const openMaterial = (name: string) => {
    setSelectedPatientName(name);
    setCurrentCart([]);
    setMaterialModalOpen(true);
  };

  const handleAddMed = async () => {
    if (!newMedName) return;
    const current = profiles[selectedPatientName] || { notes_list: [], meds: [], stock_history: [] };
    const mList = [...(current.meds || [])];
    mList.push({ name: newMedName, usage: newMedUsage, date: format(new Date(), "dd.MM.yyyy") });
    
    const updated = { ...current, meds: mList };
    await savePatientProfile(selectedPatientName, updated);
    setProfiles(prev => ({ ...prev, [selectedPatientName]: updated }));
    setNewMedName(""); setNewMedUsage("");
  };

  const handleAddNote = async () => {
    if (!noteSikayet && !noteHikaye && !noteMuayene) return;
    const content = `Şikayet: ${noteSikayet}\nHikaye: ${noteHikaye}\nMuayene: ${noteMuayene}`;
    const current = profiles[selectedPatientName] || { notes_list: [], meds: [], stock_history: [] };
    const nList = [...(current.notes_list || [])];
    nList.push({ date: format(new Date(), "dd.MM.yyyy HH:mm"), content });
    
    const updated = { ...current, notes_list: nList };
    await savePatientProfile(selectedPatientName, updated);
    setProfiles(prev => ({ ...prev, [selectedPatientName]: updated }));
    setNoteSikayet(""); setNoteHikaye(""); setNoteMuayene("");
  };

  const handleUpdateNote = async () => {
    if (editingNoteIndex === null || !editingNoteContent) return;
    const current = profiles[selectedPatientName] || { notes_list: [], meds: [], stock_history: [] };
    const nList = [...(current.notes_list || [])];
    nList[editingNoteIndex].content = editingNoteContent;
    
    const updated = { ...current, notes_list: nList };
    await savePatientProfile(selectedPatientName, updated);
    setProfiles(prev => ({ ...prev, [selectedPatientName]: updated }));
    setEditingNoteIndex(null);
    setEditingNoteContent("");
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
    if (currentCart.length === 0) return;

    const current = profiles[selectedPatientName] || { notes_list: [], meds: [], stock_history: [] };
    const history = [...(current.stock_history || [])];
    const detailStr = currentCart.map(c => `${c.amount} ${c.unit} ${c.name}`).join(", ");
    history.push({ date: format(new Date(), "dd.MM.yyyy HH:mm"), text: detailStr });

    const updatedProf = { ...current, stock_history: history };
    await savePatientProfile(selectedPatientName, updatedProf);

    // Deduct from Inventory
    for (const c of currentCart) {
      const item = inventory.items.find(i => i.id === c.id);
      if (item) {
        const newQty = (inventory.stock[c.id] || 0) - c.amount;
        await saveInventoryItem(item, newQty);
        setInventory(prev => ({ ...prev, stock: { ...prev.stock, [c.id]: newQty } }));
      }
    }

    setProfiles(prev => ({ ...prev, [selectedPatientName]: updatedProf }));
    setMaterialModalOpen(false);
  };

  const selProfile = profiles[selectedPatientName] || { notes_list: [], meds: [], stock_history: [] };
  const hstAppointments = appointments.filter(a => a.musteriAdi === selectedPatientName).sort((a,b) => b.tarih.localeCompare(a.tarih));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex justify-between items-center bg-white/88 backdrop-blur-[20px] p-[14px_24px] rounded-[20px] border border-slate-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.07)] sticky top-3 z-[40]">
        <div className="flex flex-col gap-[2px]">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#0a3d34] opacity-80 mb-[1px]">{(profile?.clinic_name || "Klinik").toUpperCase()}</span>
          <h1 className="text-[1.25rem] font-extrabold text-[#1e293b]">Hasta Listesi</h1>
          <div className="text-[0.78rem] font-medium text-[#64748b]">
            {format(new Date(), "d MMMM yyyy, eeee", { locale: tr })}
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4 w-full md:w-auto">
           <div className="relative flex-1 md:w-[300px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <Input 
                placeholder="Hasta ara..." 
                className="pl-9 h-11 bg-slate-50 border-slate-200 focus-visible:ring-[#0a3d34] rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>
      </header>


      <div className="bg-white rounded-[20px] shadow-sm border border-slate-200 overflow-hidden relative min-h-[400px]">
        <Table>
          <TableHeader className="bg-gradient-to-r from-[#0c4a40] to-[#177567] hover:bg-transparent">
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
              const h = HIZMETLER.find(x => x.id.toString() === p.hizmetId.toString());
              return (
                <TableRow key={p.id} className={`hover:bg-emerald-50/30 transition-colors ${p.durum === 'beklemede' ? 'bg-amber-50/20' : ''}`}>
                  <TableCell className="text-center py-4">
                     <span className="font-bold text-[#0a3d34] cursor-pointer hover:underline underline-offset-4" onClick={() => openProfile(p.musteriAdi, p.telefon || "")}>
                        {p.musteriAdi}
                     </span>
                  </TableCell>
                  <TableCell className="text-center py-4 font-medium text-slate-600">{p.telefon || "-"}</TableCell>
                  <TableCell className="text-center py-4">
                     <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-[0.7rem] font-bold">
                       {h?.ad}
                     </span>
                  </TableCell>
                  <TableCell className="text-center py-4 font-extrabold text-[#111827]">{p.saat}</TableCell>
                  <TableCell className="text-center py-4">
                     <Button variant="outline" size="sm" className="h-8 text-xs bg-slate-50 border-slate-200 text-[#0a3d34] font-bold hover:bg-[#0a3d34] hover:text-white transition-all shadow-none" onClick={() => openMaterial(p.musteriAdi)}>
                        <Package className="w-3.5 h-3.5 mr-1" /> Malzeme
                     </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Patient Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden bg-white border-slate-200 flex flex-col md:flex-row shadow-2xl">
          
          {/* Left Sidebar */}
          <div className="w-full md:w-[280px] bg-slate-50/50 border-r border-slate-200/60 p-6 flex flex-col items-center md:items-start shrink-0">
             
             {/* Avatar / Profile Header */}
             <div className="flex flex-col items-center md:items-start w-full gap-4 mb-8">
               <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0c4a40] to-[#177567] text-white flex items-center justify-center text-2xl font-extrabold shadow-lg shadow-[#0a3d34]/20 ring-4 ring-[#0a3d34]/5">
                 {selectedPatientName ? selectedPatientName.substring(0, 2).toUpperCase() : "HA"}
               </div>
               <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1">
                 <DialogTitle className="text-xl font-extrabold text-[#1e293b] leading-tight">{selectedPatientName}</DialogTitle>
                 <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-slate-200/60 shadow-sm mt-1">
                   <Contact className="w-3.5 h-3.5 text-slate-400"/> {selectedPatientPhone || "Telefon Yok"}
                 </span>
               </div>
             </div>

             {/* Navigation */}
             <div className="flex flex-row md:flex-col gap-2 w-full overflow-x-auto md:overflow-visible pb-2 md:pb-0 no-scrollbar">
                {[
                  { id: 'timeline', label: 'Geçmiş İşlemler', icon: History },
                  { id: 'meds', label: 'İlaçlar / Reçete', icon: Pill },
                  { id: 'notes', label: 'Muayene / Notlar', icon: FileText },
                  { id: 'stock', label: 'Stok Geçmişi', icon: Box }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    className={`flex items-center justify-center md:justify-start gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal
                      ${activeTab === tab.id 
                        ? 'bg-white text-[#0a3d34] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] border border-slate-200/80' 
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-transparent'
                      }`}
                    onClick={() => setActiveTab(tab.id as any)}
                  >
                    <tab.icon className={`w-4.5 h-4.5 mb-0.5 ${activeTab === tab.id ? 'text-[#0a3d34]' : 'text-slate-400'}`} /> {tab.label}
                  </button>
                ))}
             </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 bg-white flex flex-col h-[550px] relative">
             <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 shrink-0">
               <h3 className="text-lg font-extrabold text-[#1e293b]">
                 {activeTab === 'timeline' && 'Geçmiş İşlemler'}
                 {activeTab === 'meds' && 'İlaçlar ve Reçete'}
                 {activeTab === 'notes' && 'Muayene ve Notlar'}
                 {activeTab === 'stock' && 'Stok Geçmişi'}
               </h3>
             </div>

             <div className="flex-1 p-8 overflow-y-auto no-scrollbar bg-slate-50/30">
               {activeTab === 'timeline' && (
                 <div className="space-y-6">
                    {hstAppointments.length === 0 ? <div className="text-center py-10 italic text-slate-400 bg-white border border-slate-100 rounded-xl shadow-sm">Henüz işlem geçmişi bulunamadı.</div> : (
                      <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                         {hstAppointments.map(a => {
                           const h = HIZMETLER.find(x => x.id.toString() === a.hizmetId.toString());
                           const isStatusDone = a.durum === 'onaylandi';
                           return (
                             <div key={a.id} className="relative pl-6">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white ${isStatusDone ? 'bg-[#0a3d34]' : 'bg-amber-400'}`} />
                                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                   <div className="flex items-center justify-between mb-2">
                                      <div className="text-[0.7rem] font-bold text-slate-400 tracking-wide uppercase flex items-center gap-1.5">
                                        <Clock className="w-3 h-3"/> {a.tarih} · {a.saat}
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
                                </div>
                             </div>
                           )
                         })}
                      </div>
                    )}
                 </div>
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
                           <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
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
                                 <div className="bg-slate-50 text-slate-500 text-[0.65rem] font-bold px-3 py-1 rounded-full border border-slate-200 shadow-sm flex items-center gap-1.5">
                                   <Clock className="w-3 h-3"/> {n.date}
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
                 <div className="space-y-3">
                    {(selProfile.stock_history || []).slice().reverse().map((h: any, i: number) => (
                      <div key={i} className="flex gap-4 items-center bg-white p-4 border border-slate-100 rounded-2xl shadow-sm hover:border-slate-200 transition-colors">
                         <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-[#0a3d34] shrink-0 border border-emerald-100/50">
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
                <Button variant="outline" className="flex-1" onClick={() => setMaterialModalOpen(false)}>İptal</Button>
                <Button className="flex-1 bg-[#0a3d34] hover:bg-[#072b25]" disabled={currentCart.length === 0} onClick={handleMaterialSubmit}>Değişiklikleri Kaydet</Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
