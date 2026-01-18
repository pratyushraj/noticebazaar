#!/usr/bin/env node
// Test script for Influencer Finder API
// Usage: node test-influencer-finder.js [endpoint]

import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test functions
async function testHealth() {
  logInfo('Testing health endpoint...');
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    logSuccess('Health check passed');
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

async function testFindInfluencers() {
  logInfo('Testing find influencers endpoint...');
  
  if (!AUTH_TOKEN) {
    logWarning('No AUTH_TOKEN set. Set TEST_AUTH_TOKEN in .env or pass as env var');
    logInfo('Skipping authenticated endpoint test');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/api/influencers/find`, {
      params: {
        hashtags: 'fitness,india',
        keywords: 'influencer,creator',
        limit: 5,
        saveToDb: false // Don't save for testing
      },
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    logSuccess('Find influencers endpoint works!');
    console.log(`Found ${response.data.count} influencers`);
    
    if (response.data.influencers && response.data.influencers.length > 0) {
      console.log('\nSample influencer:');
      const sample = response.data.influencers[0];
      console.log(JSON.stringify({
        creator_name: sample.creator_name,
        instagram_handle: sample.instagram_handle,
        followers: sample.followers,
        niche: sample.niche,
        fit_score: sample.fit_score,
        is_india_based: sample.is_india_based,
        is_relevant_niche: sample.is_relevant_niche
      }, null, 2));
    }
    
    return true;
  } catch (error) {
    logError(`Find influencers failed: ${error.message}`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

async function testListInfluencers() {
  logInfo('Testing list influencers endpoint...');
  
  if (!AUTH_TOKEN) {
    logWarning('No AUTH_TOKEN set. Skipping authenticated endpoint test');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/api/influencers/list`, {
      params: {
        limit: 10
      },
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    logSuccess('List influencers endpoint works!');
    console.log(`Found ${response.data.count} influencers in database`);
    return true;
  } catch (error) {
    logError(`List influencers failed: ${error.message}`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

async function testHighFit() {
  logInfo('Testing high-fit influencers endpoint...');
  
  if (!AUTH_TOKEN) {
    logWarning('No AUTH_TOKEN set. Skipping authenticated endpoint test');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/api/influencers/high-fit`, {
      params: {
        minScore: 7,
        limit: 10
      },
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    logSuccess('High-fit influencers endpoint works!');
    console.log(`Found ${response.data.count} high-fit influencers (score >= ${response.data.min_score})`);
    return true;
  } catch (error) {
    logError(`High-fit influencers failed: ${error.message}`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

async function testGenerateOutreach() {
  logInfo('Testing generate outreach message endpoint...');
  
  if (!AUTH_TOKEN) {
    logWarning('No AUTH_TOKEN set. Skipping authenticated endpoint test');
    return false;
  }

  // First, get an influencer from the database
  try {
    const listResponse = await axios.get(`${API_BASE_URL}/api/influencers/list`, {
      params: { limit: 1 },
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });

    if (!listResponse.data.influencers || listResponse.data.influencers.length === 0) {
      logWarning('No influencers in database. Run find influencers first.');
      return false;
    }

    const handle = listResponse.data.influencers[0].instagram_handle;
    logInfo(`Testing with influencer: @${handle}`);

    const response = await axios.post(
      `${API_BASE_URL}/api/influencers/${handle}/generate-outreach`,
      { template: 'default' },
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logSuccess('Generate outreach endpoint works!');
    console.log('\nGenerated message:');
    console.log(JSON.stringify(response.data.message, null, 2));
    return true;
  } catch (error) {
    logError(`Generate outreach failed: ${error.message}`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

async function testDailyScan() {
  logInfo('Testing daily scan endpoint...');
  
  if (!AUTH_TOKEN) {
    logWarning('No AUTH_TOKEN set. Skipping authenticated endpoint test');
    return false;
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/influencers/run-daily-scan`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logSuccess('Daily scan endpoint works!');
    console.log('\nScan result:');
    console.log(JSON.stringify(response.data.result, null, 2));
    return true;
  } catch (error) {
    logError(`Daily scan failed: ${error.message}`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

// Main test runner
async function runTests() {
  const endpoint = process.argv[2];
  
  log('\n🧪 Influencer Finder API Test Suite\n', 'blue');
  logInfo(`API Base URL: ${API_BASE_URL}`);
  logInfo(`Auth Token: ${AUTH_TOKEN ? 'SET' : 'NOT SET'}\n`);

  const results = {
    health: false,
    find: false,
    list: false,
    highFit: false,
    outreach: false,
    dailyScan: false
  };

  // Always test health first
  results.health = await testHealth();
  console.log('');

  if (!results.health) {
    logError('Health check failed. Is the server running?');
    logInfo('Start server with: cd server && npm run dev');
    process.exit(1);
  }

  // Test specific endpoint or all
  if (endpoint === 'health') {
    // Only health, already done
  } else if (endpoint === 'find') {
    results.find = await testFindInfluencers();
  } else if (endpoint === 'list') {
    results.list = await testListInfluencers();
  } else if (endpoint === 'high-fit') {
    results.highFit = await testHighFit();
  } else if (endpoint === 'outreach') {
    results.outreach = await testGenerateOutreach();
  } else if (endpoint === 'daily-scan') {
    results.dailyScan = await testDailyScan();
  } else {
    // Test all endpoints
    results.find = await testFindInfluencers();
    console.log('');
    
    results.list = await testListInfluencers();
    console.log('');
    
    results.highFit = await testHighFit();
    console.log('');
    
    results.outreach = await testGenerateOutreach();
    console.log('');
    
    results.dailyScan = await testDailyScan();
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  log('\n📊 Test Summary\n', 'blue');
  
  const testNames = {
    health: 'Health Check',
    find: 'Find Influencers',
    list: 'List Influencers',
    highFit: 'High-Fit Influencers',
    outreach: 'Generate Outreach',
    dailyScan: 'Daily Scan'
  };

  Object.entries(results).forEach(([key, passed]) => {
    if (passed) {
      logSuccess(`${testNames[key]}: PASSED`);
    } else if (endpoint && endpoint !== key) {
      // Skip if testing specific endpoint
    } else {
      logError(`${testNames[key]}: FAILED`);
    }
  });

  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.values(results).filter(v => v !== undefined).length;
  
  console.log('');
  if (passedCount === totalCount) {
    logSuccess(`All tests passed! (${passedCount}/${totalCount})`);
  } else {
    logWarning(`Some tests failed (${passedCount}/${totalCount} passed)`);
  }
  
  console.log('');
}

// Run tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});

