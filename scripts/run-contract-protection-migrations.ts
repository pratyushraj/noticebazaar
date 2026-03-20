#!/usr/bin/env tsx
/**
 * Run Contract Protection Migrations
 * 
 * This script executes the contract_issues and lawyer_requests table migrations
 * using the Supabase service role key.
 * 
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=your_key tsx scripts/run-contract-protection-migrations.ts
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

// Create Supabase admin client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql: string, migrationName: string) {
  console.log(`\n📄 Executing ${migrationName}...`);
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    if (statement.length < 10) continue; // Skip very short statements
    
    try {
      // Use RPC to execute SQL (if available) or try direct query
      // Note: Supabase client doesn't support raw SQL execution directly
      // We'll need to use the REST API or psql
      
      // For now, we'll use a workaround: create a temporary function
      console.log(`   ⏳ Executing statement...`);
      
      // Actually, the best approach is to use the REST API directly
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: statement })
      });

      if (response.ok) {
        successCount++;
      } else {
        const error = await response.text();
        console.error(`   ❌ Error: ${error}`);
        errorCount++;
      }
    } catch (error: any) {
      console.error(`   ❌ Error executing statement: ${error.message}`);
      errorCount++;
    }
  }

  return { successCount, errorCount };
}

async function main() {
  console.log('🚀 Running Contract Protection Migrations...\n');
  console.log(`Project: ${SUPABASE_URL}\n`);

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

  for (const migration of migrations) {
    try {
      const sql = readFileSync(join(process.cwd(), migration.file), 'utf-8');
      const result = await executeSQL(sql, migration.name);
      
      if (result.errorCount === 0) {
        console.log(`✅ Successfully applied ${migration.name} migration!`);
      } else {
        console.log(`⚠️  ${migration.name} migration completed with ${result.errorCount} errors`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to read/apply ${migration.name}:`, error.message);
    }
  }

  console.log('\n✨ Migration process completed!');
  console.log('\n📋 Note: If errors occurred, please run the SQL manually via Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj/sql/new');
}

main().catch(console.error);

