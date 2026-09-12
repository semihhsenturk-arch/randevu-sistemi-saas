"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Search, ChevronRight } from "lucide-react";
import { useDatabase, InventoryItem, PatientProfile } from "@/hooks/use-database";
import { collectAllTxNos } from "@/hooks/useTransactionMapping";
import { format, subDays } from "date-fns";
import { tr } from "date-fns/locale/tr";
import { toast } from "sonner";
import { PatientService } from "@/services/patient-service";
import { useAuth } from "@/hooks/use-auth";

interface WasteDistributionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryItems: InventoryItem[];
  inventoryStock: Record<string, number>;
  onSuccess: () => void;
}

export function WasteDistributionModal({ open, onOpenChange, inventoryItems, inventoryStock, onSuccess }: WasteDistributionModalProps) {
  const { user } = useAuth();
  const { saveInventoryItem } = useDatabase();
  const [step, setStep] = useState<1 | 2>(1);
  const [patientProfiles, setPatientProfiles] = useState<Record<string, Omit<PatientProfile, "patient_name">>>({});
  
  // Step 1 State
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [wasteAmount, setWasteAmount] = useState<string>("");
  
  // Step 2 State
  const [txSearch, setTxSearch] = useState("");
  const [selectedTxNos, setSelectedTxNos] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedItemId("");
      setWasteAmount("");
      setSelectedTxNos(new Set());
      setTxSearch("");
      PatientService.getProfiles(user?.id).then(setPatientProfiles);
    }
  }, [open, user?.id]);

  const parseSafeDate = (dStr: string) => {
    if (!dStr) return new Date(0);
    if (dStr.includes('.')) {
      const parts = dStr.split('.');
      if (parts.length >= 3 && parts[2].length === 4) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };

  const allTransactions = useMemo(() => {
    return collectAllTxNos(patientProfiles).sort((a, b) => {
      // Sort by date descending
      const dateA = parseSafeDate(a.dateStr).getTime();
      const dateB = parseSafeDate(b.dateStr).getTime();
      if (dateA !== dateB) return dateB - dateA;
      // Then by txNo descending
      return b.txNo.localeCompare(a.txNo, 'tr', { numeric: true });
    });
  }, [patientProfiles]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(tx => {
      const searchStr = txSearch.toLowerCase();
      return tx.txNo.toLowerCase().includes(searchStr) || 
             tx.patientName.toLowerCase().includes(searchStr) ||
             tx.dateStr.includes(searchStr);
    });
  }, [allTransactions, txSearch]);

  const selectedItem = inventoryItems.find(i => i.id === selectedItemId);
  const numWasteAmount = parseFloat(wasteAmount.replace(',', '.')) || 0;
  const unitWaste = selectedTxNos.size > 0 ? (numWasteAmount / selectedTxNos.size) : 0;
  
  const handleNext = () => {
    if (!selectedItem) {
      toast.error("Lütfen malzeme seçin");
      return;
    }
    if (numWasteAmount <= 0) {
      toast.error("Geçerli bir fire miktarı girin");
      return;
    }
    const currentStock = inventoryStock[selectedItem.id] || 0;
    if (numWasteAmount > currentStock) {
      toast.error(`Yetersiz stok. Mevcut stok: ${currentStock} ${selectedItem.birim}`);
      return;
    }
    setStep(2);
  };

  const toggleTxSelection = (txNo: string) => {
    const newSet = new Set(selectedTxNos);
    if (newSet.has(txNo)) {
      newSet.delete(txNo);
    } else {
      newSet.add(txNo);
    }
    setSelectedTxNos(newSet);
  };

  const selectLastDays = (days: number) => {
    const targetDateStr = format(subDays(new Date(), days), "yyyy-MM-dd");
    const newSet = new Set(selectedTxNos);
    allTransactions.forEach(tx => {
      if (tx.dateStr >= targetDateStr) {
        newSet.add(tx.txNo);
      }
    });
    setSelectedTxNos(newSet);
  };

  const handleDistribute = async () => {
    if (!selectedItem || numWasteAmount <= 0 || selectedTxNos.size === 0) return;

    setLoading(true);
    try {
      // 1. Deduct from inventory
      const currentQty = inventoryStock[selectedItem.id] || 0;
      const newQty = Math.max(0, currentQty - numWasteAmount);
      const unitCost = selectedItem.fiyat || 0;
      const totalCost = numWasteAmount * unitCost;

      const movement: any = {
        id: "mov_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        date: new Date().toISOString(),
        type: 'cikis',
        amount: numWasteAmount,
        unit_cost: unitCost,
        total_cost: totalCost,
        previous_stock: currentQty,
        new_stock: newQty,
        previous_avg_cost: unitCost,
        new_avg_cost: unitCost,
        note: 'Stok Çıkış / Fire (Dağıtıldı)'
      };

      const updatedItem = {
        ...selectedItem,
        toplam_deger: newQty * unitCost,
        hareketler: [...(selectedItem.hareketler || []), movement]
      };

      await saveInventoryItem(updatedItem, newQty);

      // 2. Distribute to selected transactions
      const promises = [];
      const distributionCost = unitWaste * unitCost;
      
      for (const txNo of Array.from(selectedTxNos)) {
        const tx = allTransactions.find(t => t.txNo === txNo);
        if (!tx) continue;

        const pName = tx.patientName.toLocaleUpperCase("tr-TR");
        const profile = patientProfiles[pName];
        if (!profile) continue;

        const newStockHistoryEntry = {
          id: "mov_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
          date: format(new Date(), "yyyy-MM-dd HH:mm"),
          transaction_no: txNo,
          text: `${Number(unitWaste.toFixed(2))} ${selectedItem.birim} ${selectedItem.ad} (Fire Payı) [Maliyet: ${unitCost}]`,
          cost_items: [{
            name: `${selectedItem.ad} (Fire Payı)`,
            amount: unitWaste,
            unit: selectedItem.birim,
            unitCost: unitCost,
            totalCost: distributionCost
          }]
        };

        const updatedProfile = {
          ...profile,
          stock_history: [...(profile.stock_history || []), newStockHistoryEntry]
        };
        
        promises.push(PatientService.saveProfile(user?.id, tx.patientName, updatedProfile));
      }

      await Promise.all(promises);

      toast.success(`${numWasteAmount} ${selectedItem.birim} fire, ${selectedTxNos.size} işleme başarıyla dağıtıldı ve stoktan düşüldü.`);
      onSuccess();
      onOpenChange(false);

    } catch (e) {
      console.error(e);
      toast.error("Fire dağıtımı sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-slate-50 border-slate-200 gap-0">
        <div className="bg-gradient-to-r from-orange-500 to-rose-500 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <DialogTitle className="text-xl font-extrabold text-white">Fire Dağıtımı</DialogTitle>
            <DialogDescription className="text-white/80 font-medium text-sm mt-0.5">
              Ziyan olan malzeme miktarını fişlere maliyet olarak dağıtın.
            </DialogDescription>
          </div>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fire Verilen Malzeme</Label>
                  <select
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 font-semibold text-slate-700 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                  >
                    <option value="" disabled>Seçiniz...</option>
                    {inventoryItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.ad} (Mevcut: {inventoryStock[item.id] || 0} {item.birim})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fire Miktarı</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={wasteAmount}
                      onChange={(e) => setWasteAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                      placeholder="Örn: 20"
                      className="h-11 bg-white border-slate-200 font-bold text-lg focus-visible:ring-orange-500 pr-16"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 select-none">
                      {selectedItem ? selectedItem.birim : "Birim"}
                    </div>
                  </div>
                  {selectedItem && numWasteAmount > 0 && (
                    <div className="text-[0.7rem] font-bold text-orange-600 mt-1">
                      Bu miktar stoktan otomatik olarak düşülecektir.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200">
                <Button 
                  onClick={handleNext} 
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 px-8 rounded-xl"
                  disabled={!selectedItem || numWasteAmount <= 0}
                >
                  Fişleri Seç <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-[60vh] max-h-[500px]">
              
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    <span className="text-orange-600">{numWasteAmount} {selectedItem?.birim}</span> {selectedItem?.ad} dağıtılacak.
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    {selectedTxNos.size > 0 ? (
                      <span>Fiş başına: <span className="font-bold text-slate-700">{unitWaste.toLocaleString("tr-TR", {maximumFractionDigits: 2})} {selectedItem?.birim}</span></span>
                    ) : (
                      "Dağıtılacak fişleri seçin"
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => selectLastDays(1)} className="h-8 text-xs font-bold">Bugün</Button>
                  <Button variant="outline" size="sm" onClick={() => selectLastDays(7)} className="h-8 text-xs font-bold">Son 7 Gün</Button>
                </div>
              </div>

              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Fiş no, hasta veya tarih ara..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="pl-9 h-10 bg-white"
                />
              </div>

              <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-xl custom-scrollbar-inner">
                {filteredTransactions.length === 0 ? (
                  <div className="p-8 text-center text-sm font-medium text-slate-400">Fiş bulunamadı.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredTransactions.map(tx => (
                      <label key={tx.txNo} className="flex items-center p-3 hover:bg-slate-50 cursor-pointer transition-colors group">
                        <input
                          type="checkbox"
                          checked={selectedTxNos.has(tx.txNo)}
                          onChange={() => toggleTxSelection(tx.txNo)}
                          className="mr-4 w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-sm font-bold text-slate-800 truncate">{tx.patientName}</span>
                            <span className="text-[0.65rem] font-bold text-slate-400">
                              {tx.dateStr ? format(parseSafeDate(tx.dateStr), "d MMM", {locale: tr}) : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[0.65rem] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{tx.txNo}</span>
                            {tx.type && typeof tx.type === 'string' && <span className="text-[0.65rem] font-semibold text-slate-400 capitalize">{tx.type.replace('_', ' ')}</span>}
                            {tx.isControl && <span className="text-[0.65rem] font-semibold text-orange-500">Kontrol</span>}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200 shrink-0">
                <Button variant="ghost" onClick={() => setStep(1)} className="font-bold text-slate-500 hover:text-slate-700">
                  Geri Dön
                </Button>
                <Button 
                  onClick={handleDistribute} 
                  disabled={loading || selectedTxNos.size === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-8 rounded-xl"
                >
                  {loading ? "Dağıtılıyor..." : `${selectedTxNos.size} Fişe Dağıt ve Kaydet`}
                </Button>
              </div>

            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
