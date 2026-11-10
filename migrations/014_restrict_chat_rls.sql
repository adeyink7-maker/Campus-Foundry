-- 1. Restrict chat_conversations
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Public can insert chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Public can update chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Public can delete chat_conversations" ON public.chat_conversations;

CREATE POLICY "Users can view their conversations" ON public.chat_conversations FOR SELECT USING (buyer_id = auth.uid() OR trader_id = auth.uid());
CREATE POLICY "Users can insert their conversations" ON public.chat_conversations FOR INSERT WITH CHECK (buyer_id = auth.uid() OR trader_id = auth.uid());
CREATE POLICY "Users can update their conversations" ON public.chat_conversations FOR UPDATE USING (buyer_id = auth.uid() OR trader_id = auth.uid());

-- 2. Restrict chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Public can insert chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Public can update chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Public can delete chat_messages" ON public.chat_messages;

CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM chat_conversations WHERE id = chat_messages.conversation_id AND (buyer_id = auth.uid() OR trader_id = auth.uid())));
CREATE POLICY "Users can insert messages in their conversations" ON public.chat_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM chat_conversations WHERE id = chat_messages.conversation_id AND (buyer_id = auth.uid() OR trader_id = auth.uid())));
