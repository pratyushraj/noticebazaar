
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ooaxtwmqrvfzdqzoijcj.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDEyNTYsImV4cCI6MjA3NTA3NzI1Nn0.xIIz_9W9PAnxTKDdJZ3_wQ6OO7NQJbiy4P_PP0CSVBQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkUser(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('User data:', data)
    if (data.length === 0) {
      console.log('User ID NOT FOUND in profiles table.')
    }
  }
}

checkUser('1bad9dfe-02ab-47fb-a346-b9fd28330860')
