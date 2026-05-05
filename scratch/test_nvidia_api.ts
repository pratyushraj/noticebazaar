import { callLLM } from '../api/server/services/aiContractAnalysis';
import dotenv from 'dotenv';

dotenv.config();

// Manually set for testing
process.env.LLM_PROVIDER = 'nvidia';
process.env.LLM_MODEL = 'meta/llama-3.1-8b-instruct';
process.env.LLM_API_KEY = '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';

async function testApi() {
  console.log('Testing NVIDIA API integration...');
  try {
    const response = await callLLM('Explain what CreatorArmour is in one sentence.');
    console.log('\n--- AI RESPONSE ---');
    console.log(response);
    console.log('--- END RESPONSE ---\n');
    console.log('API is working perfectly!');
  } catch (error) {
    console.error('API Test Failed:', error.message);
  }
}

testApi();
