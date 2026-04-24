
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const payload = {
    ad: "Test Hizmeti",
    sure: 30,
    fiyat: 100,
    renk: "#000000"
  };
  console.log("Trying to insert payload:", payload);
  const { data, error } = await supabase.from("services").insert(payload).select();
  if (error) {
    console.error("Supabase Error Full Object:", error);
  } else {
    console.log("Success:", data);
  }
}
test();
