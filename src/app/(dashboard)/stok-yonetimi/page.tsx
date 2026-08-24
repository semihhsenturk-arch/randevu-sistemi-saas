"use client";

import { useState, useEffect, useMemo } from "react";
import { useDatabase, InventoryItem, getCacheSync, CACHE_KEYS } from "@/hooks/use-database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Warehouse, Search, Plus, Minus, Package, CheckCircle, AlertTriangle, Trash2, ArrowUpRight, SearchIcon, ChevronDown, Sparkles, Hash, Tag, DollarSign, ShieldAlert, Layers, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { tr } from "date-fns/locale/tr";
import { useAuth } from "@/hooks/use-auth";
import { UpgradeScreen } from "@/components/UpgradeScreen";
import { toast } from "sonner";

export default function StockManagementPage() {
  const { profile, isLoading, checkAccess } = useAuth();
  const { getInventory, saveInventoryItem, deleteInventoryItem } = useDatabase();
  const [inventory, setInventory] = useState<{ stock: Record<string, number>; items: InventoryItem[] }>({ stock: {}, items: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  // New stock entry form state
  const [entryMode, setEntryMode] = useState<"new" | "existing">("new");
  const [selectedExistingId, setSelectedExistingId] = useState<string>("");
  const [entryForm, setEntryForm] = useState<{ kod: string; ad: string; adet: number | string; birim: string; fiyat: number | string; kritik: number | string }>({ kod: "", ad: "", adet: "", birim: "Adet", fiyat: "", kritik: "" });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedItemToDelete, setSelectedItemToDelete] = useState<InventoryItem | null>(null);
  const [adjustAmounts, setAdjustAmounts] = useState<Record<string, string>>({});

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<InventoryItem | null>(null);

  const isLocked = !checkAccess("advanced");

  useEffect(() => {
    const cached = getCacheSync<{ stock: Record<string, number>; items: InventoryItem[] }>(CACHE_KEYS.INVENTORY);
    if (cached) setInventory(cached);
    
    loadData();
  }, [getInventory]);

  const loadData = async () => {
    try {
      const data = await getInventory();
      setInventory(data);
    } catch (e) {
      console.error(e);
    }
  };

  const getAdjustAmount = (itemId: string) => {
    const val = adjustAmounts[itemId];
    if (val === undefined || val === "") return 1;
    const num = parseInt(val, 10);
    return isNaN(num) || num < 1 ? 1 : num;
  };

  const handleStockAdjust = async (item: InventoryItem, delta: number) => {
    const current = inventory.stock[item.id] || 0;
    const newQty = Math.max(0, current + delta);
    if (current === newQty) return;
    
    const actualDelta = newQty - current; // positive for addition (iade/duzeltme), negative for usage (fire/cikis)
    const unitCost = item.fiyat || 0;
    const absDelta = Math.abs(actualDelta);
    const totalCost = absDelta * unitCost;
    const oldTotalValue = current * unitCost;
    const newTotalValue = newQty * unitCost;

    const movementType = actualDelta > 0 ? 'duzeltme' : 'cikis';
    
    const movement: any = {
      id: "mov_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      date: new Date().toISOString(),
      type: movementType,
      amount: absDelta,
      unit_cost: unitCost,
      total_cost: totalCost,
      previous_stock: current,
      new_stock: newQty,
      previous_avg_cost: unitCost,
      new_avg_cost: unitCost,
      note: actualDelta > 0 ? 'Stok Düzeltme / İade' : 'Stok Çıkış / Fire'
    };

    const updatedItem = {
      ...item,
      toplam_deger: newTotalValue,
      hareketler: [...(item.hareketler || []), movement]
    };

    await saveInventoryItem(updatedItem, newQty);
    setInventory(prev => ({ 
      items: prev.items.map(i => i.id === item.id ? updatedItem : i),
      stock: { ...prev.stock, [item.id]: newQty } 
    }));
    
    if (actualDelta > 0) {
      toast.success(`${item.ad} stoku eklendi.`, {
        description: `Yeni Stok: ${newQty} ${item.birim}`
      });
    } else {
      toast.info(`${item.ad} stoku kullanıldı.`, {
        description: `Kalan Stok: ${newQty} ${item.birim}`
      });
    }
  };

  const resetEntryForm = () => {
    setEntryMode("new");
    setSelectedExistingId("");
    setEntryForm({ kod: "", ad: "", adet: "", birim: "Adet", fiyat: "", kritik: "" });
    setDropdownOpen(false);
  };

  const handleSelectExisting = (item: InventoryItem) => {
    setEntryMode("existing");
    setSelectedExistingId(item.id);
    setEntryForm({
      kod: item.kod || "",
      ad: item.ad,
      adet: "",
      birim: item.birim || "Adet",
      fiyat: item.fiyat ?? "",
      kritik: item.kritik_stok || "",
    });
    setDropdownOpen(false);
  };

  const handleSelectNew = () => {
    setEntryMode("new");
    setSelectedExistingId("");
    setEntryForm({ kod: "", ad: "", adet: "", birim: "Adet", fiyat: "", kritik: "" });
    setDropdownOpen(false);
  };

  // Calculate birim fiyat live preview
  const liveAdet = Number(entryForm.adet) || 0;
  const liveToplamFiyat = Number(entryForm.fiyat) || 0;
  const liveBirimFiyat = liveAdet > 0 && liveToplamFiyat > 0 ? liveToplamFiyat / liveAdet : 0;

  const handleStockEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const adetValue = Number(entryForm.adet) || 0;
    const toplamFiyatValue = Number(entryForm.fiyat) || 0;
    const kritikValue = Number(entryForm.kritik) || 0;
    const purchaseUnitCost = adetValue > 0 && toplamFiyatValue > 0 ? (toplamFiyatValue / adetValue) : 0;

    if (entryMode === "existing" && selectedExistingId) {
      const existingItem = inventory.items.find(i => i.id === selectedExistingId);
      if (!existingItem) return;
      const currentQty = inventory.stock[selectedExistingId] || 0;
      const currentAvgCost = existingItem.fiyat || 0;
      const oldTotalValue = currentQty * currentAvgCost;
      
      const newQty = currentQty + adetValue;
      const newTotalValue = oldTotalValue + toplamFiyatValue;
      const newAvgCost = newQty > 0 ? (newTotalValue / newQty) : 0;
      
      const movement: any = {
        id: "mov_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        date: new Date().toISOString(),
        type: 'giris',
        amount: adetValue,
        unit_cost: purchaseUnitCost,
        total_cost: toplamFiyatValue,
        previous_stock: currentQty,
        new_stock: newQty,
        previous_avg_cost: currentAvgCost,
        new_avg_cost: newAvgCost,
        note: 'Yeni Alım (Giriş)'
      };

      const updatedItem: InventoryItem = {
        ...existingItem,
        kod: entryForm.kod || existingItem.kod,
        birim: entryForm.birim || existingItem.birim,
        fiyat: newAvgCost,
        toplam_deger: newTotalValue,
        kritik_stok: kritikValue || existingItem.kritik_stok,
        hareketler: [...(existingItem.hareketler || []), movement]
      };
      await saveInventoryItem(updatedItem, newQty);
      setInventory(prev => ({
        items: prev.items.map(i => i.id === selectedExistingId ? updatedItem : i),
        stock: { ...prev.stock, [selectedExistingId]: newQty }
      }));
      toast.success(`${updatedItem.ad} stoku güncellendi.`, { description: `Yeni Stok: ${newQty} ${updatedItem.birim}` });
    } else {
      if (!entryForm.ad) return;
      const id = "item_" + Math.random().toString(36).substr(2, 9);
      
      const movement: any = {
        id: "mov_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        date: new Date().toISOString(),
        type: 'giris',
        amount: adetValue,
        unit_cost: purchaseUnitCost,
        total_cost: toplamFiyatValue,
        previous_stock: 0,
        new_stock: adetValue,
        previous_avg_cost: 0,
        new_avg_cost: purchaseUnitCost,
        note: 'İlk Alım'
      };

      const itemObj: InventoryItem = { 
        id, 
        ad: entryForm.ad, 
        birim: entryForm.birim || "Adet", 
        kritik_stok: kritikValue, 
        kod: entryForm.kod || undefined, 
        fiyat: purchaseUnitCost || undefined,
        toplam_deger: toplamFiyatValue || undefined,
        hareketler: [movement]
      };
      await saveInventoryItem(itemObj, adetValue);
      setInventory(prev => ({
        items: [...prev.items, itemObj],
        stock: { ...prev.stock, [id]: adetValue }
      }));
      toast.success(`${entryForm.ad} stoka eklendi.`);
    }
    setModalOpen(false);
    resetEntryForm();
  };

  const executeDelete = async () => {
    if (!selectedItemToDelete) return;
    await deleteInventoryItem(selectedItemToDelete.id);
    setInventory(prev => ({
      items: prev.items.filter(i => i.id !== selectedItemToDelete.id),
      stock: { ...prev.stock, [selectedItemToDelete.id]: 0 }
    }));
    toast.success(`${selectedItemToDelete.ad} başarıyla silindi.`);
    setConfirmDeleteOpen(false);
    setSelectedItemToDelete(null);
  };

  const confirmDelete = (item: InventoryItem) => {
    setSelectedItemToDelete(item);
    setConfirmDeleteOpen(true);
  };

  const filteredItems = inventory.items
    .filter(i => i.ad.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const kodA = a.kod || "";
      const kodB = b.kod || "";
      if (!kodA && !kodB) return a.ad.localeCompare(b.ad, "tr");
      if (!kodA) return 1;
      if (!kodB) return -1;
      return kodB.localeCompare(kodA, "tr", { numeric: true });
    });

  const stats = useMemo(() => {
    let total = inventory.items.length;
    let criticalItems: { name: string; qty: number; unit: string }[] = [];
    inventory.items.forEach(item => {
      const qty = inventory.stock[item.id] || 0;
      const crit = item.kritik_stok || 0;
      if (qty <= crit) {
        criticalItems.push({ name: item.ad, qty, unit: item.birim });
      }
    });
    return { total, critical: criticalItems.length, ok: total - criticalItems.length, criticalItems };
  }, [inventory]);

  if (isLoading) return null;

  if (isLocked) {
    return (
      <UpgradeScreen 
        title="Stoklarınızı Otomatize Edin 🚀" 
        description="Kritik seviye uyarıları ve detaylı malzeme takibi ile kliniğinizin operasyonel süreçlerini hızlandırın."
        requiredPlan="Advanced"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col md:flex-row justify-between items-center bg-white/88 backdrop-blur-[20px] p-4 md:p-[14px_24px] rounded-[20px] border border-slate-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.07)] sticky top-20 lg:top-3 z-[40] gap-4">
        <div className="flex flex-col gap-[2px] text-center md:text-left w-full md:w-auto">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#0a3d34] opacity-80 mb-[1px]">{(profile?.clinic_name || "Klinik").toUpperCase()}</span>
          <h1 className="text-[1.25rem] font-extrabold text-[#1e293b]">Stok Yönetimi</h1>
          <div className="text-[0.78rem] font-medium text-[#64748b]">
            {format(new Date(), "d MMMM yyyy, eeee", { locale: tr })}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-[260px]">
             <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <Input 
                placeholder="Malzeme ara..." 
                className="pl-9 h-11 bg-slate-50 border-slate-200 focus-visible:ring-[#0a3d34] rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <Button onClick={() => { resetEntryForm(); setModalOpen(true); }} className="bg-[#0a3d34] hover:bg-[#072b25] h-11 px-6 rounded-xl font-bold w-full sm:w-auto">
             <Plus className="w-4 h-4 mr-2" /> Stok Girişi
           </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl border-slate-200 shadow-sm flex items-center p-4 gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
               <Package className="w-5 h-5" />
            </div>
             <div>
               <div className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Toplam Kalem</div>
               <div className="text-xl font-extrabold text-slate-900 leading-none">{stats.total}</div>
             </div>
        </Card>
        <Card className="rounded-xl border-slate-200 shadow-sm flex items-center p-4 gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
               <DollarSign className="w-5 h-5" />
            </div>
            <div>
               <div className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Toplam Depo Değeri</div>
               <div className="text-xl font-extrabold text-slate-900 leading-none">
                 {inventory.items.reduce((sum, item) => sum + ((inventory.stock[item.id] || 0) * (item.fiyat || 0)), 0).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
               </div>
            </div>
        </Card>
        <Card className="rounded-xl border-slate-200 shadow-sm flex items-center p-4 gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
               <CheckCircle className="w-5 h-5" />
            </div>
            <div>
               <div className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Yeterli Stok</div>
               <div className="text-xl font-extrabold text-slate-900 leading-none">{stats.ok}</div>
            </div>
        </Card>
        <Card className="rounded-xl border-slate-200 shadow-sm flex items-center p-4 gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
               <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
               <div className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Kritik Stok</div>
               <div className="text-xl font-extrabold text-slate-900 leading-none">{stats.critical}</div>
            </div>
        </Card>
      </div>

      {stats.criticalItems.length > 0 && (
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 border-l-4 border-l-red-500 p-4 rounded-xl shadow-sm animate-alert-pulse">
           <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-[0.85rem] font-extrabold text-red-600 uppercase tracking-wider">Dikkat: Kritik Seviyedeki Stoklar</span>
           </div>
           <div className="text-sm font-bold text-red-800 leading-relaxed">
             {stats.criticalItems.map((item, idx) => (
                <span key={idx}>
                  {item.name} (Kalan: {item.qty} {item.unit}){idx < stats.criticalItems.length - 1 ? ", " : ""}
                </span>
             ))}
           </div>
        </div>
      )}

      <div className="block md:hidden space-y-3 pb-28">
        {filteredItems.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 italic">Kayıt bulunamadı.</div>
        ) : filteredItems.map(item => {
          const qty = inventory.stock[item.id] || 0;
          const crit = item.kritik_stok || 10;
          const isLow = qty <= crit;
          return (
            <div key={item.id} className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 ${isLow ? 'border-red-200 bg-red-50/10' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-extrabold text-[#0a3d34] text-lg">{item.ad}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.kod && <span className="text-[0.6rem] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{item.kod}</span>}
                    <span className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">{item.birim}</span>
                  </div>
                </div>
                {isLow ? (
                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[0.65rem] font-black flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> KRİTİK
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[0.65rem] font-black flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> GÜVENLİ
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[0.6rem] font-bold text-slate-400 uppercase">Mevcut Stok</span>
                  <span className="text-xl font-black text-slate-900">{qty} {item.birim}</span>
                </div>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <button className="h-10 w-10 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30" onClick={() => handleStockAdjust(item, -getAdjustAmount(item.id))} disabled={qty <= 0}>
                    <Minus className="w-4 h-4" />
                  </button>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={adjustAmounts[item.id] ?? ""} 
                    onChange={(e) => setAdjustAmounts(prev => ({ ...prev, [item.id]: e.target.value.replace(/[^0-9]/g, "") }))}
                    className="w-12 h-10 text-center font-bold text-slate-900 border-x border-slate-200 bg-slate-50/50 outline-none text-sm"
                  />
                  <button className="h-10 w-10 flex items-center justify-center text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" onClick={() => handleStockAdjust(item, getAdjustAmount(item.id))}>
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex flex-col gap-1">
                  <div className="text-[0.7rem] font-bold text-slate-400">Kritik: <span className="text-slate-900">{crit}</span></div>
                  {item.fiyat != null && item.fiyat > 0 && (
                    <div className="text-[0.7rem] font-bold text-slate-400">Ort. Maliyet: <span className="text-slate-900">{item.fiyat.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} ₺</span></div>
                  )}
                  {qty > 0 && item.fiyat != null && (
                    <div className="text-[0.7rem] font-bold text-slate-400">Tpl. Değer: <span className="text-slate-900">{(qty * item.fiyat).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span></div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 text-blue-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-xs font-bold" onClick={() => { setSelectedHistoryItem(item); setHistoryModalOpen(true); }}>
                    <History className="w-3.5 h-3.5 mr-1.5" /> Geçmiş
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-bold" onClick={() => confirmDelete(item)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Sil
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block bg-white rounded-[20px] shadow-sm border border-slate-200 overflow-hidden relative min-h-[400px]">
        <div className="overflow-x-auto w-full custom-scrollbar-auto">
        <Table className="min-w-[800px] w-full">
          <TableHeader className="bg-gradient-to-r from-slate-700 to-slate-800 hover:bg-transparent">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-white font-bold uppercase tracking-wider text-[0.72rem] py-4 text-center">Kod</TableHead>
              <TableHead className="text-white font-bold uppercase tracking-wider text-[0.72rem] py-4 text-center">Malzeme Adı</TableHead>
              <TableHead className="text-white font-bold uppercase tracking-wider text-[0.72rem] py-4 text-center">Mevcut Miktar</TableHead>
              <TableHead className="text-white font-bold uppercase tracking-wider text-[0.72rem] py-4 text-center">Kritik Limit</TableHead>
              <TableHead className="text-white font-bold uppercase tracking-wider text-[0.72rem] py-4 text-center">Durum</TableHead>
              <TableHead className="text-white font-bold uppercase tracking-wider text-[0.72rem] py-4 text-center">Ort. Birim Maliyet</TableHead>
              <TableHead className="text-white font-bold uppercase tracking-wider text-[0.72rem] py-4 text-center">Toplam Değer</TableHead>
              <TableHead className="text-white font-bold uppercase tracking-wider text-[0.72rem] py-4 text-center">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-500">Kayıt bulunamadı.</TableCell></TableRow>
            ) : filteredItems.map(item => {
              const qty = inventory.stock[item.id] || 0;
              const crit = item.kritik_stok || 10;
              const isLow = qty <= crit;
              return (
                <TableRow key={item.id} className={`hover:bg-emerald-50/30 transition-colors ${isLow ? 'bg-red-50/20' : ''}`}>
                  <TableCell className="text-center py-4">
                    {item.kod ? (
                      <span className="inline-block px-3 py-1 rounded-md bg-slate-100 text-[0.75rem] font-bold text-slate-600 tracking-wide">{item.kod}</span>
                    ) : (
                      <span className="text-slate-300 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <div className="font-bold text-[#0a3d34]">{item.ad}</div>
                    <div className="text-[0.65rem] font-bold text-slate-400 uppercase mt-0.5">{item.birim}</div>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <div className={`inline-block px-4 py-1.5 rounded-lg font-bold text-sm ${isLow ? 'bg-red-100/50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-700'}`}>
                      {qty} {item.birim}
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <div className="text-sm font-bold text-slate-400 border border-dashed border-slate-200 rounded-lg py-1 px-3 inline-block bg-slate-50">{crit}</div>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    {isLow ? (
                      <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-600 px-3 py-1 rounded-full text-[0.7rem] font-bold">
                        <AlertTriangle className="w-3 h-3" /> KRİTİK SEVİYE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[0.7rem] font-bold">
                        <CheckCircle className="w-3 h-3" /> GÜVENLİ
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    {item.fiyat != null && item.fiyat > 0 ? (
                      <span className="text-sm font-bold text-slate-700">{item.fiyat.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} ₺</span>
                    ) : (
                      <span className="text-slate-300 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    {item.fiyat != null && item.fiyat > 0 && qty > 0 ? (
                      <span className="text-sm font-bold text-slate-700">{(qty * item.fiyat).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                    ) : (
                      <span className="text-slate-300 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                        <button 
                          className="h-8 w-8 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                          onClick={() => handleStockAdjust(item, -getAdjustAmount(item.id))} 
                          disabled={qty <= 0}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          value={adjustAmounts[item.id] ?? ""} 
                          onChange={(e) => setAdjustAmounts(prev => ({ ...prev, [item.id]: e.target.value.replace(/[^0-9]/g, "") }))}
                          className="w-12 h-8 text-center font-bold text-slate-900 border-x border-slate-200 bg-slate-50/50 outline-none text-xs"
                        />
                        <button 
                          className="h-8 w-8 flex items-center justify-center text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" 
                          onClick={() => handleStockAdjust(item, getAdjustAmount(item.id))}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button 
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm" 
                        onClick={() => { setSelectedHistoryItem(item); setHistoryModalOpen(true); }}
                        title="Hareket Geçmişi"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      {/* Delete Button */}
                      <button 
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm" 
                        onClick={() => confirmDelete(item)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) resetEntryForm(); }}>
        <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          {/* Premium Header */}
          <div className="bg-gradient-to-br from-[#0a3d34] via-[#0d4f43] to-[#0a3d34] p-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogHeader><DialogTitle className="text-[1.15rem] font-extrabold text-white tracking-tight">Stok Girişi</DialogTitle></DialogHeader>
                <p className="text-emerald-200/80 text-[0.75rem] font-medium mt-0.5">Yeni malzeme ekleyin veya mevcut stoku güncelleyin</p>
              </div>
            </div>
          </div>

          <form className="p-6 space-y-5" onSubmit={handleStockEntry}>
            {/* Item Selector — New or Existing */}
            <div className="space-y-2">
              <Label className="text-[0.72rem] font-bold text-slate-500 uppercase tracking-wider">Malzeme Seçimi</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-left flex items-center justify-between hover:border-[#0a3d34]/40 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0a3d34]/20"
                >
                  <span className={`text-sm font-semibold ${entryMode === "new" && !selectedExistingId ? "text-emerald-600" : "text-slate-800"}`}>
                    {entryMode === "new" ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        Yeni Malzeme
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#0a3d34]" />
                        {inventory.items.find(i => i.id === selectedExistingId)?.ad || "Seçin..."}
                      </span>
                    )}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-[240px] overflow-y-auto custom-scrollbar-inner animate-in fade-in-0 zoom-in-95 duration-150">
                    {/* New option */}
                    <button
                      type="button"
                      onClick={handleSelectNew}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-emerald-50 transition-colors border-b border-slate-100"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-emerald-700">Yeni Malzeme</div>
                        <div className="text-[0.65rem] text-slate-400">Yeni bir stok kalemi oluştur</div>
                      </div>
                    </button>
                    {/* Existing items */}
                    {inventory.items.length > 0 && (
                      <div className="px-3 py-1.5">
                        <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">Mevcut Kalemler</span>
                      </div>
                    )}
                    {inventory.items.sort((a, b) => a.ad.localeCompare(b.ad, "tr")).map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectExisting(item)}
                        className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors ${selectedExistingId === item.id ? "bg-emerald-50/60" : ""}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Package className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">{item.ad}</div>
                          <div className="text-[0.65rem] text-slate-400">
                            {item.kod ? `${item.kod} · ` : ""}Stok: {inventory.stock[item.id] || 0} {item.birim}
                          </div>
                        </div>
                        {selectedExistingId === item.id && (
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-4">
              {/* Kod */}
              <div className="space-y-1.5">
                <Label className="text-[0.72rem] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Hash className="w-3 h-3" /> Kod
                </Label>
                <Input
                  placeholder="STK-001"
                  value={entryForm.kod}
                  onChange={e => setEntryForm(prev => ({ ...prev, kod: e.target.value }))}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-[#0a3d34] font-semibold placeholder:text-slate-300"
                />
              </div>
              {/* Malzeme Adı */}
              <div className="space-y-1.5">
                <Label className="text-[0.72rem] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> Malzeme Adı
                </Label>
                <Input
                  required
                  placeholder="Malzeme adı"
                  value={entryForm.ad}
                  onChange={e => setEntryForm(prev => ({ ...prev, ad: e.target.value }))}
                  disabled={entryMode === "existing"}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-[#0a3d34] font-semibold placeholder:text-slate-300 disabled:opacity-70 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {/* Miktar */}
              <div className="space-y-1.5">
                <Label className="text-[0.72rem] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3 h-3" /> Miktar
                </Label>
                <Input
                  type="number"
                  required
                  min={0}
                  placeholder="0"
                  value={entryForm.adet}
                  onChange={e => setEntryForm(prev => ({ ...prev, adet: e.target.value === "" ? "" : Number(e.target.value) }))}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-[#0a3d34] font-bold text-center placeholder:text-slate-300"
                />
              </div>
              {/* Birim */}
              <div className="space-y-1.5">
                <Label className="text-[0.72rem] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3 h-3" /> Birim
                </Label>
                <Input
                  required
                  placeholder="Adet"
                  value={entryForm.birim}
                  onChange={e => setEntryForm(prev => ({ ...prev, birim: e.target.value }))}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-[#0a3d34] font-bold text-center placeholder:text-slate-300"
                />
              </div>
              {/* Fiyat */}
              <div className="space-y-1.5">
                <Label className="text-[0.72rem] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3" /> Fiyat (₺)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={entryForm.fiyat}
                  onChange={e => setEntryForm(prev => ({ ...prev, fiyat: e.target.value === "" ? "" : Number(e.target.value) }))}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-[#0a3d34] font-bold text-center placeholder:text-slate-300"
                />
              </div>
              {/* Kritik Limit */}
              <div className="space-y-1.5">
                <Label className="text-[0.72rem] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3" /> Kritik Limit
                </Label>
                <Input
                  type="number"
                  required
                  min={0}
                  placeholder="10"
                  value={entryForm.kritik}
                  onChange={e => setEntryForm(prev => ({ ...prev, kritik: e.target.value === "" ? "" : Number(e.target.value) }))}
                  className="h-11 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-[#0a3d34] font-bold text-center placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Birim Fiyat live preview */}
            {liveBirimFiyat > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className="text-[0.78rem] font-bold text-emerald-800">Hesaplanan Birim Fiyat</span>
                </div>
                <span className="text-[0.95rem] font-extrabold text-emerald-700">
                  {liveBirimFiyat.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                </span>
              </div>
            )}

            {/* Info banner for existing mode */}
            {entryMode === "existing" && selectedExistingId && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Plus className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <div className="text-[0.75rem] font-bold text-blue-800">Mevcut stok üzerine ekleme yapılacak</div>
                  <div className="text-[0.68rem] text-blue-600 mt-0.5">
                    Mevcut: {inventory.stock[selectedExistingId] || 0} {inventory.items.find(i => i.id === selectedExistingId)?.birim || "Adet"}
                    {Number(entryForm.adet) > 0 && (
                      <span className="font-bold"> → {(inventory.stock[selectedExistingId] || 0) + Number(entryForm.adet)} {inventory.items.find(i => i.id === selectedExistingId)?.birim || "Adet"}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl font-bold border-slate-200 hover:bg-slate-50" onClick={() => setModalOpen(false)}>
                Vazgeç
              </Button>
              <Button type="submit" className="flex-1 h-11 rounded-xl font-bold bg-gradient-to-r from-[#0a3d34] to-[#0d4f43] hover:from-[#072b25] hover:to-[#0a3d34] shadow-lg shadow-[#0a3d34]/20 transition-all duration-200">
                {entryMode === "existing" ? "Stok Ekle" : "Kaydet"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] text-center p-8">
           <div className="mx-auto w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4"><Trash2 className="w-8 h-8" /></div>
           <DialogHeader><DialogTitle className="text-center text-xl font-extrabold">Kalemi Sil?</DialogTitle></DialogHeader>
           <p className="text-sm text-slate-500 mb-6">Bu malzeme kaydı kalıcı olarak silinecektir. Emin misiniz?</p>
           <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteOpen(false)}>Hayır</Button>
              <Button variant="destructive" className="flex-1" onClick={executeDelete}>Evet, Sil</Button>
           </div>
        </DialogContent>
      </Dialog>
      
      {/* History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <History className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogHeader><DialogTitle className="text-[1.15rem] font-extrabold text-white tracking-tight">{selectedHistoryItem?.ad} - Stok Hareketleri</DialogTitle></DialogHeader>
                <p className="text-slate-300 text-[0.75rem] font-medium mt-0.5">Birim Maliyet değişimleri ve stok giriş/çıkış geçmişi</p>
              </div>
            </div>
          </div>
          
          <div className="p-0 max-h-[60vh] overflow-y-auto custom-scrollbar-dialog">
             {!selectedHistoryItem?.hareketler || selectedHistoryItem.hareketler.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic">Hiç stok hareketi bulunamadı.</div>
             ) : (
                <Table className="w-full">
                  <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="text-xs font-bold text-slate-500 py-3">Tarih</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 py-3">İşlem Tipi</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 py-3 text-center">Miktar</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 py-3 text-center">Stok (Eski → Yeni)</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 py-3 text-center">İşlem Maliyeti</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 py-3 text-center">Ort. Maliyet (Yeni)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...selectedHistoryItem.hareketler].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(mov => (
                      <TableRow key={mov.id} className="hover:bg-slate-50/50">
                        <TableCell className="text-xs text-slate-600 font-medium py-3 whitespace-nowrap">
                          {format(new Date(mov.date), "dd.MM.yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-col gap-0.5">
                            {mov.type === 'giris' && <span className="inline-block px-2 py-0.5 rounded text-[0.65rem] font-bold bg-emerald-100 text-emerald-700 self-start">GİRİŞ</span>}
                            {mov.type === 'cikis' && <span className="inline-block px-2 py-0.5 rounded text-[0.65rem] font-bold bg-rose-100 text-rose-700 self-start">ÇIKIŞ</span>}
                            {mov.type === 'duzeltme' && <span className="inline-block px-2 py-0.5 rounded text-[0.65rem] font-bold bg-blue-100 text-blue-700 self-start">DÜZELTME</span>}
                            {mov.note && <span className="text-[0.65rem] text-slate-400">{mov.note}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-center py-3">
                          {mov.type === 'giris' || mov.type === 'duzeltme' ? (
                            <span className="text-emerald-600">+{mov.amount}</span>
                          ) : (
                            <span className="text-rose-600">-{mov.amount}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-500 text-center py-3">
                          {mov.previous_stock} <span className="text-slate-300">→</span> <span className="font-bold text-slate-700">{mov.new_stock}</span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 text-center py-3">
                           {mov.type === 'giris' ? (
                             <div className="flex flex-col">
                               <span className="font-bold text-emerald-700">{mov.total_cost.toLocaleString("tr-TR", { minimumFractionDigits:2, maximumFractionDigits:2 })} ₺</span>
                               <span className="text-[0.65rem] text-slate-400">({mov.unit_cost.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺/Birim)</span>
                             </div>
                           ) : (
                             <span>-</span>
                           )}
                        </TableCell>
                        <TableCell className="text-xs font-extrabold text-[#0a3d34] text-center py-3">
                          {mov.new_avg_cost.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} ₺
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             )}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
             <Button variant="outline" onClick={() => setHistoryModalOpen(false)}>Kapat</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
