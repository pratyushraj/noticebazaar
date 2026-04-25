
import { supabase } from '../lib/supabase.js';

async function findUser() {
    const email = 'raaashhee@yopmai.com';
    console.log(`Searching for auth user: ${email}`);
    
    // In Supabase, we can't easily list users from client-side without admin access
    // but the service role key used in the backend HAS admin access.
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('❌ Error listing users:', error);
        return;
    }

    const user = data.users.find(u => u.email === email);
    if (!user) {
        console.error('❌ User not found in auth.users');
        return;
    }

    console.log('✅ User found:', { id: user.id, email: user.email, role: user.role });

    console.log('Checking brands table for this ID...');
    const { data: brand, error: brandErr } = await supabase
        .from('brands')
        .select('*')
        .eq('external_id', user.id)
        .maybeSingle();

    if (brandErr) {
        console.error('❌ Error fetching brand:', brandErr);
    } else {
        console.log('✅ Brand record:', brand);
    }
}

findUser();
