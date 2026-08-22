const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wtiitrsfrbdclackwaqv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aWl0cnNmcmJkY2xhY2t3YXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI3MjI4MCwiZXhwIjoyMDkxODQ4MjgwfQ.TxyPQDLDAT8BX6Lb85bh9EBMyXzmRyu7h9YkMbSi3Uk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Deleting other profiles...');
  const { data: profiles } = await supabase.from('patient_profiles').select('*');
  for (const p of profiles || []) {
    if (p.patient_name.toUpperCase() !== 'SEMİH ŞENTÜRK') {
      await supabase.from('patient_profiles').delete().eq('id', p.id);
      console.log(`Deleted profile: ${p.patient_name}`);
    } else {
      console.log(`Kept profile: ${p.patient_name}`);
    }
  }

  console.log('\nDeleting other appointments...');
  const { data: appointments } = await supabase.from('appointments').select('*');
  for (const a of appointments || []) {
    const isSemihToday = a.musteri_adi.toUpperCase() === 'SEMİH ŞENTÜRK' && a.tarih === '2026-08-22';
    if (!isSemihToday) {
      await supabase.from('appointments').delete().eq('id', a.id);
      console.log(`Deleted appointment: ${a.musteri_adi} on ${a.tarih}`);
    } else {
      console.log(`Kept appointment: ${a.musteri_adi} on ${a.tarih}`);
    }
  }

  console.log('\nDeleting other consent records...');
  const { data: consents } = await supabase.from('consent_records').select('*');
  for (const c of consents || []) {
    // Keep if patient is Semih and appointment_date is today or signed_at is today
    const isSemih = c.patient_name.toUpperCase() === 'SEMİH ŞENTÜRK';
    const isToday = c.appointment_date === '2026-08-22' || (c.signed_at && c.signed_at.startsWith('2026-08-22'));
    
    if (!(isSemih && isToday)) {
      await supabase.from('consent_records').delete().eq('id', c.id);
      console.log(`Deleted consent: ${c.patient_name} on ${c.appointment_date || c.signed_at}`);
    } else {
      console.log(`Kept consent: ${c.patient_name} on ${c.appointment_date || c.signed_at}`);
    }
  }
}

run();
