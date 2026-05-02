
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

async function inspectProfile(userId) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Profile:', profile)
  }
}

inspectProfile('1dc3f763-49c7-4fe1-866e-111a780d2826')
