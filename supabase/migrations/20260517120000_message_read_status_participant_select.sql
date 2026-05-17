-- Allow conversation participants to see when the other party read messages
-- (required for outgoing "Przeczytano" / green check for the sender)

DROP POLICY IF EXISTS "Users can view message read status" ON message_read_status;

CREATE POLICY "Participants can view read status in their conversations"
  ON message_read_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM messages m
      INNER JOIN conversations c ON c.id = m.conversation_id
      WHERE m.id = message_read_status.message_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );
