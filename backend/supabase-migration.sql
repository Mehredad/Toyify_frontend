-- Run this in your Supabase dashboard → SQL Editor
-- Creates the orders table and RLS policies for Toyify

CREATE TABLE IF NOT EXISTS public.orders (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_session_id TEXT        UNIQUE,
  customer_email    TEXT        NOT NULL,
  full_name         TEXT,
  phone_number      TEXT,
  address           JSONB       DEFAULT '{}',
  allergy_notes     TEXT,
  toy_name          TEXT,
  artist_name       TEXT,
  artist_age        TEXT,
  artist_gender     TEXT,
  artist_interests  TEXT[]      DEFAULT '{}',
  tier              TEXT        CHECK (tier IN ('diy', 'crafted')),
  price             NUMERIC(10, 2),
  concept_image_url TEXT,
  story_title       TEXT,
  status            TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'in_progress', 'shipped', 'delivered', 'cancelled')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep updated_at current automatically
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own orders
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (backend) can insert/update
CREATE POLICY "Service role can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update orders"
  ON public.orders FOR UPDATE
  USING (true);
