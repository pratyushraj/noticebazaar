
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ooaxtwmqrvfzdqzoijcj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function generateInvites() {
  console.log('--- Generating Invite Links for Creators ---');
  
  // 1. Fetch all users from auth.users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  // 2. Fetch all creator profiles to map names
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name');

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return;
  }

  const profileMap = profiles.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  const results = [];

  for (const user of users) {
    const profile = profileMap[user.id];
    if (!profile) continue;

    // Generate a recovery link (Set Password link)
    // We use redirectedTo to ensure they land on the Reset Password page
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: user.email,
      options: {
        redirectTo: 'http://localhost:8080/reset-password' // Note: This will be replaced by the production URL in the actual link if configured
      }
    });

    if (linkError) {
      console.error(`Error generating link for ${user.email}:`, linkError.message);
      continue;
    }

    const displayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || user.email;
    
    results.push({
      name: displayName,
      email: user.email,
      link: linkData.properties.action_link
    });
  }

  console.log('\n--- Invite List ---');
  results.forEach(res => {
    console.log(`${res.name} (${res.email}): ${res.link}`);
  });
  console.log('--- End of List ---');
}

generateInvites();
