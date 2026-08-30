import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wtiitrsfrbdclackwaqv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aWl0cnNmcmJkY2xhY2t3YXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzIyODAsImV4cCI6MjA5MTg0ODI4MH0.J8_g5m_zepTCrXYKptFG67OxsIPXiNumgSso9urY8_k";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTransactions() {
  const { data: profiles, error } = await supabase.from('profiles').select('*');
  
  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }
  
  if (!profiles) {
    console.log("No profiles found.");
    return;
  }

  const targets = ["0009", "0010", "0011", "0012"];
  
  console.log("Searching for ISL 0009, 0010, 0011, 0012...");

  for (const p of profiles) {
    if (p.face_treatments && Array.isArray(p.face_treatments)) {
      for (const t of p.face_treatments) {
        if (t.transactionNo) {
          for (const target of targets) {
            if (t.transactionNo.includes(target) || t.transactionNo.includes(parseInt(target).toString())) {
               // Verify it's actually 9, 10, 11, 12 and not like 10009
               const match = t.transactionNo.match(/ISL[- ]*(\d+)/i);
               if (match) {
                 const num = parseInt(match[1], 10);
                 if (num === 9 || num === 10 || num === 11 || num === 12) {
                    console.log(`Found ISL ${num.toString().padStart(4, '0')}:`);
                    console.log(`  Patient: ${p.patient_name || p.id}`);
                    console.log(`  Reason/Treatment: ${t.type || t.treatment || t.ad || 'Unknown'}`);
                    console.log(`  Date: ${t.date}`);
                    console.log(`  Details: ${JSON.stringify(t)}`);
                    console.log("-----------------------------------------");
                 }
               }
            }
          }
        }
      }
    }
  }

  // Also search appointments
  const { data: appointments, error: aptError } = await supabase.from('appointments').select('*');
  if (!aptError && appointments) {
     console.log("Also mapping appointments...");
     // Note: Appointments don't store transactionNo directly, but let's check notes just in case
     for (const a of appointments) {
        if (a.notlar) {
           for (const target of targets) {
              if (a.notlar.includes(`ISL-${target}`) || a.notlar.includes(`ISL ${parseInt(target)}`)) {
                 console.log(`Found reference in Appointment for ${a.musteri_adi}: ${a.notlar}`);
              }
           }
        }
     }
  }
}

checkTransactions();
