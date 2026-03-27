import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubmit() {
  const username = 'ddindialive';
  const body = {
    brand_name: 'Brand Demo',
    brand_email: 'demo@brand.com',
    brand_address: '123 Demo St, Demo City, 12345',
    collab_type: 'paid',
    campaign_description: 'Test campaign description',
    deliverables: ['Instagram Reel', 'Story'],
    exact_budget: 1500,
  };

  try {
    // Simulated route logic
    const { data: creator, error: creatorError } = await supabase
      .from('profiles')
      .select('id, username, instagram_handle, pricing_min')
      .or(`username.eq.${username},instagram_handle.eq.${username}`)
      .eq('role', 'creator')
      .maybeSingle();

    if (creatorError) throw creatorError;
    if (!creator) throw new Error('Creator not found');

    console.log('Creator ID:', creator.id);

    // Simulated findOrCreateBrandUser
    const email = body.brand_email.trim().toLowerCase();
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    let authUser = users.find(u => u.email?.toLowerCase() === email);
    
    let brandUserId = authUser?.id;
    console.log('Brand User ID:', brandUserId);

    // Simulated insert
    const insertData = {
      creator_id: creator.id,
      brand_name: body.brand_name,
      brand_email: body.brand_email,
      brand_address: body.brand_address,
      collab_type: body.collab_type,
      campaign_description: body.campaign_description,
      deliverables: JSON.stringify(body.deliverables),
      exact_budget: body.exact_budget,
      brand_id: brandUserId,
      submitted_ip: '127.0.0.1',
      submitted_user_agent: 'Local Test',
    };

    console.log('Inserting data...');
    const { data: collabRequest, error: insertError } = await supabase
      .from('collab_requests')
      .insert(insertData)
      .select('id, brand_name, created_at')
      .single();

    if (insertError) {
      console.error('Insert Error:', insertError);
    } else {
      console.log('Success:', collabRequest);
    }

  } catch (error) {
    console.error('Detailed Error:', error);
  }
}

testSubmit();
