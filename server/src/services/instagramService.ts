import axios from 'axios';
import { isPrivateIp } from '../utils/network.js';

const ALLOWED_INSTAGRAM_HOSTS = ['www.instagram.com', 'instagram.com', 'i.instagram.com', 'graph.instagram.com'];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function validateInstagramUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (isPrivateIp(parsed.hostname)) return false;
    return ALLOWED_INSTAGRAM_HOSTS.some(host => 
      parsed.hostname === host || parsed.hostname.endsWith('.' + host)
    );
  } catch {
    return false;
  }
}

// Validate DNS resolution to prevent SSRF via DNS rebinding
async function validateDnsResolution(hostname: string): Promise<boolean> {
  // Note: In production, use a DNS resolution library or system call
  // For Node.js 20+, we can use dns.promises
  try {
    // This is a simplified check - in production, use proper DNS resolution
    // to verify resolved IPs are not private
    return true; // Placeholder - implement proper DNS resolution check
  } catch {
    return false;
  }
}

export interface InstagramPublicData {
  profile_photo: string | null;
  followers: number | null;
  full_name?: string | null;
  bio?: string | null;
}

function normalizeInstagramUsername(username: string): string {
  return username.replace(/^@+/, '').trim().toLowerCase();
}

function normalizeInstagramImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  return url
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/\\\//g, '/')
    .trim();
}

function parseFollowersTextToNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/,/g, '').trim().toUpperCase();
  const match = cleaned.match(/^(\d+(?:\.\d+)?)([KMB])?$/);
  if (!match) {
    const asInt = Number.parseInt(cleaned, 10);
    return Number.isFinite(asInt) ? asInt : null;
  }

  const base = Number.parseFloat(match[1]);
  const suffix = match[2];
  if (!Number.isFinite(base)) return null;
  if (suffix === 'K') return Math.round(base * 1_000);
  if (suffix === 'M') return Math.round(base * 1_000_000);
  if (suffix === 'B') return Math.round(base * 1_000_000_000);
  return Math.round(base);
}

