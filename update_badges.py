import re

with open("src/app/(dashboard)/hasta-listesi/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Timeline (Geçmiş İşlemler)
old_timeline_date = r'<div className="text-\[0\.7rem\] font-bold text-slate-400 tracking-wide uppercase flex items-center gap-1\.5">\s*<Clock className="w-3 h-3 text-blue-500"/> \{a\.tarih\} · \{a\.saat\}\s*</div>'

new_timeline_date = """<div className="text-[0.7rem] font-bold text-slate-400 tracking-wide uppercase flex items-center gap-1.5">
                                        <Clock className="w-3 h-3 text-blue-500"/> {a.tarih} · {a.saat}
                                        {dateFaceTreatments.length > 0 && dateFaceTreatments[0].transactionNo && (
                                          <span className="ml-2 px-2 py-0.5 rounded-md bg-slate-800 text-white font-mono font-extrabold text-[0.6rem] shadow-sm">
                                            {dateFaceTreatments[0].transactionNo}
                                          </span>
                                        )}
                                      </div>"""

content = re.sub(old_timeline_date, new_timeline_date, content)

# 2. Update Stock History (Stok Geçmişi)
old_stock_date = r'<div className="font-bold text-slate-700 text-sm flex items-center gap-2">\s*<Clock className="w-4 h-4 text-amber-500" /> \{dateStr\}\s*</div>'

new_stock_date = """<div className="font-bold text-slate-700 text-sm flex items-center gap-2">
                               <Clock className="w-4 h-4 text-amber-500" /> {dateStr}
                               {(() => {
                                 const txNo = (selProfile.face_treatments || []).find(ft => ft.date.startsWith(dateStr))?.transactionNo;
                                 return txNo ? (
                                   <span className="ml-2 px-2 py-0.5 rounded-md bg-slate-800 text-white font-mono font-extrabold text-[0.65rem] shadow-sm">
                                     {txNo}
                                   </span>
                                 ) : null;
                               })()}
                             </div>"""

content = re.sub(old_stock_date, new_stock_date, content)

with open("src/app/(dashboard)/hasta-listesi/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("done")
