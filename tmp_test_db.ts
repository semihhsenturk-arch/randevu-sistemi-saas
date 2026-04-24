import { supabase } from "./src/lib/supabase";

async function testUpdate() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ plan: 'professional' })
    .eq('email', 'ornek@klinik.com'); // This might not work if 'email' is not in profiles
    
  if (error) {
    console.error("Error updating profile:", error);
  } else {
    console.log("Success:", data);
  }
}

testUpdate();
