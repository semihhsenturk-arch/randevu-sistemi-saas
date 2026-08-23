import re

with open("src/app/(dashboard)/hasta-listesi/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove the modal from the wrong place (inside the map)
wrong_modal = r"""\s*<TransactionReceiptModal\s*receiptDateGroup=\{globalReceiptGroup\}\s*onClose=\{.*?\}\s*patientName=\{.*?\}\s*stockHistory=\{.*?\}\s*\/>"""
content = re.sub(wrong_modal, "", content, count=1)

# 2. Add the modal at the very end of the file
end_pattern = r'(\s*)<\/div>\s*\);\s*\}'
new_end = r"""\1  <TransactionReceiptModal
\1    receiptDateGroup={globalReceiptGroup}
\1    onClose={() => setGlobalReceiptGroup(null)}
\1    patientName={selectedPatientName || undefined}
\1    stockHistory={selProfile?.stock_history || []}
\1  />
\1</div>
  );
}"""

content = re.sub(end_pattern, new_end, content)

with open("src/app/(dashboard)/hasta-listesi/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("done")
