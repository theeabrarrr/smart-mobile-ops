-- Create invoice_status enum
CREATE TYPE invoice_status AS ENUM ('UNPAID', 'PAID', 'EXPIRED');

-- Create invoices table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL,
  plan text NOT NULL,
  amount numeric NOT NULL,
  status invoice_status NOT NULL DEFAULT 'UNPAID',
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  transaction_id text,
  payment_proof_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  verified_by uuid,
  verified_at timestamptz
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own unpaid invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = user_id AND status = 'UNPAID')
  WITH CHECK (auth.uid() = user_id AND status = 'UNPAID');

CREATE POLICY "Admins can view all invoices"
  ON public.invoices FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all invoices"
  ON public.invoices FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (true);

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num integer;
  invoice_num text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS integer)), 0) + 1
  INTO next_num
  FROM invoices;
  
  invoice_num := 'INV-' || LPAD(next_num::text, 4, '0');
  RETURN invoice_num;
END;
$$;

-- Function to handle invoice payment and subscription activation
CREATE OR REPLACE FUNCTION handle_invoice_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expiry_date timestamptz;
BEGIN
  -- Only process when status changes to PAID
  IF NEW.status = 'PAID' AND OLD.status != 'PAID' THEN
    -- Calculate expiry date (30 days from now)
    expiry_date := now() + interval '30 days';
    
    -- Update user's subscription tier
    UPDATE profiles
    SET 
      subscription_tier = NEW.plan::subscription_tier,
      subscription_expires_at = expiry_date,
      updated_at = now()
    WHERE user_id = NEW.user_id;
    
    -- Log the upgrade
    INSERT INTO subscription_logs (user_id, action, from_tier, to_tier, reason)
    SELECT 
      NEW.user_id,
      'upgraded',
      p.subscription_tier::text,
      NEW.plan,
      'Payment verified - Invoice ' || NEW.invoice_number
    FROM profiles p
    WHERE p.user_id = NEW.user_id;
    
    -- Set verified timestamp
    NEW.verified_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for invoice payment
CREATE TRIGGER on_invoice_paid
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION handle_invoice_payment();

-- Create updated_at trigger for invoices
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false);

-- Storage policies for payment proofs
CREATE POLICY "Users can upload their payment proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-proofs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their payment proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-proofs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all payment proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-proofs' 
    AND has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can delete their payment proofs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'payment-proofs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );