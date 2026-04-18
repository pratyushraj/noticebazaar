const fs = require('fs');

let envStr = '';
try {
  envStr = fs.readFileSync(".env.local", "utf8");
} catch (e) {
  envStr = fs.readFileSync(".env", "utf8");
}

const envVars = {};
for (const line of envStr.split("\n")) {
  const match = line.match(/^VITE_SUPABASE_(URL|ANON_KEY)=(.*)$/);
  if (match) envVars[match[1]] = match[2].replace(/["']/g, '');
}

async function run() {
  const url = `${envVars.URL}/rest/v1/profiles?select=instagram_handle,portfolio_links&limit=10`;
  const res = await fetch(url, {
    headers: {
      'apikey': envVars.ANON_KEY,
      'Authorization': `Bearer ${envVars.ANON_KEY}`
    }
  });
  const data = await res.json();
  console.log(data);
}
run();
