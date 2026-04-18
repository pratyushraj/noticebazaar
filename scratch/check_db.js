import { createClient } from "https://esm.sh/@supabase/supabase-js";
import fs from "fs";
import dotenv from "dotenv";

const envStr = fs.readFileSync(".env", "utf8") + "\n" + fs.readFileSync(".env.local", "utf8");
const envVars = {};
for (const line of envStr.split("\n")) {
  const match = line.match(/^VITE_SUPABASE_(URL|ANON_KEY)=(.*)$/);
  if (match) envVars[match[1]] = match[2].replace(/["']/g, '');
}

const supabase = createClient(envVars.URL, envVars.ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error("Fetch error:", error);
  } else if (data.length > 0) {
    console.log("Columns present in 'profiles':");
    console.log(Object.keys(data[0]).join(", "));
  } else {
    console.log("No data found.");
  }
}
run();
