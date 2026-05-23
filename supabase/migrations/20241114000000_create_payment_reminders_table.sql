-- Create the payment_reminders table
CREATE TABLE public.payment_reminders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid REFERENCES public.brand_deals(id) ON DELETE CASCADE NOT NULL,
    creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_email text NOT NULL,
    status text NOT NULL DEFAULT 'sent', -- "sent" | "failed"
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    delivery_method text NOT NULL DEFAULT 'email', -- "email" | "whatsapp"
    error_message text,
    
    CONSTRAINT payment_reminders_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.brand_deals(id) ON DELETE CASCADE,
    CONSTRAINT payment_reminders_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS for payment_reminders
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

-- Policy: Creators can see their own reminders
CREATE POLICY "Creators can view their own payment reminders"
ON public.payment_reminders FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

-- Policy: Creators can insert their own reminders (via Edge Function)
CREATE POLICY "Creators can insert their own payment reminders"
ON public.payment_reminders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);