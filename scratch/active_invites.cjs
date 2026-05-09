
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ooaxtwmqrvfzdqzoijcj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function generateInvites() {
  const { data: profiles } = await supabase.from('profiles').select('id, username, first_name, last_name, role');
  const { data: { users } } = await supabase.auth.admin.listUsers();
  
  const userMap = users.reduce((acc, u) => {
    acc[u.id] = u.email;
    return acc;
  }, {});

  const activeCreators = profiles.filter(p => {
    const email = userMap[p.id];
    if (!email) return false;
    
    // Filter out tests and admins
    const isTest = email.includes('example.com') || email.includes('noticebazaar.com') || email.includes('admin@creatorarmour.com') || email.includes('test.elite@creatorarmour.com');
    const isAdmin = p.username.toLowerCase().includes('admin');
    
    return !isTest && !isAdmin;
  });

  console.log('| Creator Name | Handle | Email | Set Password Link |');
  console.log('| :--- | :--- | :--- | :--- |');
  
  for (const p of activeCreators) {
    const email = userMap[p.id];
    const { data: linkData, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://creatorarmour.com/reset-password'
      }
    });

    if (error) {
      console.error(`Error for ${email}:`, error.message);
      continue;
    }

    const name = ((p.first_name || '') + ' ' + (p.last_name || '')).trim() || p.username;
    console.log(`| ${name} | @${p.username} | ${email} | ${linkData.properties.action_link} |`);
  }
}

generateInvites();