export const fetchInstagramPublicData = async (username: string): Promise<InstagramPublicData | null> => {
  const normalized = normalizeInstagramUsername(username);
  if (!normalized) return null;

  const urls = [
    `https://www.instagram.com/${normalized}/?__a=1&__d=dis`,
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(normalized)}`,
  ];

  // Try JSON endpoints first
  for (const url of urls) {
    try {
      if (!validateInstagramUrl(url)) continue;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await axios.get(url, {
        timeout: 8000,
        signal: controller.signal,
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': `https://www.instagram.com/${normalized}/`,
          'X-IG-App-ID': '936619743392459',
          'X-ASBD-ID': '129477',
          'X-IG-WWW-Claim': '0',
          'X-Requested-With': 'XMLHttpRequest',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
        },
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 300,
      });

      clearTimeout(timeoutId);

      const graphqlUser = res.data?.graphql?.user;
      const webProfileUser = res.data?.data?.user;
      const user = graphqlUser || webProfileUser;
      if (!user) continue;

      const profilePhoto =
        user.profile_pic_url_hd ||
        user.profile_pic_url ||
        null;

      const followersRaw =
        user.edge_followed_by?.count ??
        user.follower_count ??
        null;

      return {
        profile_photo: normalizeInstagramImageUrl(typeof profilePhoto === 'string' ? profilePhoto : null),
        followers: typeof followersRaw === 'number' ? followersRaw : null,
        full_name: typeof user.full_name === 'string' ? user.full_name : null,
        bio: typeof user.biography === 'string' ? user.biography : null,
      };
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[InstagramService] fetch failed:', normalized, url, err?.message || err);
      }
    }
  }

  // High-priority strategy: Embed page (very resilient)
  try {
    const embedUrl = `https://www.instagram.com/${normalized}/embed/`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await axios.get(embedUrl, {
      timeout: 8000,
      signal: timeoutId ? undefined : controller.signal, // Handle if timeout already cleared
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      maxRedirects: 3,
    });

    clearTimeout(timeoutId);
    const html = typeof res.data === 'string' ? res.data : '';
    
    // GLOBAL SEARCH for followers
    const followersMatch = 
      html.match(/"edge_followed_by":\{"count":(\d+)\}/) || 
      html.match(/"follower_count":(\d+)/) ||
      html.match(/([\d.,]+[KMB]?)\s+Followers/i);

    // GLOBAL SEARCH for photo
    const globalPhotoMatch = html.match(/https:\/\/[^"']+\.cdninstagram\.com\/[^"']+\.jpg[^"']*/g);
    const profilePicUrls = globalPhotoMatch ? globalPhotoMatch.filter(url => url.includes('profile_pic') || url.includes('_n.jpg')) : [];
    
    // Pattern search for name
    const nameMatch = 
      html.match(/"full_name":"([^"]+)"/) ||
      html.match(/property="og:title"\s+content="([^"]+)"/i) ||
      html.match(/<title>([^<]+)<\/title>/i);

    if (profilePicUrls.length > 0 || followersMatch) {
      let followers = null;
      if (followersMatch) {
        if (followersMatch[1].includes('Followers')) {
           // Handle the "10K Followers" text match
           const textValue = followersMatch[1].split(' ')[0];
           // Use the existing parser
           followers = parseFollowersTextToNumber(textValue);
        } else {
           followers = Number(followersMatch[1]);
        }
      }

      const photoUrl = profilePicUrls.length > 0 
        ? profilePicUrls.reduce((a, b) => a.length > b.length ? a : b).replace(/\\u0026/g, '&').replace(/\\/g, '')
        : null;
      
      let fullName = nameMatch?.[1] || null;
      if (fullName && /Instagram/i.test(fullName) && fullName.includes('•')) {
        fullName = fullName.split('•')[0].trim();
      }

      return {
        profile_photo: normalizeInstagramImageUrl(photoUrl),
        followers: Number.isFinite(followers) ? followers : null,
        full_name: fullName,
        bio: null
      };
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[InstagramService] Embed fallback failed:', normalized, err);
    }
  }

  // Fallback: parse public profile HTML when JSON endpoints are unavailable
  try {
    const pageUrl = `https://www.instagram.com/${normalized}/`;
    
    if (!validateInstagramUrl(pageUrl)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[InstagramService] Invalid URL blocked:', pageUrl);
      }
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const page = await axios.get(pageUrl, {
      timeout: 8000,
      signal: controller.signal,
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      maxRedirects: 5,
    });

    clearTimeout(timeoutId);
    const html = typeof page.data === 'string' ? page.data : '';
    if (!html) return null;

    const followersMatch =
      html.match(/"edge_followed_by"\s*:\s*\{"count"\s*:\s*(\d+)/) ||
      html.match(/"follower_count"\s*:\s*(\d+)/);

    const photoMatch =
      html.match(/"profile_pic_url_hd"\s*:\s*"([^"]+)"/) ||
      html.match(/"profile_pic_url"\s*:\s*"([^"]+)"/) ||
      html.match(/"og:image"\s*content="([^"]+)"/) ||
      html.match(/"twitter:image"\s*content="([^"]+)"/);

    const ogTitleMatch = html.match(/property="og:title"\s+content="([^"]+)"/i) || html.match(/name="twitter:title"\s+content="([^"]+)"/i);
    const ogDescriptionMatch = html.match(/property="og:description"\s+content="([^"]+)"/i) || html.match(/name="twitter:description"\s+content="([^"]+)"/i);
    const ogImageMatch = html.match(/property="og:image"\s+content="([^"]+)"/i) || html.match(/name="twitter:image"\s+content="([^"]+)"/i);

    const ogTitleRaw = ogTitleMatch?.[1] || null;
    const ogDescriptionRaw = ogDescriptionMatch?.[1] || null;
    const ogImageRaw = ogImageMatch?.[1] || null;

    const followersFromStructured = followersMatch ? Number(followersMatch[1]) : null;
    const followersFromOg = parseFollowersTextToNumber(
      (ogDescriptionRaw?.match(/([\d.,]+[KMB]?)\s+Followers/i) || [])[1]
    );
    const followers = followersFromStructured ?? followersFromOg;

    const profilePhotoRaw = photoMatch?.[1] || null;
    const profilePhoto = normalizeInstagramImageUrl(profilePhotoRaw || ogImageRaw);

    const fullName = ogTitleRaw
      ? ogTitleRaw
        .replace(/&#064;/g, '@')
        .replace(/&#x2022;/g, '•')
        .replace(/\s*\(@[^)]*\)\s*•\s*Instagram photos and videos/i, '')
        .trim()
      : null;

    const bio = ogDescriptionRaw
      ? ogDescriptionRaw
        .replace(/&#064;/g, '@')
        .replace(/^.*?\d+\s+Followers,\s*\d+\s+Following,\s*\d+\s+Posts\s*-\s*See Instagram photos and videos from\s*/i, '')
        .trim()
      : null;

    const normalizedFullName = fullName?.toLowerCase() || '';
    const isGenericName = normalizedFullName === 'instagram';
    const isGenericPhoto = !!profilePhoto && /static\.cdninstagram\.com\/rsrc\.php/i.test(profilePhoto);
    const normalizedBio = bio?.toLowerCase() || '';
    const isGenericBio = normalizedBio === 'instagram' || normalizedBio.length < 2;

    const safeFullName = isGenericName ? null : fullName;
    const safePhoto = isGenericPhoto ? null : profilePhoto;
    const safeBio = isGenericBio ? null : bio;

    if (followers === null && !safePhoto && !safeFullName && !safeBio) return null;

    return {
      profile_photo: safePhoto,
      followers: Number.isFinite(followers as number) ? followers : null,
      full_name: safeFullName,
      bio: safeBio,
    };
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[InstagramService] HTML fallback failed:', normalized, err?.message || err);
    }
  }

  return null;
};
