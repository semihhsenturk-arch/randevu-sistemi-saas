import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wtiitrsfrbdclackwaqv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aWl0cnNmcmJkY2xhY2t3YXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI3MjI4MCwiZXhwIjoyMDkxODQ4MjgwfQ.TxyPQDLDAT8BX6Lb85bh9EBMyXzmRyu7h9YkMbSi3Uk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin_test_' + Date.now() + '@example.com',
    password: 'Password123!@#',
    email_confirm: true,
    user_metadata: {
      clinic_name: 'Admin Test Clinic',
      plan: 'starter'
    }
  });
  console.log("Admin Create User Result:");
  console.log("Data:", data);
  console.log("Error:", error);
}

test();
