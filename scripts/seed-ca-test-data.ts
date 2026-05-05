
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedCAData() {
  const caEmail = 'anjali.sharma@creatorarmour.com';
  const caPassword = 'advisor123';
  const creatorEmail = 'demo@creatorarmour.com';

  console.log('🚀 Seeding CA Test Data...');

  try {
    // 1. Ensure CA User exists
    let { data: caUser } = await supabase.auth.admin.createUser({
      email: caEmail,
      password: caPassword,
      email_confirm: true
    }).catch(() => ({ data: { user: null } }));

    if (!caUser?.user) {
        const { data: users } = await supabase.auth.admin.listUsers();
        caUser = { user: users?.users?.find(u => u.email === caEmail) } as any;
    }

    if (!caUser?.user) throw new Error('Could not find or create CA user');
    console.log('✅ CA User ready:', caUser.user.id);

    // 2. Ensure CA Profile exists with role
    await supabase.from('profiles').upsert({
      id: caUser.user.id,
      first_name: 'Anjali',
      last_name: 'Sharma',
      role: 'chartered_accountant',
      onboarding_complete: true
    });
    console.log('✅ CA Profile ready');

    // 3. Ensure Creator User exists
    let { data: creatorUser } = await supabase.auth.admin.listUsers();
    let creator = creatorUser?.users?.find(u => u.email === creatorEmail);
    
    if (!creator) {
        const { data: newUser } = await supabase.auth.admin.createUser({
            email: creatorEmail,
            password: 'Demo123!@#',
            email_confirm: true
        });
        creator = newUser.user as any;
    }

    if (!creator) throw new Error('Could not find or create Creator user');
    console.log('✅ Creator User ready:', creator.id);

    // 4. Create Conversation
    const { data: conv, error: convError } = await supabase.from('conversations').insert({
      title: 'Quarterly Tax Filing - Q2',
      risk_tag: 'tax',
      type: 'direct'
    }).select().single();

    if (convError) throw convError;
    console.log('✅ Conversation created:', conv.id);

    // 5. Add Participants
    await supabase.from('conversation_participants').insert([
      { conversation_id: conv.id, user_id: caUser.user.id, role: 'advisor' },
      { conversation_id: conv.id, user_id: creator.id, role: 'creator' }
    ]);
    console.log('✅ Participants added');

    // 6. Add Initial Message
    const { data: msg, error: msgError } = await supabase.from('messages').insert({
      conversation_id: conv.id,
      sender_id: creator.id,
      content: 'Hi Anjali, I need help with my GST filing for this quarter. I have uploaded my invoices.'
    }).select().single();

    if (msgError) throw msgError;
    
    // Update conversation last message
    await supabase.from('conversations').update({
        last_message_id: msg.id,
        updated_at: new Date().toISOString()
    }).eq('id', conv.id);

    console.log('✅ Initial message sent');

    console.log('\n🎉 CA Test Data Seeded Successfully!');
    console.log(`CA Email: ${caEmail}`);
    console.log(`CA Password: ${caPassword}`);

  } catch (err: any) {
    console.error('❌ Error seeding CA data:', err.message);
  }
}

seedCAData();
