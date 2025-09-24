-- Create enum for subscription tiers
CREATE TYPE public.subscription_tier AS ENUM ('basic', 'standard', 'premium');

-- Create enum for mobile condition
CREATE TYPE public.mobile_condition AS ENUM ('new', 'excellent', 'good', 'fair', 'poor');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'partial', 'cancelled');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  business_name TEXT,
  phone TEXT,
  address TEXT,
  subscription_tier subscription_tier NOT NULL DEFAULT 'basic',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mobiles table
CREATE TABLE public.mobiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  imei TEXT UNIQUE,
  condition mobile_condition NOT NULL DEFAULT 'good',
  purchase_price DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  is_sold BOOLEAN NOT NULL DEFAULT FALSE,
  supplier_name TEXT,
  purchase_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  mobile_id UUID NOT NULL REFERENCES public.mobiles(id) ON DELETE RESTRICT,
  sale_price DECIMAL(10,2) NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchases table
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mobile_id UUID NOT NULL REFERENCES public.mobiles(id) ON DELETE RESTRICT,
  supplier_name TEXT NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for customers
CREATE POLICY "Users can manage their own customers" ON public.customers
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for mobiles
CREATE POLICY "Users can manage their own mobiles" ON public.mobiles
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for sales
CREATE POLICY "Users can manage their own sales" ON public.sales
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for purchases
CREATE POLICY "Users can manage their own purchases" ON public.purchases
  FOR ALL USING (auth.uid() = user_id);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mobiles_updated_at
  BEFORE UPDATE ON public.mobiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_mobiles_user_id ON public.mobiles(user_id);
CREATE INDEX idx_sales_user_id ON public.sales(user_id);
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_mobiles_imei ON public.mobiles(imei);
CREATE INDEX idx_sales_date ON public.sales(sale_date);
CREATE INDEX idx_purchases_date ON public.purchases(purchase_date);