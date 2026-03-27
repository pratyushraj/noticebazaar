import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

interface LinkSocialAccountRequest {
  platform: "instagram" | "youtube" | "tiktok" | "twitter";
  auth_code: string;
  user_id: string;
  redirect_uri?: string;
}

interface SocialProfile {
  username: string;
  followers: number;
  profileUrl?: string;
  profilePictureUrl?: string;
  verified: boolean;
  accessToken: string;
  refreshToken?: string;
}

const RATE_LIMIT_MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function assertEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function enforceRateLimit(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  platform: string
) {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count, error } = await supabaseAdmin
    .from("social_account_link_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("platform", platform)
    .gte("created_at", windowStart);

  if (error) {
    throw new Error(`Failed to check link attempts: ${error.message}`);
  }

  if ((count ?? 0) >= RATE_LIMIT_MAX_ATTEMPTS) {
    throw new Error("Rate limit exceeded. Please try again in a few minutes.");
  }
}

async function logLinkAttempt(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  platform: string,
  success: boolean,
  errorMessage?: string
) {
  await supabaseAdmin.from("social_account_link_attempts").insert({
    user_id: userId,
    platform,
    success,
    error_message: errorMessage ?? null,
  });
}

async function exchangeInstagramCode(
  authCode: string,
  redirectUri: string
): Promise<SocialProfile> {
  const clientId = assertEnv("FACEBOOK_APP_ID");
  const clientSecret = assertEnv("FACEBOOK_APP_SECRET");

  const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code: authCode,
    }),
  });

  const tokenPayload = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(tokenPayload.error_message || "Failed to exchange Instagram auth code");
  }

  const accessToken: string = tokenPayload.access_token;

  // Fetch profile details using Graph API
  const profileResponse = await fetch(
    `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${accessToken}`
  );
  const profileData = await profileResponse.json();
  if (!profileResponse.ok) {
    throw new Error(profileData.error?.message || "Failed to fetch Instagram profile");
  }

  // Followers are not available via Basic Display; fallback to 0
  return {
    username: profileData.username,
    followers: profileData.followers_count ?? 0,
    profileUrl: `https://instagram.com/${profileData.username}`,
    profilePictureUrl: undefined,
    verified: profileData.account_type === "BUSINESS" || profileData.account_type === "CREATOR",
    accessToken,
  };
}

async function exchangeYouTubeCode(
  authCode: string,
  redirectUri: string
): Promise<SocialProfile> {
  const clientId = assertEnv("GOOGLE_CLIENT_ID");
  const clientSecret = assertEnv("GOOGLE_CLIENT_SECRET");

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: authCode,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const tokenPayload = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(tokenPayload.error_description || "Failed to exchange YouTube auth code");
  }

  const accessToken: string = tokenPayload.access_token;
  const refreshToken: string | undefined = tokenPayload.refresh_token ?? undefined;

  const channelResponse = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const channelData = await channelResponse.json();
  if (!channelResponse.ok) {
    throw new Error(channelData.error?.message || "Failed to fetch YouTube channel info");
  }

  const channel = channelData.items?.[0];
  if (!channel) {
    throw new Error("No YouTube channel found for the authenticated user");
  }

  return {
    username: channel.snippet?.title ?? "",
    followers: parseInt(channel.statistics?.subscriberCount ?? "0", 10) || 0,
    profileUrl: `https://www.youtube.com/channel/${channel.id}`,
    profilePictureUrl: channel.snippet?.thumbnails?.high?.url ?? channel.snippet?.thumbnails?.default?.url,
    verified: channel.statistics?.hiddenSubscriberCount === false,
    accessToken,
    refreshToken,
  };
}

async function exchangeTikTokCode(
  authCode: string,
  redirectUri: string
): Promise<SocialProfile> {
  const clientKey = assertEnv("TIKTOK_CLIENT_KEY");
  const clientSecret = assertEnv("TIKTOK_CLIENT_SECRET");

  const tokenResponse = await fetch("https://open-api.tiktok.com/oauth/access_token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_key: clientKey,
      client_secret: clientSecret,
      code: authCode,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const tokenPayload = await tokenResponse.json();
  if (!tokenResponse.ok || tokenPayload.data?.error_code) {
    throw new Error(tokenPayload.data?.description || "Failed to exchange TikTok auth code");
  }

  const accessToken: string = tokenPayload.data.access_token;
  const refreshToken: string | undefined = tokenPayload.data.refresh_token ?? undefined;

  const profileResponse = await fetch("https://open-api.tiktok.com/user/info/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      fields: ["open_id", "union_id", "avatar_url", "follower_count", "display_name", "is_verified"],
    }),
  });

  const profileData = await profileResponse.json();
  if (!profileResponse.ok || profileData.data?.error_code) {
    throw new Error(profileData.data?.description || "Failed to fetch TikTok profile");
  }

  const profile = profileData.data;
  return {
    username: profile.display_name ?? profile.union_id ?? profile.open_id,
    followers: profile.follower_count ?? 0,
    profileUrl: profile.union_id ? `https://www.tiktok.com/@${profile.union_id}` : undefined,
    profilePictureUrl: profile.avatar_url,
    verified: Boolean(profile.is_verified),
    accessToken,
    refreshToken,
  };
}

