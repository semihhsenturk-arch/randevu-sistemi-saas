import re

with open("src/components/FaceMap.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add stockHistory to FaceMapProps
content = content.replace(
    'patientName?: string;',
    'patientName?: string;\n  stockHistory?: any[];'
)

# Add stockHistory to FaceMap function arguments
content = content.replace(
    'readonly = false, patientName }: FaceMapProps',
    'readonly = false, patientName, stockHistory = [] }: FaceMapProps'
)

# Replace the Mini FaceMap section with Stock History section
old_mini_facemap = r'\{/\* Mini FaceMap \*/\}.*?\{/\* Dotted Divider \*/\}'
# We have to be careful with regex DOTALL. Instead, let's use string manipulation.
start_idx = content.find('{/* Mini FaceMap */}')
if start_idx != -1:
    end_idx = content.find('{/* Dotted Divider */}', start_idx + 20)
    
    if end_idx != -1:
        new_section = """{/* Stock / Materials Used */}
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
                    
                    return dateStocks.map((stock, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2 rounded-lg">
                        <span className="text-[0.65rem] font-bold text-slate-700">{stock.itemName}</span>
                        <span className="text-[0.65rem] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{stock.amount} {stock.unit}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              """
        content = content[:start_idx] + new_section + content[end_idx:]

with open("src/components/FaceMap.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("FaceMap updated")
