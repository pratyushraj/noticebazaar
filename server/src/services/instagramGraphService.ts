// @ts-nocheck
import crypto from 'crypto';

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v22.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const FB_DIALOG_BASE = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;

const REQUIRED_SCOPES = (process.env.META_SCOPES || 'instagram_business_basic')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function getOAuthAppConfig() {
  return {
    appId: process.env.META_APP_ID || '',
    appSecret: process.env.META_APP_SECRET || '',
    redirectUri: process.env.META_REDIRECT_URI || '',
    fbConfigId: process.env.META_FB_CONFIG_ID || '',
  };
}

function assertMetaEnv() {
  const cfg = getOAuthAppConfig();
  if (!cfg.appId || !cfg.appSecret || !cfg.redirectUri) {
    throw new Error('Missing META_APP_ID, META_APP_SECRET, or META_REDIRECT_URI');
  }
}

// Optional second app for future insights expansion.
// Current flow still uses page/user tokens from OAuth app.
export function getInstagramIntegrationMode() {
  const hasSeparateGraphApp = Boolean(process.env.IG_GRAPH_APP_ID && process.env.IG_GRAPH_APP_SECRET);
  return hasSeparateGraphApp ? 'split' : 'single';
}

function b64urlEncode(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function b64urlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = 4 - (base64.length % 4 || 4);
  return Buffer.from(base64 + '='.repeat(pad), 'base64').toString('utf8');
}

function signPayload(payload: string): string {
  return crypto
    .createHmac('sha256', process.env.META_APP_SECRET || 'creatorarmour')
    .update(payload)
    .digest('hex');
}

export function createInstagramOAuthState(params: { creatorId: string; returnTo?: string }): string {
  const payload = JSON.stringify({
    creatorId: params.creatorId,
    returnTo: params.returnTo || '',
    ts: Date.now(),
  });
  const encoded = b64urlEncode(payload);
  const sig = signPayload(encoded);
  return `${encoded}.${sig}`;
}

export function parseInstagramOAuthState(state: string): { creatorId: string; returnTo?: string } {
  const [encoded, sig] = (state || '').split('.');
  if (!encoded || !sig) {
    throw new Error('Invalid state');
  }
  const expectedSig = signPayload(encoded);
  if (expectedSig !== sig) {
    throw new Error('Invalid state signature');
  }

  const parsed = JSON.parse(b64urlDecode(encoded));
  const createdAt = Number(parsed.ts || 0);
  const maxAgeMs = 15 * 60 * 1000;
  if (!createdAt || Date.now() - createdAt > maxAgeMs) {
    throw new Error('State expired');
  }
  if (!parsed.creatorId) {
    throw new Error('State missing creator id');
  }

  return { creatorId: parsed.creatorId, returnTo: parsed.returnTo || '' };
}

export function getInstagramOAuthUrl(state: string): string {
  assertMetaEnv();
  const cfg = getOAuthAppConfig();
  const params = new URLSearchParams({
    client_id: cfg.appId,
    redirect_uri: cfg.redirectUri,
    response_type: 'code',
    state,
  });
  // Facebook Login for Business often requires a configuration id.
  // When configuration id is present, permissions are defined in the Meta config,
  // so we should not send `scope` to avoid invalid/legacy scope errors.
  if (cfg.fbConfigId) {
    params.set('config_id', cfg.fbConfigId);
  } else {
    params.set('scope', REQUIRED_SCOPES.join(','));
  }
  return `${FB_DIALOG_BASE}?${params.toString()}`;
}

async function graphGet(path: string, params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams(params);
  const url = `${GRAPH_BASE}${path}?${qs.toString()}`;
  const res = await fetch(url, { method: 'GET' });
  const text = await res.text();
  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok || json?.error) {
    throw new Error(`Graph GET failed (${res.status}): ${json?.error?.message || text}`);
  }
  return json;
}

export async function exchangeCodeForTokens(code: string): Promise<{ userAccessToken: string; userExpiresAt: string }> {
  assertMetaEnv();
  const cfg = getOAuthAppConfig();

  const first = await graphGet('/oauth/access_token', {
    client_id: cfg.appId,
    client_secret: cfg.appSecret,
    redirect_uri: cfg.redirectUri,
    code,
  });

  const shortToken = first.access_token;
  const longLived = await graphGet('/oauth/access_token', {
    grant_type: 'fb_exchange_token',
    client_id: cfg.appId,
    client_secret: cfg.appSecret,
    fb_exchange_token: shortToken,
  });

  const token = longLived.access_token || shortToken;
  const expiresIn = Number(longLived.expires_in || first.expires_in || 0);
  const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString();

  return {
    userAccessToken: token,
    userExpiresAt: expiresAt,
  };
}

