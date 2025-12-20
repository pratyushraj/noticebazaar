-- Enable Realtime for conversation_participants table
-- This allows real-time subscriptions to work for when lawyers are added to conversations

ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;

