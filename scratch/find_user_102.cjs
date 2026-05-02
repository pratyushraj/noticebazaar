
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ooaxtwmqrvfzdqzoijcj.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
}

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
