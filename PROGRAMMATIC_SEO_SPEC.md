# Programmatic SEO Spec: Influencer Rate Calculator

## 1. Directory Structure
```text
/src/pages/calculator/
  [platform]/
    [niche]/
      index.tsx
```

## 2. Dynamic Content Injection
- Each combination generates a page:
  - `creatorarmour.com/calculator/instagram/tech`
  - `creatorarmour.com/calculator/instagram/beauty`
  - `creatorarmour.com/calculator/youtube/gaming`

## 3. Calculation Engine Logic (JS Template)
```javascript
const getBaseRate = (niche, platform, followers) => {
  // Logic: Benchmark * PlatformMultiplier * NicheDemandFactor
  const benchmarks = { ... };
  const platformMultipliers = { instagram: 1, youtube: 2.5, tiktok: 1.2 };
  const nicheFactors = { tech: 1.5, beauty: 1.2, lifestyle: 1.0 };
  
  return benchmarks[followers] * platformMultipliers[platform] * nicheFactors[niche];
};
```

## 4. Metadata Strategy (Dynamic SEO)
- `<title>`: "Influencer Rate Calculator for ${niche} creators on ${platform}"
- `<meta name="description">`: "Get an accurate rate for ${niche} collaborations on ${platform}. Stop guessing your worth and start pricing like a pro with Creator Armour."
