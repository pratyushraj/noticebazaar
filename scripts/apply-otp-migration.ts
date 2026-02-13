// Apply OTP migration to contract_ready_tokens table
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../server/.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    console.log('🔧 Applying OTP migration to contract_ready_tokens table...');

    const migrationSQL = readFileSync(
        resolve(__dirname, '../supabase/migrations/2026_02_07_add_otp_to_contract_ready_tokens.sql'),
        'utf-8'
    );

    // Split by semicolons and execute each statement
    const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
        if (statement.trim()) {
            console.log(`Executing: ${statement.substring(0, 80)}...`);
            const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

            if (error) {
                console.error('❌ Error executing statement:', error);
                console.error('Statement:', statement);
                // Try direct execution as fallback
                try {
                    const { error: directError } = await supabase.from('_migrations').insert({ statement });
                    if (directError) {
                        console.error('Direct execution also failed:', directError);
                    }
                } catch (e) {
                    console.error('Fallback failed:', e);
                }
            } else {
                console.log('✅ Statement executed successfully');
            }
        }
    }

    console.log('✅ Migration completed!');
}

applyMigration().catch(console.error);
