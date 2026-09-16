import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// SEC-FIX: Read credentials from .env.local instead of hardcoding
const env = fs.readFileSync('.env.local', 'utf-8');
const getEnv = (key) => {
  const line = env.split('\n').find(l => l.startsWith(`${key}=`));
  return line ? line.split('=').slice(1).join('=').replace(/"/g, '').trim() : '';
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const supabaseServiceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const supabaseAnon = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testSubmit() {
  const { data: pol } = await supabaseAdmin.from('pg_policies').select('*').eq('tablename', 'services');
  console.log("pg_policies for services:");
  console.log(pol);
}

testSubmit();
