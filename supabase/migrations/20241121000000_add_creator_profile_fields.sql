-- Add creator profile fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS creator_category TEXT,
ADD COLUMN IF NOT EXISTS pricing_min INTEGER,
ADD COLUMN IF NOT EXISTS pricing_avg INTEGER,
ADD COLUMN IF NOT EXISTS pricing_max INTEGER,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
ADD COLUMN IF NOT EXISTS bank_upi TEXT,
ADD COLUMN IF NOT EXISTS gst_number TEXT,
ADD COLUMN IF NOT EXISTS pan_number TEXT,
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS instagram_followers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS youtube_subs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tiktok_followers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS twitter_followers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS facebook_followers INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN public.profiles.creator_category IS 'Creator category (Fashion, Tech, Fitness, etc.)';
COMMENT ON COLUMN public.profiles.pricing_min IS 'Minimum rate for brand deals';
COMMENT ON COLUMN public.profiles.pricing_avg IS 'Average rate for brand deals';
COMMENT ON COLUMN public.profiles.pricing_max IS 'Maximum rate for brand deals';
COMMENT ON COLUMN public.profiles.bank_account_name IS 'Bank account holder name';
COMMENT ON COLUMN public.profiles.bank_account_number IS 'Bank account number';
COMMENT ON COLUMN public.profiles.bank_ifsc IS 'Bank IFSC code';
COMMENT ON COLUMN public.profiles.bank_upi IS 'UPI ID';
COMMENT ON COLUMN public.profiles.gst_number IS 'GST Number';
COMMENT ON COLUMN public.profiles.pan_number IS 'PAN Number';
COMMENT ON COLUMN public.profiles.referral_code IS 'Unique referral code for the creator';
COMMENT ON COLUMN public.profiles.instagram_followers IS 'Instagram follower count';
COMMENT ON COLUMN public.profiles.youtube_subs IS 'YouTube subscriber count';
COMMENT ON COLUMN public.profiles.tiktok_followers IS 'TikTok follower count';
COMMENT ON COLUMN public.profiles.twitter_followers IS 'Twitter follower count';
COMMENT ON COLUMN public.profiles.facebook_followers IS 'Facebook follower count';

-- Create index for referral code lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;

-- Generate referral codes for existing creators without one
UPDATE public.profiles
SET referral_code = 'NB-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 6))
WHERE role = 'creator' AND referral_code IS NULL;

