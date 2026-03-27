-- Enable Realtime for messages table
-- This allows real-time subscriptions to work for the messages table

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
