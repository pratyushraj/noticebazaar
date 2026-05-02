
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

async function inspectUser(email) {
  console.log(`Searching for user: ${email}`)
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
  
  if (userError) {
    console.error('Error listing users:', userError)
    return
  }

  const user = users.find(u => u.email === email)
  if (!user) {
    console.log(`User with email ${email} NOT FOUND in auth.users`)
    return
  }

  console.log('Auth User Found:', {
    id: user.id,
    email: user.email,
    last_sign_in_at: user.last_sign_in_at,
    user_metadata: user.user_metadata
  })

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Profile fetch error:', profileError)
    if (profileError.code === 'PGRST116') {
      console.log('PROFILE RECORD MISSING for this user.')
    }
  } else {
    console.log('Profile Record Found:', profile)
  }
}

inspectUser('notce102@opmail.com')
