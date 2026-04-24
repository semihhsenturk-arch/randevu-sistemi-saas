import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wtiitrsfrbdclackwaqv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aWl0cnNmcmJkY2xhY2t3YXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzIyODAsImV4cCI6MjA5MTg0ODI4MH0.J8_g5m_zepTCrXYKptFG67OxsIPXiNumgSso9urY8_k'; // ANON KEY
const supabaseServiceRuleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aWl0cnNmcmJkY2xhY2t3YXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI3MjI4MCwiZXhwIjoyMDkxODQ4MjgwfQ.TxyPQDLDAT8BX6Lb85bh9EBMyXzmRyu7h9YkMbSi3Uk';

const supabaseAnon = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRuleKey);

async function testSubmit() {
  // First, sign in as a user (or we can just skip sign in if auth RLS fails without it, but we need auth token)
  // Let's get an existing user and sign in to get their JWT. Or just use admin to get user auth token? We can't easily without password.
  // Actually, we can fetch their JWT maybe? No.
  // But wait! If RLS policy is missing an INSERT rule for authenticated users...
  // Let's check policies with admin
  const { data: pol } = await supabaseAdmin.from('pg_policies').select('*').eq('tablename', 'services');
  console.log("pg_policies for services:");
  console.log(pol);
}

testSubmit();
