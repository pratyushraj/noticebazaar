export type CarouselTemplateType =
  | 'MYTH_VS_FACT'
  | 'TREATMENT_EXPLAINED'
  | 'COST_BREAKDOWN'
  | 'BEFORE_AFTER_STORY'
  | 'MISTAKES_PEOPLE_MAKE';

export type SlideLayoutType =
  | 'HOOK'
  | 'MYTH_VS_FACT'
  | 'PROBLEM'
  | 'EDUCATION'
  | 'ANALOGY'
  | 'TIMELINE'
  | 'BENEFITS'
  | 'CTA';

export interface CarouselSlide {
  id: number;
  layout: SlideLayoutType;
  headline?: string;
  subheadline?: string;
  bodyText?: string;
  imagePrompt?: string;
  imageUrl?: string;
  points?: string[];
  myth?: string;
  fact?: string;
  tagline?: string;
  timelineSteps?: string[];
}

export interface CarouselCampaign {
  id: string;
  template: CarouselTemplateType;
  topic: string;
  industry: string;
  style: string;
  slides: CarouselSlide[];
  cta: {
    headline: string;
    buttonText: string;
    localAddress?: string;
  };
}

// Preset 1: Myth vs Fact
export const MOCK_SCALING_MYTH_CAROUSEL: CarouselCampaign = {
  id: "carousel_scaling_myth_1",
  template: "MYTH_VS_FACT",
  topic: "Does Scaling Loosen Teeth?",
  industry: "Dental",
  style: "Premium Dark & Mint",
  slides: [
    {
      id: 1,
      layout: "HOOK",
      headline: '"My teeth felt loose after scaling..."',
      subheadline: "Here's why that's actually a GOOD sign. 😳",
      imageUrl: "/brain/6f13a783-0fb3-478d-ab84-aa85311d14f9/dental_carousel_slide_1_1780652363025.png"
    },
    {
      id: 2,
      layout: "MYTH_VS_FACT",
      myth: "Scaling scrapes enamel and makes healthy teeth shake.",
      fact: "Scaling only washes away hard bacteria layers (tartar) that your brush cannot clean."
    },
    {
      id: 3,
      layout: "PROBLEM",
      headline: "Why do they feel 'loose' then?",
      bodyText: "When rock-hard layers of tartar (cemented plaque) choke your gums for years, they act like a hard, artificial bridge. Once this dirty buildup is washed away, your tongue finally feels the empty spaces."
    },
    {
      id: 4,
      layout: "ANALOGY",
      headline: "Think of tartar like mud on a brick wall... 🧱",
      bodyText: "If mud ckes a brick wall for years, it holds it together superficially while rotting the mortar underneath. Removing the mud doesn't damage the bricks—it exposes the actual condition so you can repair it."
    },
    {
      id: 5,
      layout: "TIMELINE",
      headline: "The Cost of Waiting",
      timelineSteps: [
        "Plaque: Soft biofilm (reversible)",
        "Tartar: Hard calcified block (un-brushable)",
        "Receding Gums: Tartar pushes gums down",
        "Permanent Mobility: Jawbone is destroyed"
      ]
    },
    {
      id: 6,
      layout: "BENEFITS",
      headline: "The Clinical Benefits of Professional Scaling",
      points: [
        "Instantly Stops Bleeding Gums",
        "Cures Chronic Bad Breath",
        "Restores Your Natural Shade",
        "Prevents Expensive Jawbone Surgeries"
      ]
    },
    {
      id: 7,
      layout: "EDUCATION",
      headline: "Preventive Care, Not Cosmetic",
      bodyText: "At Parmar Dental Care (Patliputra Colony, Patna), most of our patients are surprised to learn their bleeding gums improve dramatically after just one comfortable scaling session. Recommended every 6-12 months."
    },
    {
      id: 8,
      layout: "CTA",
      headline: "Want to know if your gums are healthy?",
      bodyText: "Comment \"CLEAN\" below, and we'll instantly send you our free Gum Health Checklist in your DMs.",
      tagline: "📍 Parmar Dental Care, Patliputra Colony, Patna",
      buttonText: "Comment CLEAN"
    }
  ],
  cta: {
    headline: "Want to know if your gums are healthy?",
    buttonText: "Comment CLEAN",
    localAddress: "Patliputra Colony, Patna"
  }
};

