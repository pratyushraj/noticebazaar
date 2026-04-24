
export interface BioGenerationData {
  name: string;
  niches: string[];
  vibes: string[];
  city?: string;
  platform?: string;
}

export const generateAIBios = (data: BioGenerationData): string[] => {
  const { name, niches, vibes, city, platform = 'Instagram' } = data;
  
  const nicheStr = niches.length > 0 ? niches.slice(0, 2).join(' & ') : 'Content';
  const vibeStr = vibes.length > 0 ? vibes[0] : 'Creative';
  const locationStr = city ? ` based in ${city}` : '';

  return [
    // Variation 1: Professional & Brand-focused
    `${vibeStr} ${nicheStr} Creator${locationStr}. Specializing in high-engagement storytelling for modern brands. 🚀`,
    
    // Variation 2: Creative & Personality-focused
    `${name} | ${niches.slice(0, 2).join(' • ')} | Just a ${vibeStr.toLowerCase()} soul creating magic on ${platform}. ✨`,
    
    // Variation 3: Short & Punchy
    `${vibeStr} vibes. ${nicheStr} content. Let's build something iconic together. 📩`,
    
    // Variation 4: Growth-focused
    `Helping brands reach the right audience through ${vibeStr.toLowerCase()} ${nicheStr.toLowerCase()} content. ${locationStr}. 📈`
  ];
};
