require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.rpc('query_pg_policies', { table_name: 'services' }).select('*');
  if (error) {
     const { data: qData, error: qErr } = await supabase.from('pg_policies').select('*').eq('tablename', 'services').select();
     if(qErr) console.log(qErr);
  }
}
check();
