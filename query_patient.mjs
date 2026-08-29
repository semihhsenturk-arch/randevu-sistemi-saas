import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = env.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].replace(/"/g, '');
const supabaseKey = env.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')).split('=')[1].replace(/"/g, '');

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('patient_profiles')
    .select('patient_name, face_treatments');

  if (error) {
    console.error(error);
  } else {
    data.forEach(d => {
       if (d.patient_name.toLowerCase().includes('elif')) {
          console.log(JSON.stringify(d, null, 2));
       }
    })
  }
}

check();
