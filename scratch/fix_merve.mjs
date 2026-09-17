import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SUPABASE_SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const apt1430 = '5ba83fde-96dd-4106-a1ce-079dcd7bc67a';
  const apt1330 = '85e22dc0-d295-4247-aab1-1a3cbd86efe6';
  
  // Set 13:30 to be earlier
  const { data: data1, error: err1 } = await supabase
    .from('appointments')
    .update({ created_at: '2026-08-28T05:27:42.000000+00:00' })
    .eq('id', apt1330);
    
  if (err1) console.error(err1);
  else console.log("Updated 13:30 appointment created_at to be earlier.");

  // Set 14:30 to be later
  const { data: data2, error: err2 } = await supabase
    .from('appointments')
    .update({ created_at: '2026-08-28T05:27:58.000000+00:00' })
    .eq('id', apt1430);
    
  if (err2) console.error(err2);
  else console.log("Updated 14:30 appointment created_at to be later.");
  
  // Also, check if there are manual transaction numbers in patient_profiles
  const { data: profiles, error: pError } = await supabase.from('patient_profiles').select('*');
  if (pError) {
      console.error("profiles error", pError);
  } else {
      const merve = profiles.find(p => {
          try {
              // Usually encrypted, but let's check raw if possible
              if (p.patient_name && p.patient_name.toLowerCase().includes('merve')) return true;
          } catch(e) {}
          return false;
      });
      // patient_profiles are encrypted, so we can't easily grep by name in JS without decryption key
  }
}

main();
