
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
  const { error } = await supabase.from('brand_deals').update({ barter_product_image_url: 'https://test.com/image.jpg' }).eq('id', '3a35686f-4bc4-46a0-a3ad-c283f9056267');
  if (error) {
    console.log('Error updating:', error.message);
  } else {
    console.log('Column exists and updated successfully!');
  }
}

checkColumn();
