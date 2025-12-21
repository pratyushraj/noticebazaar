-- Check OTP verification status for token: a7b6c991-8159-4618-97fd-150d2ca81881
-- Run this in Supabase SQL Editor

SELECT 
    brt.id as token_id,
    brt.deal_id,
    brt.is_active,
    brt.expires_at,
    brt.revoked_at,
    bd.brand_name,
    bd.brand_response_status,
    bd.otp_verified,
    bd.otp_verified_at,
    bd.otp_hash IS NOT NULL as has_otp_hash,
    bd.otp_expires_at,
    bd.otp_attempts,
    bd.status as deal_status
FROM brand_reply_tokens brt
LEFT JOIN brand_deals bd ON brt.deal_id = bd.id
WHERE brt.id = 'a7b6c991-8159-4618-97fd-150d2ca81881';

