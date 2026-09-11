import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wtiitrsfrbdclackwaqv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aWl0cnNmcmJkY2xhY2t3YXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI3MjI4MCwiZXhwIjoyMDkxODQ4MjgwfQ.TxyPQDLDAT8BX6Lb85bh9EBMyXzmRyu7h9YkMbSi3Uk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Get an existing profile
  const { data: profiles, error: fetchErr } = await supabase.from('profiles').select('id, clinic_name').limit(1);
  if (fetchErr) {
    console.error("Fetch Error:", fetchErr);
    return;
  }
  if (!profiles || profiles.length === 0) {
    console.error("No profiles found to update");
    return;
  }
  
  const targetId = profiles[0].id;
  const oldName = profiles[0].clinic_name;
  
  // Try to update it (this fires the audit trigger)
  const { error: updateErr } = await supabase.from('profiles').update({ clinic_name: oldName + " updated" }).eq('id', targetId);
  console.log("Update Error:", updateErr);
  
  // Revert back if it succeeded
  if (!updateErr) {
      await supabase.from('profiles').update({ clinic_name: oldName }).eq('id', targetId);
  }
}

test();
