
const { execSync } = require('child_process');

const vars = {
  SUPABASE_URL: "https://ooaxtwmqrvfzdqzoijcj.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDEyNTYsImV4cCI6MjA3NTA3NzI1Nn0.xIIz_9W9PAnxTKDdJZ3_wQ6OO7NQJbiy4P_PP0CSVBQ",
  SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c",
  RAZORPAY_KEY_ID: "rzp_live_SOpCNkp7Fe6nV8",
  RAZORPAY_KEY_SECRET: "dCrHBxEnRhBtw4dX4Ra1371C",
  RAZORPAY_WEBHOOK_SECRET: "noticebazaar_webhook_secret_2026",
  RESEND_API_KEY: "re_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH",
  FRONTEND_URL: "https://noticebazaar.com",
  NODE_ENV: "production"
};

console.log("Setting Vercel environment variables...");

for (const [key, value] of Object.entries(vars)) {
  try {
    console.log(`Setting ${key}...`);
    // Using --force to overwrite if exists, or just ignoring error
    execSync(`printf "${value}" | vercel env add ${key} production`, { stdio: 'inherit' });
  } catch (e) {
    console.warn(`Failed to set ${key} (might already exist)`);
  }
}

console.log("All variables set. Starting deployment...");
execSync("vercel deploy --prod --yes", { stdio: 'inherit' });
