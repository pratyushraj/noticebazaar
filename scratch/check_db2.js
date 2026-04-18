const fs = require('fs');
const envStr = fs.readFileSync(".env", "utf8") + "\n" + fs.readFileSync(".env.local", "utf8");
const envVars = {};
for (const line of envStr.split("\n")) {
  const match = line.match(/^VITE_SUPABASE_(URL|ANON_KEY)=(.*)$/);
  if (match) envVars[match[1]] = match[2].replace(/["']/g, '');
}

async function run() {
  const url = `${envVars.URL}/rest/v1/profiles?select=*&limit=1`;
  const res = await fetch(url, {
    headers: {
      'apikey': envVars.ANON_KEY,
      'Authorization': `Bearer ${envVars.ANON_KEY}`
    }
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch error:", res.status, text);
    return;
  }
  const data = await res.json();
  if (data.length > 0) {
    console.log("Columns present in 'profiles':");
    console.log(Object.keys(data[0]).join(", "));
  } else {
    console.log("No data found.");
  }
}
run();
