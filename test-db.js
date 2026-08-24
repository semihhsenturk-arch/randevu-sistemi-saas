const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/inventory?select=invalid_column&limit=1';
fetch(url, {
  headers: {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
}).then(res => res.json()).then(console.log).catch(console.error);
