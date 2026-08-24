const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/inventory?select=fiyat,kod,toplam_deger,hareketler&limit=1', {
  headers: {
    'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
}).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2))).catch(console.error);
