import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createTestUsers() {
    const brandEmail = `brand_${Date.now()}@test.com`;
    const creatorEmail = `creator_${Date.now()}@test.com`;
    const password = 'password123';

    console.log('Creating Brand User:', brandEmail);
    const { data: brandAuth, error: brandAuthError } = await supabase.auth.admin.createUser({
        email: brandEmail,
        password: password,
        email_confirm: true
    });
    if (brandAuthError) throw brandAuthError;

    console.log('Creating Creator User:', creatorEmail);
    const { data: creatorAuth, error: creatorAuthError } = await supabase.auth.admin.createUser({
        email: creatorEmail,
        password: password,
        email_confirm: true
    });
    if (creatorAuthError) throw creatorAuthError;

    const brandId = brandAuth.user.id;
    const creatorId = creatorAuth.user.id;

    // Create Brand Profile
    console.log('Creating Brand Profile...');
    await supabase.from('profiles').upsert({
        id: brandId,
        email: brandEmail,
        role: 'brand',
        full_name: 'Test Brand'
    });
    
    await supabase.from('brands').insert({
        id: brandId,
        name: 'Test Brand Corp',
        industry: 'Tech',
        verified: true
    });

    // Create Creator Profile
    console.log('Creating Creator Profile...');
    await supabase.from('profiles').upsert({
        id: creatorId,
        email: creatorEmail,
        role: 'creator',
        full_name: 'Test Creator',
        username: `test_creator_${Date.now()}`
    });

    console.log('Test Users Created!');
    console.log('Brand:', brandEmail);
    console.log('Creator:', creatorEmail);
    console.log('Password:', password);

    return { brandId, creatorId, brandEmail, creatorEmail };
}

async function run() {
    try {
        const { brandId, creatorId, brandEmail, creatorEmail } = await createTestUsers();
        
        // Step 3: Brand creates a request
        console.log('Brand creating request for Creator...');
        const { data: request, error: requestError } = await supabase.from('collab_requests').insert({
            brand_id: brandId,
            creator_id: creatorId,
            brand_name: 'Test Brand Corp',
            brand_email: brandEmail,
            collab_type: 'paid',
            exact_budget: 5000,
            campaign_description: 'Test Campaign',
            deliverables: '1 Instagram Reel',
            status: 'pending'
        }).select().single();
        
        if (requestError) throw requestError;
        console.log('Request Created:', request.id);

        console.log('\n--- TEST SUMMARY ---');
        console.log('1. Login as Creator:', creatorEmail);
        console.log('2. Check "New Offers" tab');
        console.log('3. Accept the offer');
        console.log('4. Check if it moves to "Active Deals" immediately');
    } catch (err) {
        console.error('Test Setup Failed:', err);
    }
}

run();
