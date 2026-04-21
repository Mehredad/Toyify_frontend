-- Phase 3: Database setup for Toyify
-- Idempotent migration: safe to run in existing projects.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Shared trigger helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Core domain tables
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  role TEXT DEFAULT 'parent'
);

CREATE TABLE IF NOT EXISTS public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT,
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  total_credits INTEGER DEFAULT 0,
  daily_generations_used INTEGER DEFAULT 0,
  last_generation_date DATE,
  last_free_generation_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.uploaded_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  original_drawing_url TEXT NOT NULL,
  digitized_image_url TEXT,
  original_story TEXT,
  upload_date TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.generated_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID REFERENCES public.uploaded_images(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  concept_3d_url TEXT NOT NULL,
  enhanced_story TEXT,
  generation_date TIMESTAMPTZ DEFAULT now(),
  used_credit BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  credits_purchased INTEGER NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  stripe_payment_id TEXT,
  purchase_date TIMESTAMPTZ DEFAULT now()
);

-- Existing orders table is present in this repo in older migrations.
-- Add missing columns from the Toyify schema if needed.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS concept_id UUID REFERENCES public.generated_concepts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS toy_type TEXT,
  ADD COLUMN IF NOT EXISTS allergy_notes TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address JSONB,
  ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_credits_updated_at'
  ) THEN
    CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON public.user_credits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at'
  ) THEN
    CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies where we manage names explicitly
DROP POLICY IF EXISTS "Users can view own uploads" ON public.uploaded_images;
DROP POLICY IF EXISTS "Users can insert own uploads" ON public.uploaded_images;
DROP POLICY IF EXISTS "Users can update own uploads" ON public.uploaded_images;
DROP POLICY IF EXISTS "Users can view own concepts" ON public.generated_concepts;
DROP POLICY IF EXISTS "Users can insert own concepts" ON public.generated_concepts;
DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can view own children" ON public.children;
DROP POLICY IF EXISTS "Users can insert own children" ON public.children;
DROP POLICY IF EXISTS "Users can update own children" ON public.children;
DROP POLICY IF EXISTS "Users can view own purchases" ON public.credit_purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON public.credit_purchases;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;

-- Users table policies
CREATE POLICY "Users can view own user row"
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert own user row"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own user row"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Children policies
CREATE POLICY "Users can view own children"
ON public.children FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = children.user_id AND u.id = auth.uid()
  )
);

CREATE POLICY "Users can insert own children"
ON public.children FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own children"
ON public.children FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Uploads policies
CREATE POLICY "Users can view own uploads"
ON public.uploaded_images FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads"
ON public.uploaded_images FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploads"
ON public.uploaded_images FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Concepts policies
CREATE POLICY "Users can view own concepts"
ON public.generated_concepts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own concepts"
ON public.generated_concepts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Credits policies
CREATE POLICY "Users can view own credits"
ON public.user_credits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
ON public.user_credits FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Purchases policies
CREATE POLICY "Users can view own purchases"
ON public.credit_purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
ON public.credit_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
ON public.orders FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('drawings', 'drawings', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public)
VALUES ('concept-images', 'concept-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Storage policies: drawings (private)
DROP POLICY IF EXISTS "Users can upload own drawings" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own drawings" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own drawings" ON storage.objects;

CREATE POLICY "Users can upload own drawings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'drawings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read own drawings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'drawings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own drawings"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'drawings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies: concept images (public read)
DROP POLICY IF EXISTS "Public can read concept images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own concept images" ON storage.objects;

CREATE POLICY "Public can read concept images"
ON storage.objects FOR SELECT
USING (bucket_id = 'concept-images');

CREATE POLICY "Users can upload own concept images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'concept-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Credit eligibility function
CREATE OR REPLACE FUNCTION public.check_generation_eligibility(p_user_id UUID)
RETURNS TABLE (
  can_generate BOOLEAN,
  remaining_free INTEGER,
  paid_credits INTEGER,
  next_free_at TIMESTAMPTZ,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits public.user_credits%ROWTYPE;
  v_today DATE := (now() AT TIME ZONE 'UTC')::date;
  v_is_new_day BOOLEAN := FALSE;
  v_next TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_credits
  FROM public.user_credits
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_credits (user_id, total_credits, daily_generations_used, last_generation_date)
    VALUES (p_user_id, 0, 0, v_today)
    RETURNING * INTO v_credits;
  END IF;

  v_is_new_day := v_credits.last_generation_date IS DISTINCT FROM v_today;

  IF v_is_new_day THEN
    v_credits.daily_generations_used := 0;
  END IF;

  IF COALESCE(v_credits.total_credits, 0) > 0 THEN
    RETURN QUERY SELECT
      TRUE,
      GREATEST(0, 2 - v_credits.daily_generations_used),
      v_credits.total_credits,
      NULL::TIMESTAMPTZ,
      format('You have %s paid credits remaining.', v_credits.total_credits);
    RETURN;
  END IF;

  IF v_credits.daily_generations_used < 2 THEN
    RETURN QUERY SELECT
      TRUE,
      2 - v_credits.daily_generations_used,
      0,
      NULL::TIMESTAMPTZ,
      format('You have %s free generations remaining today.', 2 - v_credits.daily_generations_used);
    RETURN;
  END IF;

  v_next := COALESCE(v_credits.last_free_generation_at, now()) + interval '24 hour';

  RETURN QUERY SELECT
    now() >= v_next,
    CASE WHEN now() >= v_next THEN 1 ELSE 0 END,
    0,
    v_next,
    CASE
      WHEN now() >= v_next THEN 'One free generation is now available.'
      ELSE 'Next free generation available in up to 24 hours.'
    END;
END;
$$;

-- Credit consumption function (called after successful generation)
CREATE OR REPLACE FUNCTION public.consume_generation_credit(p_user_id UUID)
RETURNS TABLE (
  used_paid_credit BOOLEAN,
  remaining_paid_credits INTEGER,
  daily_generations_used INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits public.user_credits%ROWTYPE;
  v_today DATE := (now() AT TIME ZONE 'UTC')::date;
BEGIN
  SELECT * INTO v_credits
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.user_credits (user_id, total_credits, daily_generations_used, last_generation_date, last_free_generation_at)
    VALUES (p_user_id, 0, 0, v_today, NULL)
    RETURNING * INTO v_credits;
  END IF;

  IF v_credits.last_generation_date IS DISTINCT FROM v_today THEN
    v_credits.daily_generations_used := 0;
  END IF;

  IF COALESCE(v_credits.total_credits, 0) > 0 THEN
    UPDATE public.user_credits
    SET
      total_credits = total_credits - 1,
      last_generation_date = v_today,
      updated_at = now()
    WHERE user_id = p_user_id
    RETURNING total_credits, daily_generations_used
    INTO remaining_paid_credits, daily_generations_used;

    used_paid_credit := TRUE;
    RETURN NEXT;
    RETURN;
  END IF;

  UPDATE public.user_credits
  SET
    daily_generations_used = CASE
      WHEN last_generation_date IS DISTINCT FROM v_today THEN 1
      ELSE daily_generations_used + 1
    END,
    last_generation_date = v_today,
    last_free_generation_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING total_credits, daily_generations_used
  INTO remaining_paid_credits, daily_generations_used;

  used_paid_credit := FALSE;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_generation_eligibility(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_generation_credit(UUID) TO authenticated;
