const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wtiitrsfrbdclackwaqv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aWl0cnNmcmJkY2xhY2t3YXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI3MjI4MCwiZXhwIjoyMDkxODQ4MjgwfQ.TxyPQDLDAT8BX6Lb85bh9EBMyXzmRyu7h9YkMbSi3Uk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: profiles } = await supabase.from('patient_profiles').select('id, patient_name, face_treatments, stock_history, notes_list').ilike('patient_name', '%Semih%');
  for (const p of profiles) {
    console.log(`Profile: ${p.patient_name}`);
    console.log(`  Face treatments: ${p.face_treatments?.length || 0}`);
    console.log(`  Stock history: ${p.stock_history?.length || 0}`);
    console.log(`  Notes: ${p.notes_list?.length || 0}`);
    
    // Check if any face treatments are older than today
    if (p.face_treatments) {
      p.face_treatments.forEach(t => console.log(`    - ${t.date}`));
    }
  }
}

run();
