#!/usr/bin/env tsx
/**
 * Apply brand_address column migration to brand_deals table
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

async function applyMigration() {
  console.log('\n📄 Applying brand_address migration...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Read the migration SQL
    const migrationPath = join(process.cwd(), 'supabase/migrations/2025_01_31_add_brand_address_to_brand_deals.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    
    console.log('📋 Migration SQL:');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    console.log('\n⚠️  Note: Supabase JS client cannot execute DDL statements directly.');
    console.log('📋 Please apply this migration via Supabase Dashboard SQL Editor.\n');
    console.log('🔗 Dashboard: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj/sql/new\n');
    console.log('📝 Steps:');
    console.log('   1. Open the SQL Editor link above');
    console.log('   2. Copy the SQL above');
    console.log('   3. Paste into the SQL Editor');
    console.log('   4. Click "Run"\n');
    
    // Try to verify if column already exists
    console.log('🔍 Checking if brand_address column already exists...');
    const { data: columns, error: checkError } = await supabase
      .from('brand_deals')
      .select('*')
      .limit(0);
    
    if (checkError) {
      console.log('⚠️  Could not check column status (this is normal)');
    } else {
      console.log('✅ Can access brand_deals table');
    }
    
    console.log('\n✅ Migration SQL ready to apply!\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applyMigration().catch(console.error);






