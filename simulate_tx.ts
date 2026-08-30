import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wtiitrsfrbdclackwaqv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aWl0cnNmcmJkY2xhY2t3YXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzIyODAsImV4cCI6MjA5MTg0ODI4MH0.J8_g5m_zepTCrXYKptFG67OxsIPXiNumgSso9urY8_k";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function simulateMapping() {
  const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*');
  const { data: apptsData, error: apptsError } = await supabase.from('appointments').select('*');

  if (profilesError || apptsError) {
    console.error("Error fetching data:", profilesError || apptsError);
    return;
  }

  // 1. Gather appointments and sort them
  const sortedAppts = apptsData
    .filter(a => a.durum !== "iptal")
    .sort((a, b) => {
      const dComp = (a.tarih || "").localeCompare(b.tarih || "");
      if (dComp !== 0) return dComp;
      return (a.saat || "").localeCompare(b.saat || "");
    });

  // 2. Gather manual transactions
  const manualTxNos = new Set<number>();
  const manualTxNoToApptId = new Map<number, string>();

  profilesData.forEach(p => {
    if (p.face_treatments && Array.isArray(p.face_treatments)) {
      p.face_treatments.forEach(t => {
        if (t.transactionNo) {
          const m = t.transactionNo.match(/ISL[- ]*(\d+)/i);
          if (m) {
            const num = parseInt(m[1], 10);
            manualTxNos.add(num);
            const tDate = (t.date || "").split(" ")[0];
            const matchingApt = sortedAppts.find(a => a.tarih === tDate && (a.musteri_adi || "") === p.patient_name);
            if (matchingApt) {
               manualTxNoToApptId.set(num, matchingApt.id);
            }
          }
        }
      });
    }
  });

  console.log("Manual Tx Nos:", Array.from(manualTxNos));
  console.log("Pre-assigned mapping:", manualTxNoToApptId);

  // 3. Map
  const map: Record<string, string> = {};
  let counter = 1;

  sortedAppts.forEach((a) => {
    let foundPreAssigned = false;
    for (const [num, aptId] of manualTxNoToApptId.entries()) {
      if (aptId === a.id) {
        map[a.id] = `#ISL-${num.toString().padStart(4, '0')}`;
        foundPreAssigned = true;
        manualTxNoToApptId.delete(num);
        break;
      }
    }

    if (!foundPreAssigned) {
      while (manualTxNos.has(counter)) {
        counter++;
      }
      map[a.id] = `#ISL-${counter.toString().padStart(4, '0')}`;
      manualTxNos.add(counter);
      counter++;
    }
  });

  // 4. Find ISL 0009 - 0012
  const targets = ["#ISL-0009", "#ISL-0010", "#ISL-0011", "#ISL-0012"];
  for (const a of sortedAppts) {
    const tx = map[a.id];
    if (targets.includes(tx)) {
      console.log(`\n===================`);
      console.log(`Found ${tx}:`);
      console.log(`  Patient: ${a.musteri_adi}`);
      console.log(`  Date: ${a.tarih} ${a.saat}`);
      console.log(`  Notes: ${a.notlar}`);
    }
  }

}

simulateMapping();
