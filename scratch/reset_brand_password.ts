import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

async function resetPassword() {
  const email = 'test_brand@creatorarmour.com';
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  const user = users?.users.find(u => u.email === email);
  
  if (!user) {
    console.log('User not found');
    return;
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password: 'password123'
  });

  if (error) {
    console.error(error);
  } else {
    console.log('Password reset successfully');
  }
}

resetPassword();
