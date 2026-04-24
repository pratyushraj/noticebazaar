
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ooaxtwmqrvfzdqzoijcj.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function findUsers(query) {
  console.log(`Searching for users matching: ${query}`)
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error('Error:', error)
    return
  }

  const matches = users.filter(u => u.email.includes(query))
  console.log('Matches:', matches.map(u => ({ id: u.id, email: u.email })))
}

findUsers('102')
