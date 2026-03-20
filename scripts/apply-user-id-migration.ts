#!/usr/bin/env tsx
/**
 * Apply user_id migration to protection_reports table
 * Uses Supabase Management API
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: join(process.cwd(), 'server', '.env') });

const SUPABASE_PROJECT_REF = 'ooaxtwmqrvfzdqzoijcj';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ANON_KEY;

async function applyMigration() {
  const migrationFile = join(process.cwd(), 'supabase/migrations/2025_01_31_add_user_id_to_protection_reports.sql');
  const sql = readFileSync(migrationFile, 'utf-8');

  console.log('📄 Migration SQL:');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));
  console.log('\n');

  if (!SUPABASE_ACCESS_TOKEN) {
    console.log('⚠️  SUPABASE_ACCESS_TOKEN not found in environment variables.');
    console.log('📋 Please apply this migration manually via Supabase Dashboard:\n');
    console.log('   1. Go to: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj/sql/new');
    console.log('   2. Copy the SQL above');
    console.log('   3. Paste and click "Run"\n');
    return;
  }

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: sql,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} ${error}`);
    }

    const result = await response.json();
    console.log('✅ Migration applied successfully!');
    console.log('Result:', result);
  } catch (error: any) {
    console.error('❌ Failed to apply migration via API:', error.message);
    console.log('\n📋 Please apply this migration manually via Supabase Dashboard:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj/sql/new');
    console.log('   2. Copy the SQL above');
    console.log('   3. Paste and click "Run"\n');
  }
}

applyMigration().catch(console.error);

