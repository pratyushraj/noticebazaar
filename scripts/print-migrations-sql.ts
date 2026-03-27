#!/usr/bin/env tsx
/**
 * Print migrations SQL for easy copy-paste into Supabase Dashboard
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const MIGRATIONS = [
  'supabase/migrations/2025_12_01_create_contract_issues_table.sql',
  'supabase/migrations/2025_12_01_create_lawyer_requests_table.sql'
];

console.log('📋 Copy the SQL below and paste into Supabase Dashboard SQL Editor:\n');
console.log('🔗 https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj/sql/new\n');
console.log('═'.repeat(80));
console.log('\n');

MIGRATIONS.forEach((file, index) => {
  try {
    const sql = readFileSync(join(process.cwd(), file), 'utf-8');
    console.log(`-- Migration ${index + 1}: ${file.split('/').pop()}`);
    console.log(sql);
    console.log('\n' + '─'.repeat(80) + '\n');
  } catch (error) {
    console.error(`❌ Error reading ${file}:`, error);
  }
});

console.log('\n✅ Copy all SQL above and run in Supabase Dashboard SQL Editor');