// Preset 2: Treatment Explained
export const MOCK_TREATMENT_EXPLAINED: CarouselCampaign = {
  id: "carousel_treatment_explained",
  template: "TREATMENT_EXPLAINED",
  topic: "Wisdom Tooth Surgery",
  industry: "Dental",
  style: "Clinical Royal Blue",
  slides: [
    {
      id: 1,
      layout: "HOOK",
      headline: "What actually happens during a wisdom tooth removal? 🦷",
      subheadline: "Let's map out the pain-free surgical process step-by-step."
    },
    {
      id: 2,
      layout: "PROBLEM",
      headline: "The Impacted Tooth Problem",
      bodyText: "Wisdom teeth often grow sideways or stay trapped beneath the gum line. This causes constant pressure, swelling, jaw pain, and damages adjacent healthy teeth."
    },
    {
      id: 3,
      layout: "TIMELINE",
      headline: "The 30-Minute Surgical Step",
      timelineSteps: [
        "Local Anesthetic: Numbs the entire section completely",
        "Surgical Access: Gently opening the gum layer if trapped",
        "Ultrasonic Split: Segmenting the tooth for a smooth lift",
        "Bio-Stitches: Standard closure to enable fast healing"
      ]
    },
    {
      id: 4,
      layout: "ANALOGY",
      headline: "Think of it like clearing a traffic jam... 🚗",
      bodyText: "If one car is parked sideways blockading the main lane, you can't push it forward—you have to break the lock or lift it out. Removing the wisdom tooth removes the blockade and restores your natural bite."
    },
    {
      id: 5,
      layout: "BENEFITS",
      headline: "Post-Removal Relief",
      points: [
        "Permanently ends jaw joint stiffness",
        "Protects adjacent molars from decay",
        "Stops persistent gum infections",
        "Perfect excuse for cold ice cream post-care!"
      ]
    },
    {
      id: 6,
      layout: "CTA",
      headline: "Dealing with wisdom tooth pain?",
      bodyText: "Comment \"SURGERY\" below, and our team at Parmar Dental Care will DM you a painless consultation slot.",
      tagline: "📍 Patliputra Colony, Patna",
      buttonText: "Comment SURGERY"
    }
  ],
  cta: {
    headline: "Dealing with wisdom tooth pain?",
    buttonText: "Comment SURGERY",
    localAddress: "Patliputra Colony, Patna"
  }
};

// Preset 3: Cost Breakdown
export const MOCK_COST_BREAKDOWN: CarouselCampaign = {
  id: "carousel_cost_breakdown",
  template: "COST_BREAKDOWN",
  topic: "Root Canal Cost Breakdown",
  industry: "Dental",
  style: "Deep Purple Luxury",
  slides: [
    {
      id: 1,
      layout: "HOOK",
      headline: "Why root canal treatment costs vary from ₹3000 to ₹12000 💰",
      subheadline: "Here is what you are actually paying for."
    },
    {
      id: 2,
      layout: "PROBLEM",
      headline: "The Hidden Cost of Skipping a Root Canal",
      bodyText: "An infected tooth nerve doesn't heal itself. If left untreated, the infection reaches your jawbone. Extracting the tooth and placing an implant later costs up to ₹35,000+."
    },
    {
      id: 3,
      layout: "TIMELINE",
      headline: "What Determines the Price?",
      timelineSteps: [
        "Front vs Back Teeth: Back teeth have up to 4 canals",
        "Manual vs Rotary: Advanced digital motor files are safer",
        "Single Sitting RCT: Requires advanced laser disinfection",
        "Restoration Cap: Metal, zirconia, or cosmetic CAD/CAM crown"
      ]
    },
    {
      id: 4,
      layout: "BENEFITS",
      headline: "Which option is worth your money?",
      points: [
        "Basic RCT (₹3,000): Standard relief, standard files",
        "Microscopic RCT (₹6,000): Ultimate precision, zero relapse",
        "Zirconia Cap (₹8,000+): Premium metal-free natural match",
        "Laser Disinfection: 99.9% success rate"
      ]
    },
    {
      id: 5,
      layout: "CTA",
      headline: "Save your tooth before it's too late.",
      bodyText: "Comment \"RCT\" below, and we'll send you our diagnostic tooth-pain guide and price estimator.",
      tagline: "📍 Patliputra Colony, Patna",
      buttonText: "Comment RCT"
    }
  ],
  cta: {
    headline: "Save your tooth before it's too late.",
    buttonText: "Comment RCT",
    localAddress: "Patliputra Colony, Patna"
  }
};

