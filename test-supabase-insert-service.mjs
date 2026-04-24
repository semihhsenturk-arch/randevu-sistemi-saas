import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wtiitrsfrbdclackwaqv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aWl0cnNmcmJkY2xhY2t3YXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI3MjI4MCwiZXhwIjoyMDkxODQ4MjgwfQ.TxyPQDLDAT8BX6Lb85bh9EBMyXzmRyu7h9YkMbSi3Uk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Fetching user...");
  const { data: users, error: userError } = await supabase.from('profiles').select('id').limit(1);
  if (userError) {
    console.error("Error fetching user:", userError);
    return;
  }
  const userId = users[0].id;
  console.log("Using user ID:", userId);

  const payload = {
    user_id: userId,
    ad: "Test Service 123",
    sure: 30,
    fiyat: 100,
    renk: "#000000"
  };

  console.log("Inserting...");
  const { data, error } = await supabase.from('services').insert(payload).select();
  console.log("Insert Result:");
  console.log("Data:", data);
  console.log("Error:", error);
}

test();
