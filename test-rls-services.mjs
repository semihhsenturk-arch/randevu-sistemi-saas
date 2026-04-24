import { createClient } from '@supabase/supabase-js';


const supabaseUrl = 'https://wtiitrsfrbdclackwaqv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aWl0cnNmcmJkY2xhY2t3YXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI3MjI4MCwiZXhwIjoyMDkxODQ4MjgwfQ.TxyPQDLDAT8BX6Lb85bh9EBMyXzmRyu7h9YkMbSi3Uk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  const { data, error } = await supabase.rpc('get_policies_for_table', { table_name: 'services' }).catch(() => ({data: null, error: 'No RPC point'}));
  console.log("Policies via RPC:", data, error);
  
  // We can query pg_policies using service role
  const { data: policies, error: polError } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'services');
  
  console.log("pg_policies query:", policies, polError);
  
  if (polError) {
    // If pg_policies is not exposed, let's use a postgres query directly via generic fetch or psql if we can.
    // Instead, just list postgres policies by querying raw.
  }
}

checkRLS();