async function exchangeTwitterCode(
  authCode: string,
  redirectUri: string
): Promise<SocialProfile> {
  const clientId = assertEnv("TWITTER_CLIENT_ID");
  const clientSecret = assertEnv("TWITTER_CLIENT_SECRET");

  const basicAuth = btoa(`${clientId}:${clientSecret}`);

  const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      code: authCode,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      client_id: clientId,
    }),
  });

  const tokenPayload = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(tokenPayload.error_description || tokenPayload.error || "Failed to exchange Twitter auth code");
  }

  const accessToken: string = tokenPayload.access_token;
  const refreshToken: string | undefined = tokenPayload.refresh_token ?? undefined;

  const meResponse = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics,verified,username", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const meData = await meResponse.json();
  if (!meResponse.ok) {
    throw new Error(meData.error || "Failed to fetch Twitter profile");
  }

  const user = meData.data;
  if (!user) {
    throw new Error("No Twitter profile returned");
  }

  return {
    username: user.username,
    followers: user.public_metrics?.followers_count ?? 0,
    profileUrl: `https://twitter.com/${user.username}`,
    profilePictureUrl: user.profile_image_url,
    verified: Boolean(user.verified),
    accessToken,
    refreshToken,
  };
}

async function exchangeAuthCode(
  platform: "instagram" | "youtube" | "tiktok" | "twitter",
  authCode: string,
  redirectUri: string
): Promise<SocialProfile> {
  switch (platform) {
    case "instagram":
      return await exchangeInstagramCode(authCode, redirectUri);
    case "youtube":
      return await exchangeYouTubeCode(authCode, redirectUri);
    case "tiktok":
      return await exchangeTikTokCode(authCode, redirectUri);
    case "twitter":
      return await exchangeTwitterCode(authCode, redirectUri);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

function resolveRedirectUri(platform: string, override?: string): string {
  if (override) {
    return override;
  }
  switch (platform) {
    case "instagram":
      return assertEnv("INSTAGRAM_REDIRECT_URI");
    case "youtube":
      return assertEnv("GOOGLE_REDIRECT_URI");
    case "tiktok":
      return assertEnv("TIKTOK_REDIRECT_URI");
    case "twitter":
      return assertEnv("TWITTER_REDIRECT_URI");
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let requestBody: LinkSocialAccountRequest;
  try {
    requestBody = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { platform, auth_code: authCode, user_id: userId, redirect_uri: redirectOverride } = requestBody;
  if (!platform || !authCode || !userId) {
    return new Response(JSON.stringify({ error: "Missing platform, auth_code, or user_id" }), {
        status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!["instagram", "youtube", "tiktok", "twitter"].includes(platform)) {
    return new Response(JSON.stringify({ error: "Unsupported platform" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response(JSON.stringify({ error: "Server configuration error: Missing Supabase credentials" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const encryptionKey = Deno.env.get("SOCIAL_ACCOUNT_ENCRYPTION_KEY");
  if (!encryptionKey) {
    return new Response(JSON.stringify({ error: "Server configuration error: Missing SOCIAL_ACCOUNT_ENCRYPTION_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
  });

  try {
    // Verify that the user exists
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await enforceRateLimit(supabaseAdmin, userId, platform);

    const redirectUri = resolveRedirectUri(platform, redirectOverride);

    const socialProfile = await exchangeAuthCode(platform, authCode, redirectUri);

    const { data: storedAccount, error: storeError } = await supabaseAdmin.rpc("store_social_account", {
      p_user_id: userId,
      p_platform: platform,
      p_username: socialProfile.username,
      p_profile_url: socialProfile.profileUrl ?? null,
      p_profile_picture_url: socialProfile.profilePictureUrl ?? null,
      p_followers: socialProfile.followers,
      p_verified: socialProfile.verified,
      p_access_token: socialProfile.accessToken,
      p_refresh_token: socialProfile.refreshToken ?? null,
      p_encryption_key: encryptionKey,
    });

    if (storeError) {
      throw new Error(storeError.message);
    }

    await logLinkAttempt(supabaseAdmin, userId, platform, true, undefined);

    return new Response(
      JSON.stringify({
        success: true,
        platform,
        username: socialProfile.username,
        followers: socialProfile.followers,
        verified: socialProfile.verified,
        profile_url: socialProfile.profileUrl,
        profile_picture_url: socialProfile.profilePictureUrl,
        connected_at: storedAccount?.connected_at ?? new Date().toISOString(),
      }),
      {
      status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Link social account error", { platform, userId, message, error });

    try {
      await logLinkAttempt(supabaseAdmin, userId, platform, false, message);
    } catch (logError) {
      console.error("Failed to log link attempt", logError);
    }

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

