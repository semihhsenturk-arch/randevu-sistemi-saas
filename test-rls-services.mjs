import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// SEC-FIX: Read credentials from .env.local instead of hardcoding
const env = fs.readFileSync('.env.local', 'utf-8');
const getEnv = (key) => {
  const line = env.split('\n').find(l => l.startsWith(`${key}=`));
  return line ? line.split('=').slice(1).join('=').replace(/"/g, '').trim() : '';
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  const { data, error } = await supabase.rpc('get_policies_for_table', { table_name: 'services' }).catch(() => ({data: null, error: 'No RPC point'}));
  console.log("Policies via RPC:", data, error);
  
  const { data: policies, error: polError } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'services');
  
  console.log("pg_policies query:", policies, polError);
}

checkRLS();
