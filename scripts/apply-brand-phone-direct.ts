#!/usr/bin/env node
/**
 * Apply brand_phone migration using direct PostgreSQL connection
 */

import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD;

// Extract project ref from URL
const urlMatch = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/);
const projectRef = urlMatch ? urlMatch[1] : 'ooaxtwmqrvfzdqzoijcj';

// Construct connection string
// Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
// We need the password from environment or .env

async function applyMigration() {
  console.log('🚀 Applying brand_phone migration...\n');
  
  // Read the migration file
  const migrationPath = join(process.cwd(), 'supabase/migrations/2025_01_31_add_brand_phone_to_brand_deals.sql');
  const sql = readFileSync(migrationPath, 'utf-8');
  
  if (!DB_PASSWORD) {
    console.log('⚠️  Database password not found in environment variables.');
    console.log('📋 Please run this SQL manually in Supabase Dashboard:\n');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    console.log('\n🔗 Dashboard: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.log('\nOr set SUPABASE_DB_PASSWORD in your .env file and run this script again.');
    return;
  }
  
  // Try to construct connection string
  // Note: We need the region, which we can't easily determine
  // The best approach is to use the Supabase Dashboard or get the connection string from there
  
  console.log('📋 To apply this migration, please:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
  console.log('   2. Copy and paste this SQL:');
  console.log('\n─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));
  console.log('\n   3. Click "Run"');
  console.log('\n✅ The migration uses "IF NOT EXISTS" so it\'s safe to run even if already applied.');
}

applyMigration().catch(console.error);

