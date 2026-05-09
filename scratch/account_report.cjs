
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ooaxtwmqrvfzdqzoijcj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
  const { data: profiles } = await supabase.from('profiles').select('id, username, first_name, last_name, role');
  const { data: { users } } = await supabase.auth.admin.listUsers();
  
  const userIds = new Set(users.map(u => u.id));
  const userMap = users.reduce((acc, u) => {
    acc[u.id] = u.email;
    return acc;
  }, {});

  console.log('| Name | Handle | Status | Email |');
  console.log('| :--- | :--- | :--- | :--- |');
  
  profiles.forEach(p => {
    const name = ((p.first_name || '') + ' ' + (p.last_name || '')).trim() || 'N/A';
    const status = userIds.has(p.id) ? '✅ Account Ready' : '❌ Needs Email';
    const email = userMap[p.id] || '---';
    console.log(`| ${name} | @${p.username} | ${status} | ${email} |`);
  });
}

run();
