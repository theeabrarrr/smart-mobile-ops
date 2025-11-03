-- Add seller CNIC and seller phone fields to mobiles table for Standard tier
ALTER TABLE public.mobiles
ADD COLUMN seller_cnic text,
ADD COLUMN seller_phone text;

-- Add seller CNIC and seller phone fields to purchases table for Standard tier
ALTER TABLE public.purchases
ADD COLUMN seller_cnic text,
ADD COLUMN seller_phone text;