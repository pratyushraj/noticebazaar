/**
 * Message System Test Script
 * Run this in browser console to test message functionality
 */

async function testMessages() {
  console.log('🧪 Starting Message System Tests...\n');
  
  const { createClient } = await import('@supabase/supabase-js');
  
  // Get Supabase client from window or import
  const supabase = window.supabase || (await import('@/integrations/supabase/client')).default;
  
  if (!supabase) {
    console.error('❌ Supabase client not found');
    return;
  }
  
  // Test 1: Check legacy_messages table
  console.log('📋 Test 1: Legacy Messages Table');
  try {
    const { data: legacyData, error: legacyError } = await supabase
      .from('legacy_messages')
      .select('id, sender_id, receiver_id, content, sent_at')
      .limit(5);
    
    if (legacyError) {
      console.error('❌ Legacy messages error:', legacyError);
    } else {
      console.log('✅ Legacy messages accessible:', legacyData?.length || 0, 'messages found');
    }
  } catch (err) {
    console.error('❌ Legacy messages test failed:', err);
  }
  
  // Test 2: Check new messages table
  console.log('\n📋 Test 2: New Messages Table');
  try {
    const { data: newData, error: newError } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, sent_at')
      .limit(5);
    
    if (newError) {
      console.error('❌ New messages error:', newError);
    } else {
      console.log('✅ New messages accessible:', newData?.length || 0, 'messages found');
    }
  } catch (err) {
    console.error('❌ New messages test failed:', err);
  }
  
  // Test 3: Check conversations
  console.log('\n📋 Test 3: Conversations Table');
  try {
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .select('id, title, risk_tag')
      .limit(5);
    
    if (convError) {
      console.error('❌ Conversations error:', convError);
    } else {
      console.log('✅ Conversations accessible:', convData?.length || 0, 'conversations found');
    }
  } catch (err) {
    console.error('❌ Conversations test failed:', err);
  }
  
  // Test 4: Check conversation_participants
  console.log('\n📋 Test 4: Conversation Participants');
  try {
    const { data: partData, error: partError } = await supabase
      .from('conversation_participants')
      .select('id, conversation_id, user_id, role')
      .limit(5);
    
    if (partError) {
      console.error('❌ Participants error:', partError);
    } else {
      console.log('✅ Participants accessible:', partData?.length || 0, 'participants found');
    }
  } catch (err) {
    console.error('❌ Participants test failed:', err);
  }
  
  // Test 5: Check current user
  console.log('\n📋 Test 5: Current User');
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ User error:', userError);
    } else if (user) {
      console.log('✅ User authenticated:', user.id);
      console.log('   Email:', user.email);
    } else {
      console.log('⚠️  No user logged in');
    }
  } catch (err) {
    console.error('❌ User test failed:', err);
  }
  
  // Test 6: Test sending a message (if user is logged in)
  console.log('\n📋 Test 6: Send Message Test');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('⚠️  Skipping send test - no user logged in');
      return;
    }
    
    // Check if user has any conversations
    const { data: userConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    
    if (userConvs) {
      console.log('✅ User has conversations, can test sending');
      console.log('   Conversation ID:', userConvs.conversation_id);
    } else {
      console.log('⚠️  User has no conversations yet');
    }
  } catch (err) {
    console.error('❌ Send test failed:', err);
  }
  
  console.log('\n✅ Message System Tests Complete!');
}

// Run tests
testMessages();

