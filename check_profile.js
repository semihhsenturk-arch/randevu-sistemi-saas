const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wtiitrsfrbdclackwaqv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aWl0cnNmcmJkY2xhY2t3YXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI3MjI4MCwiZXhwIjoyMDkxODQ4MjgwfQ.TxyPQDLDAT8BX6Lb85bh9EBMyXzmRyu7h9YkMbSi3Uk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: profile } = await supabase.from('patient_profiles').select('*').ilike('patient_name', 'SEMİH ŞENTÜRK').single();
  console.log(JSON.stringify(profile, null, 2));
}

run();
