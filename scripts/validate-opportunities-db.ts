/**
 * Database Validation Script for Opportunities Feature
 * 
 * Validates:
 * - No invalid apply URLs (internal/localhost)
 * - No empty budgets without fallback handling
 * - No expired opportunities shown as active
 * - No duplicate brands
 * - All required fields present
 * 
 * Run: tsx scripts/validate-opportunities-db.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Security: Same validation as sync script
function isValidExternalUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const blockedHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      'noticebazaar.com',
      'noticebazaar.vercel.app',
      'noticebazaar.netlify.app',
      'supabase.co'
    ];
    const hostname = parsed.hostname.toLowerCase();
    return !blockedHosts.some(blocked => hostname.includes(blocked));
  } catch {
    return false;
  }
}

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalOpportunities: number;
    totalBrands: number;
    activeOpportunities: number;
    expiredOpportunities: number;
    opportunitiesWithApplyUrl: number;
    opportunitiesWithoutApplyUrl: number;
  };
}

async function validateDatabase(): Promise<ValidationResult> {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
    stats: {
      totalOpportunities: 0,
      totalBrands: 0,
      activeOpportunities: 0,
      expiredOpportunities: 0,
      opportunitiesWithApplyUrl: 0,
      opportunitiesWithoutApplyUrl: 0,
    }
  };

  console.log('🔍 Starting database validation...\n');

  // 1. Validate Opportunities
  console.log('📊 Validating opportunities...');
  const { data: opportunities, error: oppError } = await supabase
    .from('opportunities')
    .select('id, title, apply_url, brand_id, deadline, payout_min, payout_max, status, description, deliverable_type')
    .order('created_at', { ascending: false });

  if (oppError) {
    result.errors.push(`Failed to fetch opportunities: ${oppError.message}`);
    result.passed = false;
    return result;
  }

  result.stats.totalOpportunities = opportunities?.length || 0;
  const now = new Date();

  opportunities?.forEach((opp) => {
    // Check for invalid apply URLs
    if (opp.apply_url) {
      if (!isValidExternalUrl(opp.apply_url)) {
        result.errors.push(`❌ Invalid apply_url (internal/blocked): ${opp.title} - ${opp.apply_url}`);
        result.passed = false;
      } else {
        result.stats.opportunitiesWithApplyUrl++;
      }
    } else {
      result.stats.opportunitiesWithoutApplyUrl++;
      result.warnings.push(`⚠️  Missing apply_url: ${opp.title}`);
    }

    // Check for expired opportunities marked as open
    const deadline = new Date(opp.deadline);
    if (opp.status === 'open' && deadline < now) {
      result.errors.push(`❌ Expired opportunity marked as open: ${opp.title} (deadline: ${opp.deadline})`);
      result.passed = false;
    }

    if (opp.status === 'open') {
      result.stats.activeOpportunities++;
    } else if (opp.status === 'expired') {
      result.stats.expiredOpportunities++;
    }

    // Check for zero budgets (should have fallback in UI)
    if (opp.payout_min === 0 && opp.payout_max === 0) {
      result.warnings.push(`⚠️  Zero budget: ${opp.title} (UI should show "Budget Not Provided")`);
    }

    // Check for missing description (should have fallback in UI)
    if (!opp.description || opp.description.trim().length === 0) {
      result.warnings.push(`⚠️  Missing description: ${opp.title} (UI should show "No description available")`);
    }

    // Check for missing deliverable_type
    if (!opp.deliverable_type || opp.deliverable_type.trim().length === 0) {
      result.errors.push(`❌ Missing deliverable_type: ${opp.title}`);
      result.passed = false;
    }

    // Check for missing brand_id
    if (!opp.brand_id) {
      result.errors.push(`❌ Missing brand_id: ${opp.title}`);
      result.passed = false;
    }
  });

  // 2. Validate Brands
  console.log('🏢 Validating brands...');
  const { data: brands, error: brandError } = await supabase
    .from('brands')
    .select('id, name, status')
    .eq('status', 'active');

  if (brandError) {
    result.errors.push(`Failed to fetch brands: ${brandError.message}`);
    result.passed = false;
    return result;
  }

  result.stats.totalBrands = brands?.length || 0;

  // Check for duplicate brand names
  const brandNames = new Map<string, string[]>();
  brands?.forEach((brand) => {
    const normalizedName = brand.name.toLowerCase().trim();
    if (!brandNames.has(normalizedName)) {
      brandNames.set(normalizedName, []);
    }
    brandNames.get(normalizedName)?.push(brand.id);
  });

  brandNames.forEach((ids, name) => {
    if (ids.length > 1) {
      result.warnings.push(`⚠️  Duplicate brand name: "${name}" (${ids.length} instances)`);
    }
  });

  // 3. Validate Brand-Opportunity Relationships
  console.log('🔗 Validating brand-opportunity relationships...');
  const { data: orphanedOpps } = await supabase
    .from('opportunities')
    .select('id, title, brand_id')
    .not('brand_id', 'is', null);

  if (orphanedOpps) {
    for (const opp of orphanedOpps) {
      const { data: brand } = await supabase
        .from('brands')
        .select('id')
        .eq('id', opp.brand_id)
        .single();

      if (!brand) {
        result.errors.push(`❌ Orphaned opportunity: ${opp.title} (brand_id ${opp.brand_id} not found)`);
        result.passed = false;
      }
    }
  }

  return result;
}

async function main() {
  console.log('🚀 Opportunities Database Validation\n');
  console.log('=' .repeat(50) + '\n');

  const result = await validateDatabase();

  // Print Results
  console.log('\n' + '='.repeat(50));
  console.log('📈 STATISTICS');
  console.log('='.repeat(50));
  console.log(`Total Opportunities: ${result.stats.totalOpportunities}`);
  console.log(`Active Opportunities: ${result.stats.activeOpportunities}`);
  console.log(`Expired Opportunities: ${result.stats.expiredOpportunities}`);
  console.log(`Opportunities with apply_url: ${result.stats.opportunitiesWithApplyUrl}`);
  console.log(`Opportunities without apply_url: ${result.stats.opportunitiesWithoutApplyUrl}`);
  console.log(`Total Brands: ${result.stats.totalBrands}`);

  if (result.warnings.length > 0) {
    console.log('\n' + '='.repeat(50));
    console.log('⚠️  WARNINGS');
    console.log('='.repeat(50));
    result.warnings.forEach(w => console.log(w));
  }

  if (result.errors.length > 0) {
    console.log('\n' + '='.repeat(50));
    console.log('❌ ERRORS');
    console.log('='.repeat(50));
    result.errors.forEach(e => console.log(e));
  }

  console.log('\n' + '='.repeat(50));
  if (result.passed && result.errors.length === 0) {
    console.log('✅ VALIDATION PASSED');
    console.log('='.repeat(50));
    process.exit(0);
  } else {
    console.log('❌ VALIDATION FAILED');
    console.log('='.repeat(50));
    console.log(`Found ${result.errors.length} error(s) and ${result.warnings.length} warning(s)`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Validation script failed:', error);
  process.exit(1);
});

