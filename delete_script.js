const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wtiitrsfrbdclackwaqv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aWl0cnNmcmJkY2xhY2t3YXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI3MjI4MCwiZXhwIjoyMDkxODQ4MjgwfQ.TxyPQDLDAT8BX6Lb85bh9EBMyXzmRyu7h9YkMbSi3Uk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Check patient_profiles
  const { data: profiles, error: errProfiles } = await supabase.from('patient_profiles').select('*');
  console.log('Profiles:', profiles?.map(p => ({ id: p.id, patient_name: p.patient_name })));

  // Check appointments
  const { data: appointments, error: errApt } = await supabase.from('appointments').select('*');
  console.log('Appointments:', appointments?.map(a => ({ id: a.id, musteri_adi: a.musteri_adi, tarih: a.tarih })));

  // Check consent_records
  const { data: consents, error: errConsents } = await supabase.from('consent_records').select('*');
  console.log('Consents:', consents?.map(c => ({ id: c.id, patient_name: c.patient_name })));
}

run();
