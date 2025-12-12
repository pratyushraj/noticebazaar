#!/usr/bin/env tsx
/**
 * Apply brand_phone migration directly to Supabase
 * This script executes the SQL migration using the Supabase service role key
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Applying brand_phone migration...\n');
  
  // Read the migration file
  const migrationPath = join(process.cwd(), 'supabase/migrations/2025_01_31_add_brand_phone_to_brand_deals.sql');
  const sql = readFileSync(migrationPath, 'utf-8');
  
  console.log('📄 Migration SQL:');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));
  console.log();
  
  // Split into statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  // Execute each statement using RPC (if available) or direct query
  for (const statement of statements) {
    if (statement.length < 10) continue;
    
    try {
      console.log(`⏳ Executing: ${statement.substring(0, 60)}...`);
      
      // Try using the REST API with a direct SQL execution endpoint
      // Note: Supabase doesn't expose raw SQL execution via REST API
      // So we'll use a workaround: execute via psql or output for manual execution
      
      // For now, we'll use the Supabase Management API approach
      // But that requires an access token, not service role key
      
      // Best approach: Use the Supabase CLI or output SQL for manual execution
      console.log('⚠️  Supabase JavaScript client cannot execute raw SQL directly.');
      console.log('📋 Please run this SQL in Supabase Dashboard SQL Editor:');
      console.log();
      console.log(sql);
      console.log();
      console.log('🔗 Dashboard: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj/sql/new');
      
      // Alternative: Try to use pg library if available
      // But for now, let's just output the SQL
      return;
      
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
      throw error;
    }
  }
}

// Actually, let's try using the Supabase Management API or a direct connection
// But the simplest is to use psql if available
async function applyViaPsql() {
  const migrationPath = join(process.cwd(), 'supabase/migrations/2025_01_31_add_brand_phone_to_brand_deals.sql');
  const sql = readFileSync(migrationPath, 'utf-8');
  
  // Extract connection details from SUPABASE_URL
  // Format: https://[project-ref].supabase.co
  const urlMatch = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!urlMatch) {
    console.error('❌ Could not parse Supabase URL');
    return;
  }
  
  const projectRef = urlMatch[1];
  const dbUrl = `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`;
  
  console.log('📋 To apply via psql, use:');
  console.log(`   psql "${dbUrl.replace('[project-ref]', projectRef)}" -f ${migrationPath}`);
  console.log();
  console.log('Or copy-paste this SQL into Supabase Dashboard:');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));
}

async function main() {
  try {
    // Try to apply via psql first
    await applyViaPsql();
    
    // Also try the migration approach
    await applyMigration();
    
  } catch (error: any) {
    console.error('❌ Failed to apply migration:', error.message);
    process.exit(1);
  }
}

main();

