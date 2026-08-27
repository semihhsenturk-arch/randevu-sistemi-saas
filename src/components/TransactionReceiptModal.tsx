import React, { useEffect, useState } from 'react';
import { X, Receipt, Syringe, DollarSign } from 'lucide-react';
import { useDatabase } from '@/hooks/use-database';

interface TransactionReceiptModalProps {
  receiptDateGroup: { date: string; txNo: string; treatments: any[] } | null;
  onClose: () => void;
  patientName?: string;
  stockHistory?: any[];
  allTreatments?: any[];
}

export function TransactionReceiptModal({ receiptDateGroup, onClose, patientName, stockHistory = [], allTreatments = [] }: TransactionReceiptModalProps) {
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

  const targetDateStr = receiptDateGroup.date;
  
  // 1. Exact date match on stock entry date
  let relevantStocks = stockHistory.filter(h => h.date.split(' ')[0] === targetDateStr);
  
  // 2. Match via treatment_date field (if stock was deducted on a different day but linked to this treatment)
  if (relevantStocks.length === 0) {
    relevantStocks = stockHistory.filter(h => h.treatment_date && h.treatment_date.split(' ')[0] === targetDateStr);
  }
  
  // 3. Try today's date as fallback
  if (relevantStocks.length === 0) {
    const today = new Date();
    const todayStr = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
    relevantStocks = stockHistory.filter(h => h.date.includes(todayStr));
  }
  
  // 4. If still no match, show all stock history (better than showing nothing)
  if (relevantStocks.length === 0 && stockHistory.length > 0) {
    relevantStocks = stockHistory;
  }
  const firstTime = relevantStocks.length > 0 ? (relevantStocks[0].date.split(" ")[1] || "") : "";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="receipt-modal bg-white w-full max-w-[280px] max-h-[90vh] overflow-y-auto relative flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        
        {/* Receipt Header (Simplified) */}
        <div className="bg-slate-900 px-4 py-3 flex flex-col items-center justify-center text-center relative overflow-hidden shrink-0">
          <div className="absolute top-2 right-2">
            <button onClick={onClose} className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center gap-1">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-emerald-400">
              GÜNLÜK İŞLEM FİŞİ
            </span>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="px-4 py-4 flex flex-col items-center space-y-3">
          
          {/* Is this a control receipt? */}
          {receiptDateGroup.treatments.some(t => t.isControl) && (
            <div className="w-full text-center bg-orange-50 border border-orange-100 rounded p-1.5 mb-1 text-[0.6rem] font-bold text-orange-600">
              Bu bir kontrol seansıdır. 
              {receiptDateGroup.treatments.find(t => t.isControl)?.parentTransactionNo && ` (${receiptDateGroup.treatments.find(t => t.isControl)?.parentTransactionNo} nolu işlemin kontrolü)`}
            </div>
          )}
          
          {/* Patient Info & Date */}
          <div className="flex flex-col items-center justify-center text-center space-y-0.5">
            {patientName && (
              <div className="text-base font-black text-slate-800 leading-tight">{patientName}</div>
            )}
            <div className="text-[0.7rem] font-bold text-slate-500">
              {receiptDateGroup.date} {firstTime ? ` - ${firstTime}` : ''}
            </div>
          </div>

          {/* Dotted Divider */}
          <div className="w-full border-t-2 border-dashed border-slate-200" />

          {/* Treatment Aggregate */}
          <div className="flex flex-col items-center w-full space-y-2">
            <div className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-wider">İşlem Detayları</div>
            {(() => {
              const totals = receiptDateGroup.treatments.reduce((acc, t) => {
                if (!acc[t.type]) acc[t.type] = { amount: 0, count: 0, unit: t.unit };
                acc[t.type].amount += (t.amount || 0);
                acc[t.type].count += 1;
                return acc;
              }, {} as Record<string, { amount: number, count: number, unit: string }>);
              
              return Object.entries(totals).map(([type, dataVal]) => {
                const data = dataVal as { amount: number, count: number, unit: string };
                return (
                <div key={type} className="flex flex-col items-center text-center">
                  <div className="text-sm font-extrabold text-slate-800 capitalize leading-tight">
                    {type === "botoks" ? "Botoks" : type === "dolgu" ? "Dolgu" : type === "ip_aski" ? "İp Askı" : "Mezoterapi"}
                  </div>
                  <div className="text-[0.65rem] font-semibold text-slate-500 mt-0.5">
                    {data.count} Bölge İşlemi • <span className="font-bold text-emerald-600">{data.amount} {data.unit.toUpperCase()}</span>
                  </div>
                </div>
                );
              });
            })()}
          </div>

          {/* Dotted Divider */}
          <div className="w-full border-t-2 border-dashed border-slate-200" />

          {/* Stock / Materials Used */}
          <div className="flex flex-col items-center w-full">
            <div className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-wider mb-2">Kullanılan Malzemeler</div>
            <div className="flex flex-col items-center w-full">
              {(() => {
                if (relevantStocks.length === 0) {
                  return (
                    <div className="text-[0.6rem] font-medium text-slate-400 italic text-center">
                      Malzeme düşümü bulunmuyor.
                    </div>
                  );
                }
                
                let grandTotalCost = 0;

                const stockBlocks = relevantStocks.map((stock, i) => {
                  const itemRows = stock.text.split(", ").map((itemStr: string, j: number) => {
                    const costMatch = itemStr.match(/\[Maliyet:\s*([\d.]+)\]/);
                    const embeddedUnitPrice = costMatch ? parseFloat(costMatch[1]) : null;

                    const cleanItemStr = itemStr
                      .replace(/\s*\(Toplam Maliyet:.*?\)/g, "")
                      .replace(/\s*\(Maliyet:.*?\)/g, "")
                      .replace(/\s*\[Toplam Maliyet:.*?\]/g, "")
                      .replace(/\s*\[Maliyet:.*?\]/g, "")
                      .trim();
                    const parts = cleanItemStr.split(" ");
                    const amountStr = parts[0];
                    const amount = parseFloat(amountStr) || 0;
                    const amountAndUnit = parts.slice(0, 2).join(" ");
                    const itemName = parts.slice(2).join(" ");
                    
                    const invItem = inventoryItems.find(item => item.ad === itemName);
                    const unitPrice = embeddedUnitPrice !== null ? embeddedUnitPrice : (invItem?.fiyat || 0);
                    const cost = unitPrice * amount;
                    grandTotalCost += cost;

                    return (
                      <div key={j} className="flex items-center justify-between mt-1.5 w-full text-left bg-slate-50 border border-slate-100 p-2 rounded-lg">
                        <div className="flex flex-col min-w-0 pr-2">
                           <span className="text-[0.65rem] font-bold text-slate-700 leading-tight">{itemName || itemStr}</span>
                           {invItem?.kod && <span className="text-[0.55rem] font-bold text-slate-400 mt-0.5">Kod: {invItem.kod}</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex flex-col items-end">
                             <span className="text-[0.65rem] font-extrabold text-emerald-600 bg-emerald-100/50 px-1.5 py-0.5 rounded">
                               {itemName ? amountAndUnit : ""}
                             </span>
                             {unitPrice > 0 && (
                               <span className="text-[0.55rem] font-bold text-slate-400 mt-0.5">
                                 {unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ₺ / {parts[1] || 'br'}
                               </span>
                             )}
                          </div>
                          {cost > 0 && (
                            <div className="text-[0.7rem] font-black text-slate-800 w-[50px] text-right">
                              {cost.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ₺
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });

                  return (
                    <div key={i} className="flex flex-col items-stretch w-full">
                      {itemRows}
                    </div>
                  );
                });

                return (
                  <>
                    <div className="flex flex-col space-y-1 w-full">{stockBlocks}</div>
                    {grandTotalCost > 0 && (
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 w-full">
                        <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Toplam Maliyet</span>
                        <span className="text-sm font-black text-[#0a3d34]">
                          {grandTotalCost.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ₺
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Dotted Divider */}
          <div className="w-full border-t-2 border-dashed border-slate-200" />

          {/* Child Control Sessions Aggregation */}
          {(() => {
            const childControls = allTreatments.filter(t => t.isControl && t.parentTransactionNo === receiptDateGroup.txNo);
            if (childControls.length === 0) return null;

            // Find unique dates of child controls
            const childDates = Array.from(new Set(childControls.map(t => t.date.split(" ")[0])));
            
            // Collect material costs for those dates
            let totalControlCost = 0;
            const controlCostsByDate: Record<string, number> = {};

            childDates.forEach(dateStr => {
              let relevantStocksForChild = stockHistory.filter(h => h.date.split(' ')[0] === dateStr || (h.treatment_date && h.treatment_date.split(' ')[0] === dateStr));
              let dateCost = 0;

              relevantStocksForChild.forEach(stock => {
                const itemRows = stock.text.split(", ").forEach((itemStr: string) => {
                  const costMatch = itemStr.match(/\[Maliyet:\s*([\d.]+)\]/);
                  const embeddedUnitPrice = costMatch ? parseFloat(costMatch[1]) : null;

                  const cleanItemStr = itemStr
                    .replace(/\s*\(Toplam Maliyet:.*?\)/g, "")
                    .replace(/\s*\(Maliyet:.*?\)/g, "")
                    .replace(/\s*\[Toplam Maliyet:.*?\]/g, "")
                    .replace(/\s*\[Maliyet:.*?\]/g, "")
                    .trim();
                  const parts = cleanItemStr.split(" ");
                  const amount = parseFloat(parts[0]) || 0;
                  const itemName = parts.slice(2).join(" ");
                  const invItem = inventoryItems.find(item => item.ad === itemName);
                  const unitPrice = embeddedUnitPrice !== null ? embeddedUnitPrice : (invItem?.fiyat || 0);
                  dateCost += (unitPrice * amount);
                });
              });

              if (dateCost > 0) {
                controlCostsByDate[dateStr] = dateCost;
                totalControlCost += dateCost;
              }
            });

            if (totalControlCost === 0) return null;

            return (
              <div className="flex flex-col items-center w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[0.6rem] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center leading-tight">
                  Kontrol Seansları <br/> Ekstra Maliyeti
                </div>
                
                <div className="flex flex-col w-full space-y-1 mb-2">
                  {Object.entries(controlCostsByDate).map(([dStr, cost]) => (
                    <div key={dStr} className="flex justify-between items-center text-[0.65rem] border-b border-slate-200/50 pb-1 last:border-0 last:pb-0">
                      <span className="font-semibold text-slate-600">{dStr}</span>
                      <span className="font-bold text-orange-600">{cost.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ₺</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 w-full mt-1">
                  <span className="text-[0.65rem] font-extrabold text-slate-700">Toplam</span>
                  <span className="text-xs font-black text-orange-600">
                    {totalControlCost.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ₺
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Dotted Divider (if child controls exist, we need one before barcode) */}
          {allTreatments.some(t => t.isControl && t.parentTransactionNo === receiptDateGroup.txNo) && (
            <div className="w-full border-t-2 border-dashed border-slate-200" />
          )}

          {/* Transaction Barcode Style */}
          <div className="text-center w-full">
            <div className="receipt-barcode mx-auto mb-1 flex justify-center">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="receipt-barcode-line" style={{ height: `${10 + Math.random() * 12}px`, width: i % 3 === 0 ? '2px' : '1px', margin: '0 0.5px', backgroundColor: '#334155' }} />
              ))}
            </div>
            <div className="text-[0.7rem] font-mono font-black text-slate-800 tracking-[0.15em]">
              {receiptDateGroup.txNo}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
