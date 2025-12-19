#!/usr/bin/env tsx
/**
 * Apply GST Company Cache Migration
 * Executes the migration SQL directly via Supabase connection
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

async function applyMigration() {
  console.log('🚀 Applying GST Company Cache Migration\n');

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/2025_02_18_create_gst_company_cache.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration SQL:');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    console.log('\n');

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Execute SQL via RPC (if available) or direct query
    // Note: Supabase JS client doesn't support raw SQL execution
    // We'll use the REST API to execute via a function, or output for manual execution
    
    console.log('⚠️  Note: Supabase JavaScript client cannot execute raw SQL directly.');
    console.log('📋 Please apply this migration via one of these methods:\n');
    console.log('✅ Method 1: Supabase Dashboard (Recommended)');
    console.log('   1. Open: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj/sql/new');
    console.log('   2. Copy the SQL above');
    console.log('   3. Paste and click "Run"\n');
    console.log('✅ Method 2: Supabase CLI');
    console.log('   supabase db push\n');
    console.log('✅ Method 3: Direct psql connection');
    console.log('   psql <connection_string> < supabase/migrations/2025_02_18_create_gst_company_cache.sql\n');

    // Try to verify if table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('gst_company_cache')
      .select('gstin')
      .limit(1);

    if (existingTable !== null && !checkError) {
      console.log('✅ Table gst_company_cache already exists!');
      return;
    }

    if (checkError && checkError.code === 'PGRST116') {
      console.log('ℹ️  Table does not exist yet - ready to apply migration');
    } else if (checkError) {
      console.log('ℹ️  Could not check table status:', checkError.message);
    }

    console.log('\n📝 Migration ready to apply!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applyMigration().catch(console.error);

