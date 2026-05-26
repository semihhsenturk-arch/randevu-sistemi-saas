"use client";

import { useState, useEffect, useMemo } from "react";
import { useDatabase, InventoryItem, getCacheSync, CACHE_KEYS } from "@/hooks/use-database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Warehouse, Search, Plus, Minus, Package, CheckCircle, AlertTriangle, Trash2, ArrowUpRight, SearchIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { tr } from "date-fns/locale/tr";
import { useAuth } from "@/hooks/use-auth";
import { UpgradeScreen } from "@/components/UpgradeScreen";

export default function StockManagementPage() {
  const { profile, isLoading, checkAccess } = useAuth();
  const { getInventory, saveInventoryItem, deleteInventoryItem } = useDatabase();
  const [inventory, setInventory] = useState<{ stock: Record<string, number>; items: InventoryItem[] }>({ stock: {}, items: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<{ ad: string, birim: string, kritik: number, baslangic: number }>({ ad: "", birim: "Adet", kritik: 10, baslangic: 0 });

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedItemToDelete, setSelectedItemToDelete] = useState<InventoryItem | null>(null);
  const [adjustAmounts, setAdjustAmounts] = useState<Record<string, string>>({});

  const isLocked = !checkAccess("advanced");

  useEffect(() => {
    // Load from cache first
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
    
    await saveInventoryItem(item, newQty);
    setInventory(prev => ({ ...prev, stock: { ...prev.stock, [item.id]: newQty } }));
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.ad) return;
    const id = "item_" + Math.random().toString(36).substr(2, 9);
    const itemObj: InventoryItem = { id, ad: newItem.ad, birim: newItem.birim, kritik_stok: newItem.kritik };
    await saveInventoryItem(itemObj, newItem.baslangic);
    setInventory(prev => ({
      items: [...prev.items, itemObj],
      stock: { ...prev.stock, [id]: newItem.baslangic }
    }));
    setModalOpen(false);
    setNewItem({ ad: "", birim: "Adet", kritik: 10, baslangic: 0 });
  };

  const executeDelete = async () => {
    if (!selectedItemToDelete) return;
    await deleteInventoryItem(selectedItemToDelete.id);
    setInventory(prev => ({
      items: prev.items.filter(i => i.id !== selectedItemToDelete.id),
      stock: { ...prev.stock, [selectedItemToDelete.id]: 0 }
    }));
    setConfirmDeleteOpen(false);
    setSelectedItemToDelete(null);
  };

  const confirmDelete = (item: InventoryItem) => {
    setSelectedItemToDelete(item);
    setConfirmDeleteOpen(true);
  };

  const filteredItems = inventory.items
    .filter(i => i.ad.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.ad.localeCompare(b.ad, "tr"));

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
           <Button onClick={() => setModalOpen(true)} className="bg-[#0a3d34] hover:bg-[#072b25] h-11 px-6 rounded-xl font-bold w-full sm:w-auto">
             <Plus className="w-4 h-4 mr-2" /> Yeni Kalem
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
                  <div className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">{item.birim}</div>
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
                 <div className="text-[0.7rem] font-bold text-slate-400">Kritik Limit: <span className="text-slate-900">{crit}</span></div>
                 <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-bold" onClick={() => confirmDelete(item)}>
                   <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Sil
                 </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block bg-white rounded-[20px] shadow-sm border border-slate-200 overflow-hidden relative min-h-[400px]">
        <div className="overflow-x-auto w-full">
        <Table className="min-w-[600px] w-full">
          <TableHeader className="bg-gradient-to-r from-slate-700 to-slate-800 hover:bg-transparent">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-white font-bold uppercase tracking-wider text-[0.72rem] py-4 text-center">Malzeme / Birim</TableHead>
              <TableHead className="text-white font-bold uppercase tracking-wider text-[0.72rem] py-4 text-center">Mevcut Miktar</TableHead>
              <TableHead className="text-white font-bold uppercase tracking-wider text-[0.72rem] py-4 text-center">Kritik Limit</TableHead>
              <TableHead className="text-white font-bold uppercase tracking-wider text-[0.72rem] py-4 text-center">Durum</TableHead>
              <TableHead className="text-white font-bold uppercase tracking-wider text-[0.72rem] py-4 text-center">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500">Kayıt bulunamadı.</TableCell></TableRow>
            ) : filteredItems.map(item => {
              const qty = inventory.stock[item.id] || 0;
              const crit = item.kritik_stok || 10;
              const isLow = qty <= crit;
              return (
                <TableRow key={item.id} className={`hover:bg-emerald-50/30 transition-colors ${isLow ? 'bg-red-50/20' : ''}`}>
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
                    <div className="flex items-center justify-center gap-3">
                      {/* Grouped Stepper Control */}
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader><DialogTitle className="text-xl font-extrabold text-[#111827]">Yeni Kalem Ekle</DialogTitle></DialogHeader>
          <form className="space-y-4 pt-4" onSubmit={handleCreateNew}>
            <div className="space-y-2"><Label>Malzeme Adı</Label><Input required value={newItem.ad} onChange={e => setNewItem(prev => ({...prev, ad: e.target.value}))} /></div>
            <div className="space-y-2"><Label>Birimi (Adet, Ünite, Kutu vs.)</Label><Input required value={newItem.birim} onChange={e => setNewItem(prev => ({...prev, birim: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Başlangıç Miktarı</Label><Input type="number" required value={newItem.baslangic} onChange={e => setNewItem(prev => ({...prev, baslangic: Number(e.target.value)}))} /></div>
              <div className="space-y-2"><Label>Kritik Limit</Label><Input type="number" required value={newItem.kritik} onChange={e => setNewItem(prev => ({...prev, kritik: Number(e.target.value)}))} /></div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Vazgeç</Button>
              <Button type="submit" className="flex-1 bg-[#0a3d34] hover:bg-[#072b25]">Kaydet</Button>
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
    </div>
  );
}
