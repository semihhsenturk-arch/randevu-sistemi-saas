import re

# 1. Update FaceMap.tsx
with open("src/components/FaceMap.tsx", "r", encoding="utf-8") as f:
    facemap_content = f.read()

# Add import
facemap_content = facemap_content.replace(
    'import { X, Plus, Syringe, Clock, ZoomIn, ZoomOut, RotateCcw, Trash2, Maximize2, Minimize2, Pencil, Receipt, MapPin } from "lucide-react";',
    'import { X, Plus, Syringe, Clock, ZoomIn, ZoomOut, RotateCcw, Trash2, Maximize2, Minimize2, Pencil, Receipt, MapPin } from "lucide-react";\nimport { TransactionReceiptModal } from "./TransactionReceiptModal";'
)

# Replace the modal code with the component
start_idx = facemap_content.find('{/* ═══════ Receipt / İşlem Fişi Modal ═══════ */}')
if start_idx != -1:
    end_idx = facemap_content.rfind('</div>', 0, len(facemap_content) - 10) # Find the last </div> before the final one
    new_modal = """{/* ═══════ Receipt / İşlem Fişi Modal ═══════ */}
      <TransactionReceiptModal
        receiptDateGroup={receiptDateGroup}
        onClose={() => setReceiptDateGroup(null)}
        patientName={patientName}
        stockHistory={stockHistory}
      />"""
    # Just replace from start_idx to the end, then add the final closing tags
    facemap_content = facemap_content[:start_idx] + new_modal + "\n    </div>\n  );\n}\n"

with open("src/components/FaceMap.tsx", "w", encoding="utf-8") as f:
    f.write(facemap_content)


# 2. Update page.tsx
with open("src/app/(dashboard)/hasta-listesi/page.tsx", "r", encoding="utf-8") as f:
    page_content = f.read()

# Add import
page_content = page_content.replace(
    'import { FaceMap } from "@/components/FaceMap";',
    'import { FaceMap } from "@/components/FaceMap";\nimport { TransactionReceiptModal } from "@/components/TransactionReceiptModal";'
)

# Add global state for the receipt
state_insertion = r'const \[selectedPatientName, setSelectedPatientName\] = useState<string \| null>\(null\);'
new_state = 'const [selectedPatientName, setSelectedPatientName] = useState<string | null>(null);\n  const [globalReceiptGroup, setGlobalReceiptGroup] = useState<{ date: string; txNo: string; treatments: any[] } | null>(null);'
page_content = re.sub(state_insertion, new_state, page_content)

# Update Timeline Badge
old_timeline_badge = r'<span className="ml-2 px-2 py-0\.5 rounded-md bg-slate-800 text-white font-mono font-extrabold text-\[0\.6rem\] shadow-sm">\s*\{dateFaceTreatments\[0\]\.transactionNo\}\s*<\/span>'
new_timeline_badge = """<button 
                                            onClick={() => setGlobalReceiptGroup({ date: format(new Date(a.tarih), 'dd.MM.yyyy'), txNo: dateFaceTreatments[0].transactionNo!, treatments: dateFaceTreatments })}
                                            className="ml-2 px-2 py-0.5 rounded-md bg-slate-800 text-white font-mono font-extrabold text-[0.6rem] shadow-sm hover:bg-slate-700 transition-colors cursor-pointer"
                                            title="İşlem Fişini Gör"
                                          >
                                            {dateFaceTreatments[0].transactionNo}
                                          </button>"""
page_content = re.sub(old_timeline_badge, new_timeline_badge, page_content)

# Update Stock Badge
old_stock_badge = r'<span className="ml-2 px-2 py-0\.5 rounded-md bg-slate-800 text-white font-mono font-extrabold text-\[0\.65rem\] shadow-sm">\s*\{txNo\}\s*<\/span>'
new_stock_badge = """<button 
                                     onClick={() => setGlobalReceiptGroup({ date: dateStr, txNo: txNo!, treatments: (selProfile.face_treatments || []).filter(ft => ft.date.startsWith(dateStr)) })}
                                     className="ml-2 px-2 py-0.5 rounded-md bg-slate-800 text-white font-mono font-extrabold text-[0.65rem] shadow-sm hover:bg-slate-700 transition-colors cursor-pointer"
                                     title="İşlem Fişini Gör"
                                   >
                                     {txNo}
                                   </button>"""
page_content = re.sub(old_stock_badge, new_stock_badge, page_content)

# Add the TransactionReceiptModal at the end of the return statement
page_return_end = r'<\/div>\s*<\/div>\s*\)\s*;\s*\}'
new_page_return_end = """</div>
      </div>
      
      <TransactionReceiptModal
        receiptDateGroup={globalReceiptGroup}
        onClose={() => setGlobalReceiptGroup(null)}
        patientName={selectedPatientName || undefined}
        stockHistory={selProfile?.stock_history || []}
      />
    </div>
  );
}"""
page_content = re.sub(page_return_end, new_page_return_end, page_content)

with open("src/app/(dashboard)/hasta-listesi/page.tsx", "w", encoding="utf-8") as f:
    f.write(page_content)

print("done")
