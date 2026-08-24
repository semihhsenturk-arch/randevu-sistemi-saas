import React, { useEffect, useState } from 'react';
import { X, Receipt, Syringe, DollarSign } from 'lucide-react';
import { useDatabase } from '@/hooks/use-database';

interface TransactionReceiptModalProps {
  receiptDateGroup: { date: string; txNo: string; treatments: any[] } | null;
  onClose: () => void;
  patientName?: string;
  stockHistory?: any[];
}

export function TransactionReceiptModal({ receiptDateGroup, onClose, patientName, stockHistory = [] }: TransactionReceiptModalProps) {
  const { getInventory } = useDatabase();
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  useEffect(() => {
    getInventory().then(data => {
      if (data && data.items) {
        setInventoryItems(data.items);
      }
    });
  }, [getInventory]);

  if (!receiptDateGroup) return null;

  const getMarkerColor = (type: string) => {
    switch (type) {
      case "botoks": return { bg: "#ef4444" };
      case "dolgu": return { bg: "#3b82f6" };
      case "mezoterapi": return { bg: "#10b981" };
      case "ip_aski": return { bg: "#8b5cf6" };
      default: return { bg: "#94a3b8" };
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="receipt-modal bg-white w-full max-w-[320px] max-h-[90vh] overflow-y-auto relative flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Receipt Top Tear */}
        <div className="receipt-tear-top" />
        
        {/* Receipt Header */}
        <div className="bg-slate-900 px-6 py-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <button onClick={onClose} className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-emerald-400">GÜNLÜK İŞLEM FİŞİ</span>
          </div>
          <div className="text-2xl font-mono font-black text-white tracking-wide">
            {receiptDateGroup.txNo}
          </div>
          {patientName && (
            <div className="text-xs font-bold text-white/60 mt-2">{patientName}</div>
          )}
        </div>

        {/* Receipt Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Date & Time */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider">Tarih</span>
            <span className="font-extrabold text-slate-700">{receiptDateGroup.date}</span>
          </div>

          {/* Dotted Divider */}
          <div className="border-t-2 border-dashed border-slate-200" />

          {/* Treatment Aggregate */}
          <div className="space-y-3">
            {(() => {
              const totals = receiptDateGroup.treatments.reduce((acc, t) => {
                if (!acc[t.type]) acc[t.type] = { amount: 0, count: 0, unit: t.unit };
                acc[t.type].amount += (t.amount || 0);
                acc[t.type].count += 1;
                return acc;
              }, {} as Record<string, { amount: number, count: number, unit: string }>);
              
              return Object.entries(totals).map(([type, data]) => (
                <div key={type} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: getMarkerColor(type as any).bg }}>
                    <Syringe className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-extrabold text-slate-800 capitalize">
                      {type === "botoks" ? "Botoks" : type === "dolgu" ? "Dolgu" : "Mezoterapi"}
                    </div>
                    <div className="text-xs font-medium text-slate-500">{data.count} Bölge İşlemi</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-800">{data.amount}</div>
                    <div className="text-[0.6rem] font-bold text-slate-400 uppercase">{data.unit}</div>
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* Dotted Divider */}
          <div className="border-t-2 border-dashed border-slate-200" />

          {/* Stock / Materials Used */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Syringe className="w-3 h-3 text-slate-400" />
              <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-wider">Kullanılan Malzemeler</span>
            </div>
            <div className="space-y-2">
              {(() => {
                const dateStocks = stockHistory.filter(h => {
                  const hDate = h.date.split(' ')[0];
                  return hDate === receiptDateGroup.date;
                });
                
                if (dateStocks.length === 0) {
                  return (
                    <div className="text-[0.65rem] font-medium text-slate-400 italic text-center py-2 bg-slate-50 rounded-lg border border-slate-100">
                      Bu işlem için malzeme düşümü bulunmuyor.
                    </div>
                  );
                }
                
                let grandTotalCost = 0;

                const stockBlocks = dateStocks.map((stock, i) => {
                  const itemRows = stock.text.split(", ").map((itemStr: string, j: number) => {
                    const parts = itemStr.trim().split(" ");
                    const amountStr = parts[0];
                    const amount = parseFloat(amountStr) || 0;
                    const amountAndUnit = parts.slice(0, 2).join(" ");
                    const itemName = parts.slice(2).join(" ");
                    
                    const invItem = inventoryItems.find(item => item.ad === itemName);
                    const unitPrice = invItem?.fiyat || 0;
                    const cost = unitPrice * amount;
                    grandTotalCost += cost;

                    return (
                      <div key={j} className="flex items-center justify-between mt-1">
                        <div className="flex flex-col min-w-0 pr-2">
                           <span className="text-[0.65rem] font-bold text-slate-700 leading-tight">{itemName || itemStr}</span>
                           {invItem?.kod && <span className="text-[0.55rem] font-bold text-slate-400 mt-0.5">Kod: {invItem.kod}</span>}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex flex-col items-end">
                             <span className="text-[0.65rem] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                               {itemName ? amountAndUnit : ""}
                             </span>
                             {unitPrice > 0 && (
                               <span className="text-[0.55rem] font-bold text-slate-400 mt-0.5">
                                 {unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ / {parts[1]}
                               </span>
                             )}
                          </div>
                          {cost > 0 && (
                            <div className="text-[0.7rem] font-black text-slate-800 w-[60px] text-right">
                              {cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });

                  return (
                    <div key={i} className="flex flex-col gap-1 bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                      <div className="text-[0.55rem] font-bold text-slate-400 mb-0.5">{stock.date.split(" ")[1] || ""}</div>
                      {itemRows}
                    </div>
                  );
                });

                return (
                  <>
                    {stockBlocks}
                    {grandTotalCost > 0 && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                        <span className="text-[0.7rem] font-extrabold text-slate-600 uppercase tracking-wider">Toplam Maliyet</span>
                        <span className="text-[1rem] font-black text-[#0a3d34]">
                          {grandTotalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Dotted Divider */}
          <div className="border-t-2 border-dashed border-slate-200" />

          {/* Transaction Barcode Style */}
          <div className="text-center">
            <div className="receipt-barcode mx-auto mb-2">
              {/* CSS barcode lines */}
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="receipt-barcode-line" style={{ height: `${12 + Math.random() * 16}px`, width: i % 3 === 0 ? '2.5px' : '1.5px' }} />
              ))}
            </div>
            <div className="text-sm font-mono font-black text-slate-800 tracking-[0.15em]">
              {receiptDateGroup.txNo}
            </div>
            <div className="text-[0.55rem] text-slate-400 font-medium mt-1">
              Bu fiş hastanın o günkü toplam işlemlerini gösterir.
            </div>
          </div>
        </div>

        {/* Receipt Bottom Tear */}
        <div className="receipt-tear-bottom" />
      </div>
    </div>
  );
}
