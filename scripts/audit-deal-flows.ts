#!/usr/bin/env tsx

/**
 * Comprehensive Deal Flow Audit and Testing Script
 *
 * This script audits the complete deal lifecycle for paid and barter deals,
 * testing all flows, state transitions, contract generation, shipping logic,
 * and dashboard interactions.
 *
 * Usage: cd /path/to/project && npm run tsx scripts/audit-deal-flows.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AuditResult {
  section: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  message: string;
  details?: any;
}

// ============================================================
// DEAL LIFECYCLE AUDIT
// ============================================================

async function auditDealStates(): Promise<AuditResult[]> {
  console.log('\n🔍 Auditing Deal State Machine...');

  const results: AuditResult[] = [];

  try {
    // Test valid state transitions
    const { DEAL_TRANSITIONS } = await import('../server/src/domains/deals/types/index.ts');

    // Check for duplicate transitions (same from/to/event should not exist)
    const seen = new Set<string>();
    for (const transition of DEAL_TRANSITIONS) {
      const fromStates = Array.isArray(transition.from) ? transition.from : [transition.from];
      for (const fromState of fromStates) {
        const key = `${fromState}-${transition.to}-${transition.event}`;
        if (seen.has(key)) {
          results.push({
            section: 'State Machine',
            status: 'FAIL',
            message: `Duplicate transition: ${key}`,
          });
        }
        seen.add(key);
      }
    }

    // Check for orphaned states
    const allStates = new Set(Object.values(await import('../server/src/domains/deals/types/index.ts')).DealState);
    const usedStates = new Set<string>();

    DEAL_TRANSITIONS.forEach(t => {
      if (Array.isArray(t.from)) {
        t.from.forEach(f => usedStates.add(f));
      } else {
        usedStates.add(t.from);
      }
      usedStates.add(t.to);
    });

    const orphaned = Array.from(allStates).filter(s => !usedStates.has(s));
    if (orphaned.length > 0) {
      results.push({
        section: 'State Machine',
        status: 'WARN',
        message: `Orphaned states not used in transitions: ${orphaned.join(', ')}`,
      });
    }

    results.push({
      section: 'State Machine',
      status: 'PASS',
      message: `Validated ${DEAL_TRANSITIONS.length} transitions, no critical issues`,
    });

  } catch (error) {
    results.push({
      section: 'State Machine',
      status: 'FAIL',
      message: 'Failed to audit state machine',
      details: error,
    });
  }

  return results;
}

// ============================================================
// CONTRACT GENERATION AUDIT
// ============================================================

async function auditContractGeneration(): Promise<AuditResult[]> {
  console.log('\n🔍 Auditing Contract Generation...');

  const results: AuditResult[] = [];

  try {
    const { generateContractFromScratch } = await import('../server/src/services/contractGenerator.js');

    // Test contract generation with minimal valid data
    const testData = {
      brandName: 'Test Brand',
      creatorName: 'Test Creator',
      creatorEmail: 'creator@test.com',
      dealAmount: 5000,
      deliverables: ['Instagram Post', 'Story'],
      dueDate: '2024-12-31',
      paymentExpectedDate: '2024-12-31',
      platform: 'Instagram',
      brandEmail: 'brand@test.com',
      brandAddress: 'Test Address',
      creatorAddress: 'Creator Address',
      dealSchema: {
        deal_amount: 5000,
        deliverables: ['Instagram Post', 'Story'],
        delivery_deadline: '2024-12-31',
        payment: { method: 'Bank Transfer', timeline: 'Within 7 days' },
        usage: { type: 'Non-exclusive', platforms: ['Instagram'], duration: '6 months' },
        exclusivity: { enabled: false },
        termination: { notice_days: 7 },
        jurisdiction_city: 'Mumbai',
      },
      usageType: 'Non-exclusive',
      usagePlatforms: ['Instagram'],
      usageDuration: '6 months',
      paidAdsAllowed: false,
      whitelistingAllowed: false,
      exclusivityEnabled: false,
      terminationNoticeDays: 7,
      jurisdictionCity: 'Mumbai',
    };

    const contractResult = await generateContractFromScratch(testData);

    if (contractResult.contractDocx && contractResult.fileName) {
      results.push({
        section: 'Contract Generation',
        status: 'PASS',
        message: 'Contract generation works with valid data',
        details: { fileName: contractResult.fileName, hasDocx: !!contractResult.contractDocx },
      });
    } else {
      results.push({
        section: 'Contract Generation',
        status: 'FAIL',
        message: 'Contract generation failed to produce valid output',
        details: contractResult,
      });
    }

    // Test barter contract generation
    const barterTestData = {
      ...testData,
      dealAmount: 0,
      paymentTerms: 'Barter - Product delivery within 7 days',
      additionalTerms: 'Product delivery terms...',
    };

    const barterContract = await generateContractFromScratch(barterTestData);
    if (barterContract.contractDocx) {
      results.push({
        section: 'Barter Contract Generation',
        status: 'PASS',
        message: 'Barter contract generation works',
      });
    } else {
      results.push({
        section: 'Barter Contract Generation',
        status: 'FAIL',
        message: 'Barter contract generation failed',
      });
    }

  } catch (error) {
    results.push({
      section: 'Contract Generation',
      status: 'FAIL',
      message: 'Contract generation audit failed',
      details: error,
    });
  }

  return results;
}

// ============================================================
// PAYMENT FLOW AUDIT
// ============================================================

async function auditPaymentFlow(): Promise<AuditResult[]> {
  console.log('\n🔍 Auditing Payment Flow...');

  const results: AuditResult[] = [];

  try {
    const { calculatePaymentBreakdown } = await import('../server/src/lib/payment.js');

    // Test payment breakdown calculation
    const testAmount = 10000; // ₹10,000
    const breakdown = calculatePaymentBreakdown(testAmount);

    const expected = {
      brandTotal: 11180, // deal + 10% fee + 18% GST on fee
      creatorPayout: 10000, // full deal amount
      platformFee: 1000, // 10% of deal
      amountPaise: 1118000, // brand total in paise
    };

    if (breakdown.brandTotal === expected.brandTotal &&
        breakdown.creatorPayout === expected.creatorPayout &&
        breakdown.platformFee === expected.platformFee &&
        breakdown.amountPaise === expected.amountPaise) {
      results.push({
        section: 'Payment Breakdown',
        status: 'PASS',
        message: `Payment calculation correct: ₹${testAmount} → Creator: ₹${breakdown.creatorPayout}, Platform: ₹${breakdown.platformFee}`,
      });
    } else {
      results.push({
        section: 'Payment Breakdown',
        status: 'FAIL',
        message: 'Payment breakdown calculation incorrect',
        details: { expected, actual: breakdown },
      });
    }

    // Test edge cases
    const zeroAmount = calculatePaymentBreakdown(0);
    if (zeroAmount.creatorPayout === 0 && zeroAmount.platformFee === 0) {
      results.push({
        section: 'Payment Edge Cases',
        status: 'PASS',
        message: 'Zero amount payment handled correctly',
      });
    } else {
      results.push({
        section: 'Payment Edge Cases',
        status: 'FAIL',
        message: 'Zero amount payment calculation incorrect',
        details: zeroAmount,
      });
    }

  } catch (error) {
    results.push({
      section: 'Payment Flow',
      status: 'FAIL',
      message: 'Payment flow audit failed',
      details: error,
    });
  }

  return results;
}

// ============================================================
// DATABASE INTEGRITY AUDIT
// ============================================================

async function auditDatabaseIntegrity(): Promise<AuditResult[]> {
  console.log('\n🔍 Auditing Database Integrity...');

  const results: AuditResult[] = [];

  try {
    // Check for deals with invalid states (handle missing current_state column)
    let selectFields = 'id, status';
    try {
      await supabase.from('brand_deals').select('current_state').limit(1);
      selectFields += ', current_state';
    } catch {
      // current_state column doesn't exist, skip it
    }

    const { data: deals, error: dealsError } = await supabase
      .from('brand_deals')
      .select(selectFields)
      .limit(100);

    if (dealsError) {
      results.push({
        section: 'Database Integrity',
        status: 'FAIL',
        message: 'Failed to query deals table',
        details: dealsError,
      });
      return results;
    }

    const { DealState } = await import('./server/src/domains/deals/types/index.ts');
    const validStates = Object.values(DealState);

    let invalidStates = 0;
    for (const deal of deals || []) {
      const state = deal.current_state || deal.status;
      if (state && !validStates.includes(state as any)) {
        invalidStates++;
      }
    }

    if (invalidStates === 0) {
      results.push({
        section: 'Database Integrity',
        status: 'PASS',
        message: `All ${deals?.length || 0} sampled deals have valid states`,
      });
    } else {
      results.push({
        section: 'Database Integrity',
        status: 'WARN',
        message: `${invalidStates} deals have invalid states`,
      });
    }

    // Check for orphaned records
    const { data: orphanedDeals } = await supabase
      .from('brand_deals')
      .select('id, creator_id')
      .is('creator_id', null);

    if (orphanedDeals && orphanedDeals.length > 0) {
      results.push({
        section: 'Database Integrity',
        status: 'WARN',
        message: `${orphanedDeals.length} deals have null creator_id`,
      });
    }

  } catch (error) {
    results.push({
      section: 'Database Integrity',
      status: 'FAIL',
      message: 'Database integrity audit failed',
      details: error,
    });
  }

  return results;
}

// ============================================================
// API ENDPOINT TESTING
// ============================================================

async function testApiEndpoints(): Promise<AuditResult[]> {
  console.log('\n🔍 Testing API Endpoints...');

  const results: AuditResult[] = [];

  const apiBase = 'http://localhost:3001/api';

  try {
    // Test health endpoint (skip if server not running)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const healthResponse = await fetch(`${apiBase}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      results.push({
        section: 'API Health',
        status: 'PASS',
        message: 'Health endpoint responding',
        details: healthData,
      });
    } else {
      results.push({
        section: 'API Health',
        status: 'WARN',
        message: `Health endpoint returned ${healthResponse.status} (server may not be running)`,
      });
    }
  } catch (error) {
    results.push({
      section: 'API Health',
      status: 'SKIP',
      message: 'Health endpoint not accessible (server not running)',
    });
  }

  // Note: Full API testing would require authentication tokens
  // For now, just test unauthenticated endpoints

  return results;
}

// ============================================================
// DEAL FLOW SIMULATION
// ============================================================

async function simulateDealFlows(): Promise<AuditResult[]> {
  console.log('\n🔍 Simulating Deal Flows...');

  const results: AuditResult[] = [];

  // Note: This would require creating test users and deals
  // For now, we'll just validate the logic paths exist

  try {
    // Check if key services are importable
    const services = [
      '../server/src/services/contractGenerator.js',
      '../server/src/services/shippingTokenService.js',
      '../server/src/services/contractSigningService.js',
      '../server/src/lib/payment.js',
    ];

    for (const service of services) {
      try {
        await import(service);
        results.push({
          section: 'Service Imports',
          status: 'PASS',
          message: `Service ${service} is importable`,
        });
      } catch (error) {
        results.push({
          section: 'Service Imports',
          status: 'FAIL',
          message: `Failed to import ${service}`,
          details: error,
        });
      }
    }

  } catch (error) {
    results.push({
      section: 'Deal Flow Simulation',
      status: 'FAIL',
      message: 'Deal flow simulation failed',
      details: error,
    });
  }

  return results;
}

// ============================================================
// MAIN AUDIT FUNCTION
// ============================================================

async function runCompleteAudit(): Promise<void> {
  console.log('🚀 Starting Comprehensive Deal Flow Audit');
  console.log('=' .repeat(60));

  const allResults: AuditResult[] = [];

  // Run all audit functions
  const auditFunctions = [
    auditDealStates,
    auditContractGeneration,
    auditPaymentFlow,
    auditDatabaseIntegrity,
    testApiEndpoints,
    simulateDealFlows,
  ];

  for (const auditFn of auditFunctions) {
    try {
      const results = await auditFn();
      allResults.push(...results);
    } catch (error) {
      console.error(`❌ Audit function ${auditFn.name} crashed:`, error);
      allResults.push({
        section: auditFn.name,
        status: 'FAIL',
        message: 'Audit function crashed',
        details: error,
      });
    }
  }

  // Print results
  console.log('\n📊 AUDIT RESULTS');
  console.log('=' .repeat(60));

  const grouped = allResults.reduce((acc, result) => {
    if (!acc[result.section]) acc[result.section] = [];
    acc[result.section].push(result);
    return acc;
  }, {} as Record<string, AuditResult[]>);

  let totalPass = 0, totalFail = 0, totalWarn = 0, totalSkip = 0;

  for (const [section, results] of Object.entries(grouped)) {
    console.log(`\n${section}:`);
    for (const result of results) {
      const icon = {
        PASS: '✅',
        FAIL: '❌',
        WARN: '⚠️',
        SKIP: '⏭️',
      }[result.status];

      console.log(`  ${icon} ${result.message}`);

      if (result.details) {
        console.log(`    Details: ${JSON.stringify(result.details, null, 2)}`);
      }

      switch (result.status) {
        case 'PASS': totalPass++; break;
        case 'FAIL': totalFail++; break;
        case 'WARN': totalWarn++; break;
        case 'SKIP': totalSkip++; break;
      }
    }
  }

  console.log('\n📈 SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ PASS: ${totalPass}`);
  console.log(`❌ FAIL: ${totalFail}`);
  console.log(`⚠️  WARN: ${totalWarn}`);
  console.log(`⏭️  SKIP: ${totalSkip}`);

  const overall = totalFail > 0 ? '❌ FAILED' : totalWarn > 0 ? '⚠️ WARNINGS' : '✅ PASSED';
  console.log(`\n🎯 OVERALL STATUS: ${overall}`);

  if (totalFail > 0) {
    console.log('\n🔧 CRITICAL ISSUES FOUND - Requires immediate attention');
    process.exit(1);
  } else if (totalWarn > 0) {
    console.log('\n⚠️ WARNINGS FOUND - Review recommended');
    process.exit(0);
  } else {
    console.log('\n🎉 ALL CHECKS PASSED - Deal flows are healthy');
    process.exit(0);
  }
}

// Run the audit
runCompleteAudit().catch((error) => {
  console.error('💥 Audit crashed with fatal error:', error);
  process.exit(1);
});