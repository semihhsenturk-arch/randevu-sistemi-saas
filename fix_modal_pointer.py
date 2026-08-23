import re

with open("src/app/(dashboard)/hasta-listesi/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove from end
modal_pattern = r'\s*<TransactionReceiptModal\s*receiptDateGroup=\{globalReceiptGroup\}\s*onClose=\{.*?\}\s*patientName=\{.*?\}\s*stockHistory=\{.*?\}\s*\/>'
content = re.sub(modal_pattern, "", content)

# Insert before the closing tag of the main DialogContent
dialog_end_pattern = r'(\s*)<\/DialogContent>\s*<\/Dialog>\s*\{\/\* Material Modal \*\/\}'

new_dialog_end = r"""\1  <TransactionReceiptModal
\1    receiptDateGroup={globalReceiptGroup}
\1    onClose={() => setGlobalReceiptGroup(null)}
\1    patientName={selectedPatientName || undefined}
\1    stockHistory={selProfile?.stock_history || []}
\1  />
\1</DialogContent>
      </Dialog>

      {/* Material Modal */}"""

content = re.sub(dialog_end_pattern, new_dialog_end, content)

with open("src/app/(dashboard)/hasta-listesi/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("done")
