const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wtiitrsfrbdclackwaqv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aWl0cnNmcmJkY2xhY2t3YXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI3MjI4MCwiZXhwIjoyMDkxODQ4MjgwfQ.TxyPQDLDAT8BX6Lb85bh9EBMyXzmRyu7h9YkMbSi3Uk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: profiles } = await supabase.from('patient_profiles').select('*');
  const semih = profiles.find(p => p.patient_name === 'SEMİH ŞENTÜRK');
  
  if (!semih) {
    console.log('Semih not found');
    return;
  }
  
  console.log('Before update:');
  console.log('Treatments:', semih.face_treatments?.length);
  console.log('Stock:', semih.stock_history?.length);
  console.log('Notes:', semih.notes_list?.length);
  
  // Filter for only '22.08.2026'
  const filterDate = '22.08.2026';
  
  const updatedTreatments = (semih.face_treatments || []).filter(t => (t.date || '').includes(filterDate));
  const updatedStock = (semih.stock_history || []).filter(s => (s.date || '').includes(filterDate));
  const updatedNotes = (semih.notes_list || []).filter(n => (n.date || '').includes(filterDate));
  
  await supabase.from('patient_profiles').update({
    face_treatments: updatedTreatments,
    stock_history: updatedStock,
    notes_list: updatedNotes
  }).eq('id', semih.id);
  
  console.log('\nAfter update:');
  console.log('Treatments:', updatedTreatments.length);
  console.log('Stock:', updatedStock.length);
  console.log('Notes:', updatedNotes.length);
  
  // Clean up any appointments for Semih that are not 22.08.2026
  const { data: appointments } = await supabase.from('appointments').select('*').eq('musteri_adi', 'SEMİH ŞENTÜRK');
  for (const a of appointments || []) {
    if (a.tarih !== '2026-08-22') {
      await supabase.from('appointments').delete().eq('id', a.id);
      console.log(`Deleted Semih appointment: ${a.tarih}`);
    }
  }
}

run();
