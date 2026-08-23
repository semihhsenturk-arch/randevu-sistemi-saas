import re

with open("src/components/FaceMap.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update state
content = content.replace(
    'const [receiptTreatment, setReceiptTreatment] = useState<FaceTreatment | null>(null);',
    'const [receiptDateGroup, setReceiptDateGroup] = useState<{ date: string, txNo: string, treatments: FaceTreatment[] } | null>(null);'
)

# 2. Update tooltip (keep transactionNo but maybe remove it from individual markers or leave it? User said "üstte tarihin başında olsun". Better to remove it from individual marker tooltip to avoid clutter)
tooltip_pattern = r'\{t\.transactionNo && \(\s*<div className="text-\[0\.6rem\] font-mono font-extrabold text-slate-600 bg-slate-100 px-1\.5 py-0\.5 rounded">\{t\.transactionNo\}<\/div>\s*\)\}'
content = re.sub(tooltip_pattern, '', content)

# 3. Update date buttons
old_date_render = r'<button key=\{date\}\s+onClick=\{[^}]+\}\s+className=\{`px-2\.5 py-1\.5 rounded-lg text-\[0\.6rem\] font-bold transition-all border flex flex-col items-start gap-0\.5 [^`]+`\}\s*>\s*<span>\{date\} · \{items\.length\} işlem · <span className="font-extrabold">\{totalUnits\} ünite<\/span><\/span>\s*<\/button>'

new_date_render = """<div key={date} className="w-full flex items-stretch gap-1">
                    <button
                      onClick={() => setSelectedDate(selectedDate === date ? null : date)}
                      className={`flex-1 px-2.5 py-1.5 rounded-lg text-[0.6rem] font-bold transition-all border flex items-center justify-between gap-1 ${selectedDate === date ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm" : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"}`}
                    >
                      <span>{date} · {items.length} işlem · <span className="font-extrabold">{totalUnits} ünite</span></span>
                    </button>
                    {items[0]?.transactionNo && (
                      <button
                        onClick={() => setReceiptDateGroup({ date, txNo: items[0].transactionNo!, treatments: items })}
                        className="px-2.5 rounded-lg bg-slate-800 text-white font-mono font-bold text-[0.55rem] hover:bg-slate-900 transition-colors flex items-center justify-center shrink-0 shadow-sm"
                        title="İşlem Fişini Gör"
                      >
                        <Receipt className="w-3 h-3 mr-1" />
                        {items[0].transactionNo}
                      </button>
                    )}
                  </div>"""

content = re.sub(old_date_render, new_date_render, content)

# 4. Remove the individual black badge button from the list
badge_pattern = r'\{t\.transactionNo && \(\s*<button\s*onClick=\{\(e\) => \{ e\.stopPropagation\(\); setReceiptTreatment\(t\); \}\}\s*className="text-\[0\.55rem\] font-mono font-extrabold px-1\.5 py-0\.5 rounded-md bg-slate-800 text-white hover:bg-slate-900 transition-colors cursor-pointer"\s*title="İşlem Özeti"\s*>\s*\{t\.transactionNo\}\s*<\/button>\s*\)\}'
content = re.sub(badge_pattern, '', content)

# 5. Fix spacing in active treatments list title
content = content.replace(
    '<div className="text-xs font-black text-slate-800 flex items-center gap-1.5 flex-wrap">',
    '<div className="text-xs font-black text-slate-800 flex items-center gap-1.5">'
)

# 6. Update the Receipt Modal code
old_modal_regex = re.compile(r'\{\s*receiptTreatment\s*&&\s*\(\s*<div className="fixed inset-0[^>]+>.*?(?=</div\s*>\s*</div\s*>\s*\)\s*}\s*</div\s*>\s*\)\s*;\s*}\s*export default FaceMap;)', re.DOTALL)
# Wait, parsing HTML with regex is risky. Let's find the substring `{receiptTreatment && (` up to `)}` manually.

idx = content.find('{receiptTreatment && (')
if idx != -1:
    end_idx = content.find('</div>\n      )}\n    </div>', idx)
    
    if end_idx != -1:
        new_modal = """{receiptDateGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setReceiptDateGroup(null)}>
          <div className="receipt-modal bg-white w-full max-w-[320px] max-h-[90vh] overflow-y-auto relative flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Receipt Top Tear */}
            <div className="receipt-tear-top" />
            
            {/* Receipt Header */}
            <div className="bg-slate-900 px-6 py-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <button onClick={() => setReceiptDateGroup(null)} className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors">
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

              {/* Mini FaceMap */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-wider">İşlem Bölgeleri</span>
                </div>
                <div className="relative w-full aspect-square max-w-[180px] mx-auto bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                  <img
                    src={isFemale ? "/images/face-female.png" : "/images/face-male.png"}
                    alt="Yüz Haritası"
                    className="w-full h-full object-contain opacity-50"
                    draggable={false}
                  />
                  {receiptDateGroup.treatments.map((t, idx) => {
                    const pos = parsePos(t.zone);
                    const colors = getMarkerColor(t.type);
                    return (
                      <div key={t.id} style={{ position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)", zIndex: 10 }}>
                        <div className="absolute inset-0 rounded-full" style={{ background: colors.light, width: 24, height: 24, margin: "-4px", opacity: 0.5 }} />
                        <div className="relative rounded-full border-2 border-white shadow flex items-center justify-center" style={{ background: colors.bg, width: 16, height: 16 }}>
                          <span style={{ fontSize: 7, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{idx + 1}</span>
                        </div>
                      </div>
                    );
                  })}
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
        </div>"""
        content = content[:idx] + new_modal + content[end_idx:]

with open("src/components/FaceMap.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("done")
