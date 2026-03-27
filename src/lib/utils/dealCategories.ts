/**
 * Auto-categorize deals based on brand name and keywords
 */

export type DealCategory = 'Beauty' | 'Fashion' | 'Tech' | 'Food' | 'Fitness' | 'Travel' | 'Other';

interface CategoryConfig {
  keywords: string[];
  color: string;
  borderColor: string;
}

const categoryConfigs: Record<DealCategory, CategoryConfig> = {
  Beauty: {
    keywords: ['loreal', 'mamaearth', 'lakme', 'maybelline', 'nykaa', 'beauty', 'skincare', 'makeup'],
    color: 'bg-pink-500/20',
    borderColor: 'border-pink-500/30',
  },
  Fashion: {
    keywords: ['zara', 'h&m', 'levi', 'ajio', 'myntra', 'fashion', 'clothing', 'apparel'],
    color: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
  },
  Tech: {
    keywords: ['apple', 'samsung', 'boat', 'oneplus', 'tech', 'electronics', 'gadget'],
    color: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
  },
  Food: {
    keywords: ['swiggy', 'zomato', 'dominos', 'food', 'restaurant', 'delivery'],
    color: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
  },
  Fitness: {
    keywords: ['nike', 'adidas', 'puma', 'fitness', 'gym', 'sport', 'athletic'],
    color: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
  },
  Travel: {
    keywords: ['makemytrip', 'goibibo', 'travel', 'hotel', 'flight'],
    color: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30',
  },
  Other: {
    keywords: [],
    color: 'bg-gray-500/20',
    borderColor: 'border-gray-500/30',
  },
};

export const categorizeDeal = (brandName: string): DealCategory => {
  const lowerBrand = brandName.toLowerCase();
  
  for (const [category, config] of Object.entries(categoryConfigs)) {
    if (category === 'Other') continue;
    if (config.keywords.some(keyword => lowerBrand.includes(keyword))) {
      return category as DealCategory;
    }
  }
  
  return 'Other';
};

export const getCategoryStyle = (category: DealCategory) => {
  const config = categoryConfigs[category];
  return {
    className: `${config.color} ${config.borderColor}`,
    color: config.color,
    borderColor: config.borderColor,
  };
};

