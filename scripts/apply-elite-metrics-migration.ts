import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();
dotenv.config({ path: resolve(__dirname, '../server/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    console.log('🔧 Applying Elite and Performance Metrics migration...');

    const migrationFile = resolve(__dirname, '../supabase/migrations/20260508000000_add_elite_performance_metrics.sql');
    console.log(`Reading from: ${migrationFile}`);
    const migrationSQL = readFileSync(migrationFile, 'utf-8');

    // Split by semicolons and execute each statement
    const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    for (const statement of statements) {
        if (statement.trim()) {
            console.log(`Executing: ${statement.substring(0, 80)}...`);
            const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

            if (error) {
                console.error('❌ Error executing statement:', error);
                console.error('Statement:', statement);
            } else {
                console.log('✅ Statement executed successfully');
            }
        }
    }

    console.log('✅ Migration completed!');
}

applyMigration().catch(console.error);
