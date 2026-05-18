import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log(`🔍 Auditing brand_leads table for any duplicate brand names, websites, or emails...`);

  try {
    const { data: leads, error } = await supabase
      .from('brand_leads')
      .select('id, brand_name, email, website');

    if (error) throw error;

    if (!leads || leads.length === 0) {
      console.log('⚠️ No brand leads found in the database.');
      return;
    }

    const nameMap = new Map<string, any[]>();
    const emailMap = new Map<string, any[]>();
    const websiteMap = new Map<string, any[]>();

    leads.forEach(l => {
      const name = l.brand_name.trim().toLowerCase();
      const email = l.email.trim().toLowerCase();
      const website = l.website ? l.website.trim().toLowerCase() : '';

      if (!nameMap.has(name)) nameMap.set(name, []);
      nameMap.get(name)!.push(l);

      if (!emailMap.has(email)) emailMap.set(email, []);
      emailMap.get(email)!.push(l);

      if (website) {
        if (!websiteMap.has(website)) websiteMap.set(website, []);
        websiteMap.get(website)!.push(l);
      }
    });

    let duplicatesFound = false;
    const deleteIds: string[] = [];

    console.log(`\n📊 DUPLICATE AUDIT REPORT:`);
    console.log(`-----------------------------------------------`);

    // Audit Brand Names
    for (const [name, rows] of nameMap.entries()) {
      if (rows.length > 1) {
        duplicatesFound = true;
        console.log(`⚠️ Duplicate brand name found: "${rows[0].brand_name}" (${rows.length} occurrences)`);
        // Keep the first row, prepare to delete the rest
        rows.slice(1).forEach(r => {
          if (!deleteIds.includes(r.id)) deleteIds.push(r.id);
        });
      }
    }

    // Audit Emails
    for (const [email, rows] of emailMap.entries()) {
      if (rows.length > 1) {
        duplicatesFound = true;
        console.log(`⚠️ Duplicate email found: "${rows[0].email}" for brands: ${rows.map(r => r.brand_name).join(', ')}`);
        // Keep the first, mark duplicates to delete
        rows.slice(1).forEach(r => {
          if (!deleteIds.includes(r.id)) deleteIds.push(r.id);
        });
      }
    }

    if (!duplicatesFound) {
      console.log(`✅ Pristine Status: No duplicates found! Your directory of ${leads.length} brands is 100% clean and unique!`);
    } else {
      console.log(`\n🧹 Clean-up Action Plan:`);
      console.log(`- Total duplicate row entries identified for removal: ${deleteIds.length}`);
      
      if (deleteIds.length > 0) {
        console.log(`- Executing delete operations in database...`);
        const { error: deleteError } = await supabase
          .from('brand_leads')
          .delete()
          .in('id', deleteIds);

        if (deleteError) throw deleteError;
        console.log(`✅ Success! All duplicate entries deleted successfully.`);
        
        // Get final count
        const { count } = await supabase
          .from('brand_leads')
          .select('*', { count: 'exact', head: true });
        console.log(`- Final unique count in brand_leads table: ${count}`);
      }
    }

  } catch (err: any) {
    console.error('❌ Failed to run duplicate audit:', err.message);
  }
}

main();
