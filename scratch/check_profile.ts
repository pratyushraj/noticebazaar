
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://nndkdfndscjuhmclgixj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZGtkZm5kc2NqdWhtY2xnaXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM2NDUzODMsImV4cCI6MjAyOTIyMTM4M30.xxx-secret-anon-key'
)

async function check() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, instagram_handle, role')
    .or('username.eq.notice104,instagram_handle.eq.notice104')
  
  console.log('Result:', data)
  if (error) console.error('Error:', error)
}

check()