// Preset 4: Before & After Story
export const MOCK_BEFORE_AFTER_STORY: CarouselCampaign = {
  id: "carousel_before_after_story",
  template: "BEFORE_AFTER_STORY",
  topic: "Wedding Smile Makeover",
  industry: "Dental",
  style: "Rose gold warm",
  slides: [
    {
      id: 1,
      layout: "HOOK",
      headline: "Getting a smile makeover in just 7 days before the wedding! 👰✨",
      subheadline: "Real transformation journey from hiding to shining."
    },
    {
      id: 2,
      layout: "PROBLEM",
      headline: "The Insecurity",
      bodyText: "Our patient was conscious about slightly chipped front teeth and spacing. She avoided smiling in pre-wedding photo shoots. Standard braces were ruled out due to time."
    },
    {
      id: 3,
      layout: "TIMELINE",
      headline: "The 7-Day Transformation",
      timelineSteps: [
        "Day 1: 3D Digital Smile Design Scan",
        "Day 3: Pain-free laser teeth whitening session",
        "Day 5: Trial fitting of custom E-Max veneers",
        "Day 7: Permanent bonding of natural porcelain veneers"
      ]
    },
    {
      id: 4,
      layout: "BENEFITS",
      headline: "The Results",
      points: [
        "100% metal-free, natural-looking porcelain",
        "Perfect shade alignment for photography flash",
        "Bite function fully protected",
        "Confidence boost of a lifetime!"
      ]
    },
    {
      id: 5,
      layout: "CTA",
      headline: "Planning a smile upgrade for a special event?",
      bodyText: "Comment \"SMILE\" and we'll send you our Wedding Smile Guide and voucher.",
      tagline: "📍 Parmar Dental Care, Patna",
      buttonText: "Comment SMILE"
    }
  ],
  cta: {
    headline: "Planning a smile upgrade for a special event?",
    buttonText: "Comment SMILE",
    localAddress: "Patliputra Colony, Patna"
  }
};

// Preset 5: Mistakes People Make
export const MOCK_MISTAKES_PEOPLE_MAKE: CarouselCampaign = {
  id: "carousel_mistakes_people_make",
  template: "MISTAKES_PEOPLE_MAKE",
  topic: "Brushing Mistakes",
  industry: "Dental",
  style: "Monochrome Minimal",
  slides: [
    {
      id: 1,
      layout: "HOOK",
      headline: "3 brushing mistakes you're making every single morning... 🪥",
      subheadline: "Number 2 is ruining your tooth enamel right now."
    },
    {
      id: 2,
      layout: "TIMELINE",
      headline: "What you are doing wrong:",
      timelineSteps: [
        "Mistake 1: Brushing side-to-side dynamically (wears gums)",
        "Mistake 2: Rinsing with water right after brushing (washes fluoride)",
        "Mistake 3: Using a hard bristle brush (recedes gums)",
        "Mistake 4: Brushing right after eating citrus foods (corrodes enamel)"
      ]
    },
    {
      id: 3,
      layout: "ANALOGY",
      headline: "Think of fluoride like varnish on wood... 🪵",
      bodyText: "If you paint protective varnish on a table and immediately throw a bucket of water on it, it washes away. When you rinse with water after brushing, you wash away the active protective fluoride coat!"
    },
    {
      id: 4,
      layout: "BENEFITS",
      headline: "The Correct Routine",
      points: [
        "Spit, don't rinse with water after brushing!",
        "Use circular vertical strokes, not horizontal",
        "Switch to an ultra-soft bristle brush",
        "Brush for a full 2 minutes, twice a day"
      ]
    },
    {
      id: 5,
      layout: "CTA",
      headline: "Want to fix your family's oral hygiene?",
      bodyText: "Comment \"BRUSH\" and we'll send you our free morning hygiene checklist card.",
      tagline: "📍 Parmar Dental Care, Patna",
      buttonText: "Comment BRUSH"
    }
  ],
  cta: {
    headline: "Want to fix your family's oral hygiene?",
    buttonText: "Comment BRUSH",
    localAddress: "Patliputra Colony, Patna"
  }
};
