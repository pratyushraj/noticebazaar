-- Create the expenses table for tracking creator business expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    creator_id uuid NOT NULL,
    organization_id uuid,
    amount numeric NOT NULL CHECK (amount > 0),
    category text NOT NULL,
    description text,
    expense_date date NOT NULL DEFAULT CURRENT_DATE,
    receipt_file_url text,
    vendor_name text,
    payment_method text, -- 'cash', 'card', 'bank_transfer', 'upi', 'other'
    tags text[], -- Array of tags for categorization
    
    CONSTRAINT expenses_creator_id_fkey FOREIGN KEY (creator_id) 
        REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT expenses_organization_id_fkey FOREIGN KEY (organization_id) 
        REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_creator_id ON public.expenses(creator_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

-- Enable Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Creators can view their own expenses
CREATE POLICY "Creators can view their own expenses"
ON public.expenses FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

-- Policy: Creators can insert their own expenses
CREATE POLICY "Creators can insert their own expenses"
ON public.expenses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- Policy: Creators can update their own expenses
CREATE POLICY "Creators can update their own expenses"
ON public.expenses FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Policy: Creators can delete their own expenses
CREATE POLICY "Creators can delete their own expenses"
ON public.expenses FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_expenses_updated_at();

-- Add comments
COMMENT ON TABLE public.expenses IS 'Tracks business expenses for creators';
COMMENT ON COLUMN public.expenses.category IS 'Expense category: equipment, travel, software, marketing, office, other';
COMMENT ON COLUMN public.expenses.payment_method IS 'Method used to pay: cash, card, bank_transfer, upi, other';

