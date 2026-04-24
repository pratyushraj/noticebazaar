
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ooaxtwmqrvfzdqzoijcj.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function getCols() {
  // Use a query that will fail but hopefully give us some info, 
  // or use a select * and check the keys of the first row
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error fetching profiles:', error)
  } else if (data && data.length > 0) {
    console.log('Available columns in profiles table:', Object.keys(data[0]))
  } else {
    console.log('No rows in profiles table, trying a more direct schema approach if possible...')
  }
}

getCols()
