/**
 * Message System Test Script
 * Run this in browser console on your app
 * 
 * Usage: Copy and paste this entire script into browser console
 */

(async function testMessages() {
  console.log('🧪 Starting Message System Tests...\n');
  
  // Import Supabase client (adjust path if needed)
  let supabase;
  try {
    // Try to get from window if available
    if (window.supabase) {
      supabase = window.supabase;
    } else {
      // Try dynamic import (adjust path based on your setup)
      const module = await import('/src/integrations/supabase/client.ts');
      supabase = module.supabase || module.default;
    }
  } catch (err) {
    console.error('❌ Could not load Supabase client:', err);
    console.log('💡 Make sure you run this in your app\'s browser console');
    return;
  }
  
  if (!supabase) {
    console.error('❌ Supabase client not found');
    return;
  }
  
  const results = {
    legacyMessages: { pass: false, error: null },
    newMessages: { pass: false, error: null },
    conversations: { pass: false, error: null },
    participants: { pass: false, error: null },
    userAuth: { pass: false, error: null }
  };
  
  // Test 1: Check user authentication
  console.log('📋 Test 1: User Authentication');
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      results.userAuth.error = userError.message;
      console.error('❌ User auth error:', userError);
    } else if (user) {
      results.userAuth.pass = true;
      console.log('✅ User authenticated:', user.id);
    } else {
      console.log('⚠️  No user logged in');
    }
  } catch (err) {
    results.userAuth.error = err.message;
    console.error('❌ User auth test failed:', err);
  }
  
  // Test 2: Check legacy_messages table
  console.log('\n📋 Test 2: Legacy Messages Table');
  try {
    const { data: legacyData, error: legacyError } = await supabase
      .from('legacy_messages')
      .select('id, sender_id, receiver_id, content, sent_at')
      .limit(1);
    
    if (legacyError) {
      results.legacyMessages.error = legacyError.message;
      console.error('❌ Legacy messages error:', legacyError);
    } else {
      results.legacyMessages.pass = true;
      console.log('✅ Legacy messages accessible');
      if (legacyData && legacyData.length > 0) {
        console.log('   Found', legacyData.length, 'message(s)');
      }
    }
  } catch (err) {
    results.legacyMessages.error = err.message;
    console.error('❌ Legacy messages test failed:', err);
  }
  
  // Test 3: Check new messages table
  console.log('\n📋 Test 3: New Messages Table');
  try {
    const { data: newData, error: newError } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, sent_at')
      .limit(1);
    
    if (newError) {
      results.newMessages.error = newError.message;
      console.error('❌ New messages error:', newError);
    } else {
      results.newMessages.pass = true;
      console.log('✅ New messages accessible');
      if (newData && newData.length > 0) {
        console.log('   Found', newData.length, 'message(s)');
      }
    }
  } catch (err) {
    results.newMessages.error = err.message;
    console.error('❌ New messages test failed:', err);
  }
  
  // Test 4: Check conversations
  console.log('\n📋 Test 4: Conversations Table');
  try {
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .select('id, title, risk_tag')
      .limit(1);
    
    if (convError) {
      results.conversations.error = convError.message;
      console.error('❌ Conversations error:', convError);
    } else {
      results.conversations.pass = true;
      console.log('✅ Conversations accessible');
      if (convData && convData.length > 0) {
        console.log('   Found', convData.length, 'conversation(s)');
      }
    }
  } catch (err) {
    results.conversations.error = err.message;
    console.error('❌ Conversations test failed:', err);
  }
  
  // Test 5: Check conversation_participants
  console.log('\n📋 Test 5: Conversation Participants');
  try {
    const { data: partData, error: partError } = await supabase
      .from('conversation_participants')
      .select('id, conversation_id, user_id, role')
      .limit(1);
    
    if (partError) {
      results.participants.error = partError.message;
      console.error('❌ Participants error:', partError);
    } else {
      results.participants.pass = true;
      console.log('✅ Participants accessible');
      if (partData && partData.length > 0) {
        console.log('   Found', partData.length, 'participant(s)');
      }
    }
  } catch (err) {
    results.participants.error = err.message;
    console.error('❌ Participants test failed:', err);
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r.pass).length;
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.pass ? '✅' : '❌';
    console.log(`${status} ${test}:`, result.pass ? 'PASS' : `FAIL - ${result.error}`);
  });
  
  console.log(`\n📈 Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Message system is working.');
  } else {
    console.log('⚠️  Some tests failed. Check errors above.');
  }
  
  return results;
})();

