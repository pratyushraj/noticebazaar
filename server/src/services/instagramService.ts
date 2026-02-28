import axios from 'axios';

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

  for (const url of urls) {
    try {
      const res = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json',
          Referer: `https://www.instagram.com/${normalized}/`,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

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
      // Try the next endpoint
      if (process.env.NODE_ENV !== 'production') {
        console.log('[InstagramService] fetch failed:', normalized, url, err?.message || err);
      }
    }
  }

  // Fallback: parse public profile HTML when JSON endpoints are unavailable
  try {
    const pageUrl = `https://www.instagram.com/${normalized}/`;
    const page = await axios.get(pageUrl, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    const html = typeof page.data === 'string' ? page.data : '';
    if (!html) return null;

    const followersMatch =
      html.match(/"edge_followed_by"\s*:\s*\{"count"\s*:\s*(\d+)/) ||
      html.match(/"follower_count"\s*:\s*(\d+)/);

    const photoMatch =
      html.match(/"profile_pic_url_hd"\s*:\s*"([^"]+)"/) ||
      html.match(/"profile_pic_url"\s*:\s*"([^"]+)"/);

    const ogTitleMatch = html.match(/property="og:title"\s+content="([^"]+)"/i);
    const ogDescriptionMatch = html.match(/property="og:description"\s+content="([^"]+)"/i);
    const ogImageMatch = html.match(/property="og:image"\s+content="([^"]+)"/i);

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
