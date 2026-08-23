import re

with open("src/app/(dashboard)/hasta-listesi/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Find the FaceMap component
content = content.replace(
    'patientName={selectedPatientName}',
    'patientName={selectedPatientName}\n                    stockHistory={selProfile.stock_history || []}'
)

with open("src/app/(dashboard)/hasta-listesi/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Page updated")
