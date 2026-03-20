#!/usr/bin/env tsx
/**
 * Script to apply contract protection migrations to Supabase
 * 
 * This script applies the contract_issues and lawyer_requests table migrations
 * directly to your Supabase database using the Management API.
 * 
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=your_token SUPABASE_PROJECT_REF=your_ref tsx scripts/apply-contract-protection-migrations.ts
 * 
 * Or set in .env file:
 *   SUPABASE_ACCESS_TOKEN=your_token
 *   SUPABASE_PROJECT_REF=your_ref
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'ooaxtwmqrvfzdqzoijcj';

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ Error: SUPABASE_ACCESS_TOKEN is required');
  console.log('\nTo get your access token:');
  console.log('1. Go to https://supabase.com/dashboard/account/tokens');
  console.log('2. Create a new access token');
  console.log('3. Set it as: export SUPABASE_ACCESS_TOKEN=your_token');
  console.log('\nOr add it to your .env file:');
  console.log('   SUPABASE_ACCESS_TOKEN=your_token');
  process.exit(1);
}

const MIGRATIONS = [
  {
    name: 'contract_issues',
    file: 'supabase/migrations/2025_12_01_create_contract_issues_table.sql'
  },
  {
    name: 'lawyer_requests',
    file: 'supabase/migrations/2025_12_01_create_lawyer_requests_table.sql'
  }
];

async function applyMigration(sql: string, name: string) {
  const url = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    // If Management API doesn't work, fall back to instructions
    if (error.message?.includes('401') || error.message?.includes('403')) {
      throw new Error('Authentication failed. Please check your SUPABASE_ACCESS_TOKEN.');
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 Applying Contract Protection Migrations...\n');
  console.log(`Project: ${SUPABASE_PROJECT_REF}\n`);

  for (const migration of MIGRATIONS) {
    try {
      console.log(`📄 Reading ${migration.name} migration...`);
      const sql = readFileSync(join(process.cwd(), migration.file), 'utf-8');
      
      console.log(`⏳ Applying ${migration.name} migration...`);
      await applyMigration(sql, migration.name);
      console.log(`✅ Successfully applied ${migration.name} migration!\n`);
    } catch (error: any) {
      console.error(`❌ Failed to apply ${migration.name} migration:`);
      console.error(error.message);
      console.log('\n📋 Manual Application Required:');
      console.log('Please apply this migration manually via Supabase Dashboard:');
      console.log(`   1. Go to: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/sql/new`);
      console.log(`   2. Copy contents of: ${migration.file}`);
      console.log(`   3. Paste and click "Run"\n`);
      
      if (error.message.includes('Authentication')) {
        process.exit(1);
      }
    }
  }

  console.log('✨ All migrations completed!');
  console.log('\n🧪 Test the feature:');
  console.log('   1. Navigate to the Protection page');
  console.log('   2. Click on a contract card');
  console.log('   3. Try "Mark Issue Resolved" or "Request Lawyer Help"');
}

main().catch(console.error);