export async function resolveInstagramBusinessAccount(userAccessToken: string): Promise<{
  pageId: string;
  pageAccessToken: string;
  igUserId: string;
  igUsername: string;
  profilePhoto: string | null;
  followersCount: number | null;
}> {
  const pages = await graphGet('/me/accounts', {
    access_token: userAccessToken,
    fields: 'id,name,access_token',
    limit: '20',
  });

  for (const page of pages?.data || []) {
    try {
      const pageData = await graphGet(`/${page.id}`, {
        access_token: page.access_token,
        fields: 'instagram_business_account{id,username,profile_picture_url,followers_count}',
      });
      const ig = pageData?.instagram_business_account;
      if (ig?.id && ig?.username) {
        return {
          pageId: page.id,
          pageAccessToken: page.access_token,
          igUserId: ig.id,
          igUsername: ig.username,
          profilePhoto: ig.profile_picture_url || null,
          followersCount: typeof ig.followers_count === 'number' ? ig.followers_count : null,
        };
      }
    } catch (e) {
      // Try next page.
    }
  }

  throw new Error('No Instagram business account connected to managed pages');
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  return Math.round(sorted[mid]);
}

async function fetchMediaInsights(mediaId: string, pageAccessToken: string): Promise<Record<string, number>> {
  const metrics = ['views', 'video_views', 'plays', 'reach', 'impressions', 'saved', 'shares', 'likes', 'comments'];
  const result: Record<string, number> = {};

  for (const metric of metrics) {
    try {
      const data = await graphGet(`/${mediaId}/insights`, {
        access_token: pageAccessToken,
        metric,
      });
      const value = data?.data?.[0]?.values?.[0]?.value;
      if (typeof value === 'number') result[metric] = value;
    } catch {
      // Metric unavailable for this media type.
    }
  }

  return result;
}

export async function fetchInstagramPerformanceSummary(igUserId: string, pageAccessToken: string, followersCount: number | null) {
  const mediaData = await graphGet(`/${igUserId}/media`, {
    access_token: pageAccessToken,
    fields: 'id,caption,media_type,media_product_type,timestamp,like_count,comments_count,permalink',
    limit: '20',
  });

  const media = Array.isArray(mediaData?.data) ? mediaData.data : [];
  const reels = media.filter((m: any) => (m.media_product_type || '').toUpperCase() === 'REELS' || (m.media_type || '').toUpperCase() === 'VIDEO');

  const rows: any[] = [];
  for (const m of reels.slice(0, 10)) {
    const insights = await fetchMediaInsights(m.id, pageAccessToken);
    const likes = Number(insights.likes ?? m.like_count ?? 0);
    const comments = Number(insights.comments ?? m.comments_count ?? 0);
    const saves = Number(insights.saved ?? 0);
    const shares = Number(insights.shares ?? 0);
    const views = Number(insights.views ?? insights.video_views ?? insights.plays ?? insights.impressions ?? 0);
    rows.push({ id: m.id, views, likes, comments, saves, shares, timestamp: m.timestamp });
  }

  const sampleSize = rows.length;
  const totalLikes = rows.reduce((sum, r) => sum + r.likes, 0);
  const totalComments = rows.reduce((sum, r) => sum + r.comments, 0);
  const totalSaves = rows.reduce((sum, r) => sum + r.saves, 0);
  const totalShares = rows.reduce((sum, r) => sum + r.shares, 0);

  const avgLikes = sampleSize > 0 ? totalLikes / sampleSize : 0;
  const avgComments = sampleSize > 0 ? totalComments / sampleSize : 0;
  const avgSaves = sampleSize > 0 ? totalSaves / sampleSize : 0;
  const avgShares = sampleSize > 0 ? totalShares / sampleSize : 0;
  const medianReelViews = median(rows.map((r) => r.views).filter((v) => Number.isFinite(v) && v > 0));
  const engagementRate = followersCount && followersCount > 0
    ? (avgLikes + avgComments + avgSaves + avgShares) / followersCount
    : null;

  return {
    sampleSize,
    medianReelViews,
    avgLikes: Math.round(avgLikes),
    avgComments: Math.round(avgComments),
    avgSaves: Math.round(avgSaves),
    avgShares: Math.round(avgShares),
    engagementRate,
    dataQuality: sampleSize >= 5 ? 'verified' : 'limited',
    media: rows,
  };
}
