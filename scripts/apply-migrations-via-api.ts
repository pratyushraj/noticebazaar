#!/usr/bin/env tsx
/**
 * Apply migrations via Supabase REST API
 * Uses the Management API to execute SQL directly
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_PROJECT_REF = 'ooaxtwmqrvfzdqzoijcj';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

async function applyMigration(sql: string, name: string) {
  console.log(`\n📄 Applying ${name} migration...`);
  
  // Use Supabase Management API
  // Note: This requires a Supabase Access Token, not the service role key
  // For direct SQL execution, we need to use psql or the Dashboard
  
  // Alternative: Use the PostgREST API with service role key
  // But PostgREST doesn't support arbitrary SQL execution
  
  // The most reliable way is to output the SQL for manual execution
  console.log(`\n📋 SQL for ${name}:`);
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));
  
  return { success: true };
}

async function main() {
  console.log('🚀 Contract Protection Migrations\n');
  console.log('⚠️  Note: Supabase JavaScript client cannot execute raw SQL directly.');
  console.log('📋 The SQL will be displayed below for you to copy-paste into Supabase Dashboard.\n');
  console.log('🔗 Dashboard: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj/sql/new\n');

  const migrations = [
    {
      name: 'contract_issues',
      file: 'supabase/migrations/2025_12_01_create_contract_issues_table.sql'
    },
    {
      name: 'lawyer_requests',
      file: 'supabase/migrations/2025_12_01_create_lawyer_requests_table.sql'
    }
  ];

  let allSQL = '';

  for (const migration of migrations) {
    try {
      const sql = readFileSync(join(process.cwd(), migration.file), 'utf-8');
      allSQL += `\n-- ${migration.name.toUpperCase()}\n${sql}\n\n`;
      await applyMigration(sql, migration.name);
    } catch (error: any) {
      console.error(`❌ Failed to read ${migration.file}:`, error.message);
    }
  }

  // Also write to file
  const outputFile = join(process.cwd(), 'MIGRATIONS_TO_RUN.sql');
  require('fs').writeFileSync(outputFile, allSQL);
  console.log(`\n✅ Combined SQL written to: ${outputFile}`);
  console.log('\n📋 Next steps:');
  console.log('   1. Open: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj/sql/new');
  console.log('   2. Copy the SQL from MIGRATIONS_TO_RUN.sql');
  console.log('   3. Paste and click "Run"');
}

main().catch(console.error);

