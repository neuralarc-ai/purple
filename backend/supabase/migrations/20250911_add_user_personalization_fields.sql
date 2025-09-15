BEGIN;

-- Create table if it doesn't exist (with new personalization fields included)
CREATE TABLE IF NOT EXISTS public.user_personalization (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vibe text NULL,
  world_snapshot text NULL,
  custom_touch text NULL,
  created_at timestamptz NULL DEFAULT now(),
  updated_at timestamptz NULL DEFAULT now(),
  personalities jsonb NULL DEFAULT '[]'::jsonb,

  -- New personalization fields
  preferred_name text NULL, -- what Helium should call you
  occupation text NULL,     -- what you do
  profile text NULL,        -- your profile/bio

  CONSTRAINT user_personalization_pkey PRIMARY KEY (id),
  CONSTRAINT user_personalization_user_id_key UNIQUE (user_id),
  CONSTRAINT user_personalization_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Ensure columns exist when the table already existed
ALTER TABLE public.user_personalization
  ADD COLUMN IF NOT EXISTS preferred_name text NULL,
  ADD COLUMN IF NOT EXISTS occupation text NULL,
  ADD COLUMN IF NOT EXISTS profile text NULL;

-- Length constraints (idempotent)
-- Existing checks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_personalization_custom_touch_check'
  ) THEN
    ALTER TABLE public.user_personalization
      ADD CONSTRAINT user_personalization_custom_touch_check CHECK (
        length(trim(both from custom_touch)) <= 300
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_personalization_vibe_check'
  ) THEN
    ALTER TABLE public.user_personalization
      ADD CONSTRAINT user_personalization_vibe_check CHECK (
        length(trim(both from vibe)) <= 200
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_personalization_world_snapshot_check'
  ) THEN
    ALTER TABLE public.user_personalization
      ADD CONSTRAINT user_personalization_world_snapshot_check CHECK (
        length(trim(both from world_snapshot)) <= 200
      );
  END IF;
END$$;

-- New field constraints (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_personalization_preferred_name_check'
  ) THEN
    ALTER TABLE public.user_personalization
      ADD CONSTRAINT user_personalization_preferred_name_check CHECK (
        preferred_name IS NULL OR length(trim(both from preferred_name)) <= 100
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_personalization_occupation_check'
  ) THEN
    ALTER TABLE public.user_personalization
      ADD CONSTRAINT user_personalization_occupation_check CHECK (
        occupation IS NULL OR length(trim(both from occupation)) <= 150
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_personalization_profile_check'
  ) THEN
    ALTER TABLE public.user_personalization
      ADD CONSTRAINT user_personalization_profile_check CHECK (
        profile IS NULL OR length(trim(both from profile)) <= 1000
      );
  END IF;
END$$;

-- Helpful column comments
COMMENT ON COLUMN public.user_personalization.preferred_name IS 'What Helium should call you (display/preferred name)';
COMMENT ON COLUMN public.user_personalization.occupation IS 'What you do (role/occupation)';
COMMENT ON COLUMN public.user_personalization.profile IS 'Your profile/bio';
COMMENT ON COLUMN public.user_personalization.vibe IS 'User traits/voice/tone (traits map here)';
COMMENT ON COLUMN public.user_personalization.custom_touch IS 'Custom instructions for Helium (instructions map here)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_personalization_user_id
  ON public.user_personalization USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_user_personalization_updated_at
  ON public.user_personalization USING btree (updated_at);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_personalization_updated_at ON public.user_personalization;
CREATE TRIGGER update_user_personalization_updated_at
  BEFORE UPDATE ON public.user_personalization
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;


