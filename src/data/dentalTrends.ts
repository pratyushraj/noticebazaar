export type TrendCategory =
  | "Myths"
  | "Transformations"
  | "Doctor Reacts"
  | "Patient Stories"
  | "Costs"
  | "Pain/Fear"
  | "Hygiene";

export type TrendDifficulty = "Easy" | "Medium" | "Hard";

export type TrendFormat =
  | "Talking Head"
  | "Voiceover"
  | "Before/After"
  | "Patient Testimonial";

export interface TrendIdea {
  id: string;
  topic: string;
  category: TrendCategory;
  hook: string;
  views: number;
  difficulty: TrendDifficulty;
  shootTime: string;
  format: TrendFormat;
  generatedAppointments?: number;
  source: string;
  engagementScore: number;
  whyItWorked: string[];
  sourceCreator: string;
  lastSeen: string;
  industry: string;
}

export interface TopicCluster {
  id: TrendCategory;
  name: string;
  avgViews: number;
  avgEngagement: number;
  topHooks: string[];
  color: string;
  icon: string;
  description: string;
}

export const DENTAL_TOPIC_CLUSTERS: TopicCluster[] = [
  {
    id: "Myths",
    name: "Dental Myths Buster",
    avgViews: 620000,
    avgEngagement: 8.4,
    topHooks: [
      "Does scaling actually loosen teeth?",
      "Stop using charcoal toothpaste — a dentist explains why",
      "Mouthwash is RUINING your teeth (here's why)",
    ],
    color: "#ef4444",
    icon: "🧐",
    description: "Debunking common misconceptions. Fear + disbelief drives high saving and sharing rates.",
  },
  {
    id: "Transformations",
    name: "Smile Transformations",
    avgViews: 510000,
    avgEngagement: 7.1,
    topHooks: [
      "From hiding her smile to this...",
      "What 6 months of clear aligners actually looks like",
      "We rebuilt this smile in just 2 sittings!",
    ],
    color: "#10b981",
    icon: "✨",
    description: "Visual before-and-after proof. Very high aspiration factor, generating direct booking intent.",
  },
  {
    id: "Doctor Reacts",
    name: "Doctor Reacts",
    avgViews: 480000,
    avgEngagement: 9.8,
    topHooks: [
      "Dentist reacts to DIY whitening hacks",
      "Please NEVER do this to your teeth...",
      "Is this viral TikTok trend actually safe?",
    ],
    color: "#f59e0b",
    icon: "😂",
    description: "Reacting to popular internet hacks/memes. Highly entertaining, generates comment sections.",
  },
  {
    id: "Hygiene",
    name: "Oral Hygiene Mistakes",
    avgViews: 390000,
    avgEngagement: 6.2,
    topHooks: [
      "3 mistakes you're making every time you brush",
      "Stop rinsing your mouth after brushing!",
      "If your gums bleed when flossing, watch this",
    ],
    color: "#06b6d4",
    icon: "🪥",
    description: "Correction of daily habits. Highly actionable, leading to high save counts.",
  },
  {
    id: "Costs",
    name: "Cost & Price Transparency",
    avgViews: 350000,
    avgEngagement: 5.9,
    topHooks: [
      "How much does a dental implant actually cost in India?",
      "Dental treatments worth paying for vs. ones you can skip",
      "Why root canal costs vary so much",
    ],
    color: "#8b5cf6",
    icon: "💰",
    description: "Breaking down treatments, costs, and value. Directly targets high-intent leads and DMs.",
  },
  {
    id: "Pain/Fear",
    name: "Pain & Dental Fear",
    avgViews: 310000,
    avgEngagement: 8.7,
    topHooks: [
      "Does a root canal actually hurt? (Let's be honest)",
      "How we treat patients who are terrified of dentists",
      "Read this if you're avoiding the dentist out of fear",
    ],
    color: "#ec4899",
    icon: "😱",
    description: "Addressing dental anxiety directly. Empathetic approach that builds trust and patient comfort.",
  },
  {
    id: "Patient Stories",
    name: "Patient Testimonials",
    avgViews: 280000,
    avgEngagement: 11.2,
    topHooks: [
      "Why Rahul traveled 500km for his smile design",
      "She hasn't smiled in 5 years, until today...",
      "What our patients say when the anesthesia wears off",
    ],
    color: "#3b82f6",
    icon: "🎬",
    description: "Real stories and emotional journeys of patients. Establishes ultimate credibility and local trust.",
  },
];

export const TRENDING_THIS_MONTH = [
  { rank: 1, topic: "Does Scaling Loosen Teeth?", views: "1.2M+", trend: "up" },
  { rank: 2, topic: "Teeth Whitening Mistakes", views: "850K+", trend: "up" },
  { rank: 3, topic: "Root Canal vs Extraction", views: "720K+", trend: "stable" },
  { rank: 4, topic: "Dental Implant Cost", views: "640K+", trend: "stable" },
  { rank: 5, topic: "Bad Breath Causes", views: "550K+", trend: "up" },
];

export const VIRAL_REEL_DATABASE: TrendIdea[] = [
  {
    id: "r001",
    topic: "Does scaling loosen teeth?",
    category: "Myths",
    hook: "Does scaling loosen teeth? Here's what dentists don't tell you",
    views: 890000,
    difficulty: "Easy",
    shootTime: "10 mins",
    format: "Talking Head",
    generatedAppointments: 18,
    source: "Dr. Rohan's Dental Hub",
    engagementScore: 9.2,
    whyItWorked: [
      "🧠 Common misconception about scaling",
      "⚠️ Fear-based hook capturing attention",
      "💬 High comment volume debating teeth stability"
    ],
    sourceCreator: "Dr. Rohan's Dental Hub",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r002",
    topic: "Charcoal Toothpaste Warning",
    category: "Myths",
    hook: "Stop using charcoal toothpaste — it is destroying your enamel",
    views: 670000,
    difficulty: "Easy",
    shootTime: "15 mins",
    format: "Talking Head",
    generatedAppointments: 7,
    source: "Mumbai Smile Clinic",
    engagementScore: 8.5,
    whyItWorked: [
      "🧠 Debunks popular beauty aesthetic trend",
      "⚠️ Urgency hook warning of enamel destruction",
      "⚡ Visual side-by-side sandpaper explanation"
    ],
    sourceCreator: "Mumbai Smile Clinic",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r003",
    topic: "DIY Tooth Whitening Reacts",
    category: "Doctor Reacts",
    hook: "Dentist reacts to viral lemon juice teeth whitening hack",
    views: 1250000,
    difficulty: "Medium",
    shootTime: "20 mins",
    format: "Talking Head",
    generatedAppointments: 14,
    source: "Dr. Nidhi's Dental Care",
    engagementScore: 10.4,
    whyItWorked: [
      "😂 Humorous reaction format matching TikTok trends",
      "🧠 Science-backed explanation of citric acid danger",
      "💬 High debate and share rate"
    ],
    sourceCreator: "Dr. Nidhi's Dental Care",
    lastSeen: "April 2026",
    industry: "dental"
  },
  {
    id: "r004",
    topic: "Aligners Journey",
    category: "Transformations",
    hook: "What 6 months of metal-free aligners did to her teeth",
    views: 920000,
    difficulty: "Hard",
    shootTime: "45 mins",
    format: "Before/After",
    generatedAppointments: 32,
    source: "Smile Designers Delhi",
    engagementScore: 9.7,
    whyItWorked: [
      "✨ Aspirational before/after shift sequence",
      "🧠 Solves brace-related visual fear",
      "💬 Generates high 'Inquire for cost' comments"
    ],
    sourceCreator: "Smile Designers Delhi",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r005",
    topic: "Brushing Mistakes",
    category: "Hygiene",
    hook: "3 brushing mistakes you're making every single morning",
    views: 780000,
    difficulty: "Easy",
    shootTime: "10 mins",
    format: "Voiceover",
    generatedAppointments: 9,
    source: "Healthy Smiles India",
    engagementScore: 7.9,
    whyItWorked: [
      "🧠 Points out everyday habit errors",
      "⚡ Easy-to-replicate visual guide",
      "🪥 Practical advice drives high bookmark/save rates"
    ],
    sourceCreator: "Healthy Smiles India",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r006",
    topic: "Root Canal Cost Breakdown",
    category: "Costs",
    hook: "Why root canal treatment costs from ₹3000 to ₹12000",
    views: 450000,
    difficulty: "Easy",
    shootTime: "15 mins",
    format: "Talking Head",
    generatedAppointments: 22,
    source: "Dr. Kunal Orthodontics",
    engagementScore: 8.1,
    whyItWorked: [
      "💰 Absolute cost transparency build trust",
      "🧠 Clarifies tech differences (manual vs rotary)",
      "💬 Generates direct consultation inquiries"
    ],
    sourceCreator: "Dr. Kunal Orthodontics",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r007",
    topic: "Root Canal Pain Honest Talk",
    category: "Pain/Fear",
    hook: "Does a Root Canal actually hurt? (Let's be completely honest)",
    views: 520000,
    difficulty: "Medium",
    shootTime: "15 mins",
    format: "Talking Head",
    generatedAppointments: 19,
    source: "Aesthetic Dental Care",
    engagementScore: 8.9,
    whyItWorked: [
      "🧠 Addresses primary patient anxiety head-on",
      "⚡ Explains modern painless local anesthetic",
      "💬 Sympathetic tone builds local clinic trust"
    ],
    sourceCreator: "Aesthetic Dental Care",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r008",
    topic: "Fearful Patient Story",
    category: "Patient Stories",
    hook: "She was so terrified of dentists, she didn't visit for 10 years...",
    views: 310000,
    difficulty: "Medium",
    shootTime: "30 mins",
    format: "Patient Testimonial",
    generatedAppointments: 15,
    source: "Dr. Pooja's Dental Clinic",
    engagementScore: 11.5,
    whyItWorked: [
      "🎬 Strong narrative-driven emotional hook",
      "🧠 Focuses on empathetic sedation solutions",
      "✨ High social proof values"
    ],
    sourceCreator: "Dr. Pooja's Dental Clinic",
    lastSeen: "April 2026",
    industry: "dental"
  },
  {
    id: "r009",
    topic: "Mouthwash Side Effects",
    category: "Myths",
    hook: "Why using mouthwash right after brushing is actually bad",
    views: 940000,
    difficulty: "Easy",
    shootTime: "10 mins",
    format: "Talking Head",
    generatedAppointments: 5,
    source: "Tooth Studio Pune",
    engagementScore: 9.1,
    whyItWorked: [
      "🧠 Counters standard commercial mouthwash tips",
      "⚡ Mind-blowing chemical interaction breakdown",
      "💬 Saves/shares fueled by surprise factor"
    ],
    sourceCreator: "Tooth Studio Pune",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r010",
    topic: "Rinsing After Brushing",
    category: "Hygiene",
    hook: "Stop spitting and rinsing! Here's the correct way to brush",
    views: 1100000,
    difficulty: "Easy",
    shootTime: "10 mins",
    format: "Voiceover",
    generatedAppointments: 12,
    source: "Elite Dentistry Bangalore",
    engagementScore: 9.5,
    whyItWorked: [
      "🧠 Exposes wrong standard morning ritual",
      "🪥 Explains leaving fluoride protection layer",
      "⚡ Visual demonstration of correct process"
    ],
    sourceCreator: "Elite Dentistry Bangalore",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r011",
    topic: "Full Mouth Reconstruction",
    category: "Transformations",
    hook: "Full smile restoration for our 65-year-old grandfather",
    views: 410000,
    difficulty: "Hard",
    shootTime: "60 mins",
    format: "Before/After",
    generatedAppointments: 27,
    source: "Advance Dental & Implant Centre",
    engagementScore: 7.8,
    whyItWorked: [
      "✨ Emotional elder transformation dynamic",
      "🧠 Showcases advanced implant mapping capability",
      "💬 Strong validation from families booking for parents"
    ],
    sourceCreator: "Advance Dental & Implant Centre",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r012",
    topic: "Wisdom Tooth Surgery",
    category: "Pain/Fear",
    hook: "What actually happens during a wisdom tooth removal?",
    views: 630000,
    difficulty: "Medium",
    shootTime: "25 mins",
    format: "Voiceover",
    generatedAppointments: 16,
    source: "Maxilla Dental Care",
    engagementScore: 8.6,
    whyItWorked: [
      "🧠 Visual process map reduces mystery fear",
      "⚠️ Focuses on post-care reward (ice cream)",
      "💬 Extremely relatable to young adults"
    ],
    sourceCreator: "Maxilla Dental Care",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r013",
    topic: "DIY Aligner Dangers",
    category: "Doctor Reacts",
    hook: "Dentist reacts to DIY aligners ordered online",
    views: 820000,
    difficulty: "Medium",
    shootTime: "20 mins",
    format: "Talking Head",
    generatedAppointments: 11,
    source: "Perfect Smile Jaipur",
    engagementScore: 9.3,
    whyItWorked: [
      "🧠 Warns about unsupervised teeth shifting",
      "😂 Sarcastic react to online brace advertising",
      "⚡ Drives clinical orthondotic checkup bookings"
    ],
    sourceCreator: "Perfect Smile Jaipur",
    lastSeen: "March 2026",
    industry: "dental"
  },
  {
    id: "r014",
    topic: "Implant Cost vs Bridges",
    category: "Costs",
    hook: "Dental Implant vs. Dental Bridge: Which is worth your money?",
    views: 380000,
    difficulty: "Easy",
    shootTime: "15 mins",
    format: "Talking Head",
    generatedAppointments: 24,
    source: "Apex Implants India",
    engagementScore: 7.2,
    whyItWorked: [
      "💰 Shows 10-year cost efficiency of implants",
      "🧠 Explains bridge grinding damage to adjacent teeth",
      "⚡ High conversion rate for older patients"
    ],
    sourceCreator: "Apex Implants India",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r015",
    topic: "Wedding Smile Makeover",
    category: "Transformations",
    hook: "Getting a smile makeover in 7 days before the wedding!",
    views: 890000,
    difficulty: "Hard",
    shootTime: "50 mins",
    format: "Before/After",
    generatedAppointments: 39,
    source: "The Dental Lounge",
    engagementScore: 9.1,
    whyItWorked: [
      "✨ Aspirational timeline for brides-to-be",
      "🧠 Fast results with minimal veneers/whitening",
      "💬 Urgency triggers direct DM inquiries"
    ],
    sourceCreator: "The Dental Lounge",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r016",
    topic: "Why Gums Bleed",
    category: "Hygiene",
    hook: "If your gums bleed when brushing, do NOT stop brushing!",
    views: 540000,
    difficulty: "Easy",
    shootTime: "10 mins",
    format: "Talking Head",
    generatedAppointments: 18,
    source: "Dr. Shruti's Dental Art",
    engagementScore: 8.0,
    whyItWorked: [
      "🧠 Dispels fear of brushing tender bleeding areas",
      "⚡ Logical explanation of plaque-induced gingivitis",
      "🪥 Encourages correct light circular flossing"
    ],
    sourceCreator: "Dr. Shruti's Dental Art",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r017",
    topic: "Yellow Teeth Myth",
    category: "Myths",
    hook: "Naturally yellow teeth are actually stronger than bright white?",
    views: 1350000,
    difficulty: "Easy",
    shootTime: "12 mins",
    format: "Talking Head",
    generatedAppointments: 8,
    source: "Clove Dental Inspired",
    engagementScore: 11.2,
    whyItWorked: [
      "🧠 Shocking anatomical fact about dentin thickness",
      "⚡ Comforts patients insecure about natural shade",
      "💬 Generates massive debate in comment section"
    ],
    sourceCreator: "Clove Dental Inspired",
    lastSeen: "April 2026",
    industry: "dental"
  },
  {
    id: "r018",
    topic: "Teeth Whitening Cost",
    category: "Costs",
    hook: "Clinic Whitening vs. At-Home Whitening: True Cost Breakdown",
    views: 290000,
    difficulty: "Easy",
    shootTime: "15 mins",
    format: "Talking Head",
    generatedAppointments: 15,
    source: "Dentistry & Beyond",
    engagementScore: 6.9,
    whyItWorked: [
      "💰 Exposes cheap strip kits eroding enamel",
      "🧠 Defends clinical bleaching safety & duration",
      "⚡ Captures brides/groom prospects"
    ],
    sourceCreator: "Dentistry & Beyond",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r019",
    topic: "Dentist reacts to DIY Braces",
    category: "Doctor Reacts",
    hook: "I cannot believe someone tried DIY braces at home...",
    views: 950000,
    difficulty: "Medium",
    shootTime: "20 mins",
    format: "Talking Head",
    generatedAppointments: 6,
    source: "Modern Dental Clinic",
    engagementScore: 9.9,
    whyItWorked: [
      "🧠 Warns against dangerous rubber-band setups",
      "😂 Genuine shock and professional horror react",
      "💬 Explains roots choking under gum pressure"
    ],
    sourceCreator: "Modern Dental Clinic",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r020",
    topic: "Aligners Pain Level",
    category: "Pain/Fear",
    hook: "Does wearing clear aligners hurt? Honest comparison to braces",
    views: 470000,
    difficulty: "Easy",
    shootTime: "15 mins",
    format: "Talking Head",
    generatedAppointments: 21,
    source: "Aligner Experts India",
    engagementScore: 8.4,
    whyItWorked: [
      "🧠 Truthful discomfort rating index",
      "⚠️ Normalizes initial pressure days",
      "💬 Attracts high-intent aligner prospects"
    ],
    sourceCreator: "Aligner Experts India",
    lastSeen: "April 2026",
    industry: "dental"
  },
  {
    id: "r021",
    topic: "Grandmother Implant Story",
    category: "Patient Stories",
    hook: "We restored our grandmother's ability to eat her favorite food",
    views: 430000,
    difficulty: "Medium",
    shootTime: "35 mins",
    format: "Patient Testimonial",
    generatedAppointments: 25,
    source: "Care Dental Clinic",
    engagementScore: 10.8,
    whyItWorked: [
      "🎬 Warm family emotion connection",
      "🧠 Practical explanation of chewing bite load",
      "💬 Direct booking from caring children"
    ],
    sourceCreator: "Care Dental Clinic",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r022",
    topic: "Flossing Wrong",
    category: "Hygiene",
    hook: "You are flossing wrong! (And it is hurting your gums)",
    views: 610000,
    difficulty: "Easy",
    shootTime: "10 mins",
    format: "Voiceover",
    generatedAppointments: 10,
    source: "Smile Studio Patna",
    engagementScore: 7.5,
    whyItWorked: [
      "🧠 Visual guide correcting gum bleeding triggers",
      "⚡ Demonstration of C-wrap technique",
      "🪥 High bookmark count for evening routines"
    ],
    sourceCreator: "Smile Studio Patna",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r023",
    topic: "Fluoride Danger Myth",
    category: "Myths",
    hook: "Is fluoride toothpaste actually toxic? Let's check the science",
    views: 520000,
    difficulty: "Medium",
    shootTime: "20 mins",
    format: "Talking Head",
    generatedAppointments: 4,
    source: "Dr. Vikas's Preventive Care",
    engagementScore: 8.2,
    whyItWorked: [
      "🧠 Rebuts health influencer fear mongering",
      "⚡ Scientific toxicity comparison stats",
      "💬 Sparks logical hygiene discussion"
    ],
    sourceCreator: "Dr. Vikas's Preventive Care",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r024",
    topic: "Veneers Before/After",
    category: "Transformations",
    hook: "Veneers transformation: 10 teeth restored in 3 sittings",
    views: 710000,
    difficulty: "Hard",
    shootTime: "40 mins",
    format: "Before/After",
    generatedAppointments: 28,
    source: "Veneer Artistry Delhi",
    engagementScore: 8.7,
    whyItWorked: [
      "✨ Visual aesthetic transformation loop",
      "🧠 Focuses on custom digital shade mapping",
      "💬 Attracts high-value cosmetic requests"
    ],
    sourceCreator: "Veneer Artistry Delhi",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r025",
    topic: "Scaling is not whitening",
    category: "Myths",
    hook: "Why teeth cleaning (scaling) won't make your yellow teeth white",
    views: 880000,
    difficulty: "Easy",
    shootTime: "12 mins",
    format: "Talking Head",
    generatedAppointments: 16,
    source: "Radiant Smiles Pune",
    engagementScore: 9.0,
    whyItWorked: [
      "🧠 Clarifies difference between plaque and dentin shade",
      "⚡ Prevents post-scaling complaints",
      "💰 Sells actual clinic whitening treatments"
    ],
    sourceCreator: "Radiant Smiles Pune",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r026",
    topic: "Invisalign Cost Breakdown",
    category: "Costs",
    hook: "The hidden costs of Invisalign you should know beforehand",
    views: 310000,
    difficulty: "Easy",
    shootTime: "15 mins",
    format: "Talking Head",
    generatedAppointments: 19,
    source: "Orthodontic Centre India",
    engagementScore: 7.0,
    whyItWorked: [
      "💰 Complete cost honesty creates premium leads",
      "🧠 Details refinement alignments & retainers",
      "💬 Connects with Series-A / high income patients"
    ],
    sourceCreator: "Orthodontic Centre India",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r027",
    topic: "Dentist reacts to Teeth Filing",
    category: "Doctor Reacts",
    hook: "Filing down your own teeth with a nail file?! Reacting to TikTok",
    views: 1850000,
    difficulty: "Easy",
    shootTime: "15 mins",
    format: "Talking Head",
    generatedAppointments: 9,
    source: "Dr. Neha's Dental World",
    engagementScore: 12.1,
    whyItWorked: [
      "🧠 Warns on irreversibility of enamel filing",
      "😂 High comedy and react expression appeal",
      "💬 Generates massive shares from worried parents"
    ],
    sourceCreator: "Dr. Neha's Dental World",
    lastSeen: "April 2026",
    industry: "dental"
  },
  {
    id: "r028",
    topic: "Root Canal Avoidance",
    category: "Pain/Fear",
    hook: "What happens if you ignore a recommended Root Canal?",
    views: 680000,
    difficulty: "Easy",
    shootTime: "15 mins",
    format: "Talking Head",
    generatedAppointments: 34,
    source: "Healthy Tooth Care",
    engagementScore: 9.4,
    whyItWorked: [
      "⚠️ Educates on bone infection spreads",
      "🧠 Urgency trigger regarding irreversible pain",
      "💬 Direct booking conversion mechanism"
    ],
    sourceCreator: "Healthy Tooth Care",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r029",
    topic: "Kid's First Dental Visit",
    category: "Patient Stories",
    hook: "How we made this 5-year-old's first cavity filling fun!",
    views: 260000,
    difficulty: "Medium",
    shootTime: "30 mins",
    format: "Patient Testimonial",
    generatedAppointments: 17,
    source: "Junior Smiles Pediatric",
    engagementScore: 10.2,
    whyItWorked: [
      "🎬 Warm cute child reaction dynamic",
      "🧠 Comforts parents who fear child dental fights",
      "💬 Direct booking from mothers"
    ],
    sourceCreator: "Junior Smiles Pediatric",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r030",
    topic: "Electric vs Manual Brush",
    category: "Hygiene",
    hook: "Electric vs Manual Toothbrush: Dentist's honest recommendation",
    views: 490000,
    difficulty: "Easy",
    shootTime: "15 mins",
    format: "Talking Head",
    generatedAppointments: 12,
    source: "Smile Innovations",
    engagementScore: 7.7,
    whyItWorked: [
      "🧠 Objective comparison breakdown of motor cycles",
      "🪥 Focuses on protection of gum margin line",
      "⚡ Relatable to tech-loving crowd"
    ],
    sourceCreator: "Smile Innovations",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r031",
    topic: "Teeth grinding at night",
    category: "Hygiene",
    hook: "Waking up with a headache or jaw pain? Here is why",
    views: 620000,
    difficulty: "Easy",
    shootTime: "10 mins",
    format: "Voiceover",
    generatedAppointments: 22,
    source: "Dr. Abhishek's Aesthetics",
    engagementScore: 8.3,
    whyItWorked: [
      "🧠 Explains bruxism headache correlations",
      "⚡ Shows night guard protection visual",
      "💬 Leads to night guard custom molds bookings"
    ],
    sourceCreator: "Dr. Abhishek's Aesthetics",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r032",
    topic: "Aligners for adults",
    category: "Transformations",
    hook: "Am I too old to get braces or aligners at age 35?",
    views: 580000,
    difficulty: "Easy",
    shootTime: "15 mins",
    format: "Talking Head",
    generatedAppointments: 31,
    source: "Perfect Aligners Chennai",
    engagementScore: 8.6,
    whyItWorked: [
      "🧠 Comforts adult patients self-conscious of brackets",
      "✨ Showcases invisible clear tray aesthetic",
      "💬 Converts mature corporate clientele"
    ],
    sourceCreator: "Perfect Aligners Chennai",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r033",
    topic: "Bad breath test",
    category: "Hygiene",
    hook: "Do you have bad breath? Use this 5-second spoon test",
    views: 2100000,
    difficulty: "Easy",
    shootTime: "10 mins",
    format: "Voiceover",
    generatedAppointments: 15,
    source: "Dr. Pooja's Dental Clinic",
    engagementScore: 14.2,
    whyItWorked: [
      "⚡ Simple self-test prompts massive curiosity",
      "🧠 High shock factor concerning tongue bio-film",
      "💬 Explodes with saves/shares metrics"
    ],
    sourceCreator: "Dr. Pooja's Dental Clinic",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r034",
    topic: "Wisdom Tooth Myth",
    category: "Myths",
    hook: "Does everyone need their wisdom teeth removed?",
    views: 740000,
    difficulty: "Easy",
    shootTime: "12 mins",
    format: "Talking Head",
    generatedAppointments: 11,
    source: "Maxilla Dental Care",
    engagementScore: 8.8,
    whyItWorked: [
      "🧠 Clarifies necessity of tooth extraction",
      "⚠️ Relieves extraction paranoia",
      "⚡ Simple diagnostic x-ray display visual"
    ],
    sourceCreator: "Maxilla Dental Care",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r035",
    topic: "Wisdom Tooth Cost",
    category: "Costs",
    hook: "Wisdom tooth removal cost: Simple extraction vs. surgical",
    views: 280000,
    difficulty: "Easy",
    shootTime: "12 mins",
    format: "Talking Head",
    generatedAppointments: 14,
    source: "Tooth Studio Pune",
    engagementScore: 6.8,
    whyItWorked: [
      "💰 Shows price factors based on tooth impaction",
      "🧠 Prevents sticker shock for surgery patients",
      "💬 Excellent informational baseline"
    ],
    sourceCreator: "Tooth Studio Pune",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r036",
    topic: "Dentist reacts to DIY grills",
    category: "Doctor Reacts",
    hook: "Dentist reacts to gluing rhinestones on teeth at home",
    views: 1150000,
    difficulty: "Medium",
    shootTime: "20 mins",
    format: "Talking Head",
    generatedAppointments: 5,
    source: "Elite Dentistry Bangalore",
    engagementScore: 10.1,
    whyItWorked: [
      "🧠 Warns on industrial toxic glue dangers",
      "😂 High fashion trends reaction format",
      "⚡ Sells clinic safe gems procedures"
    ],
    sourceCreator: "Elite Dentistry Bangalore",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r037",
    topic: "Dental Anesthesia Fear",
    category: "Pain/Fear",
    hook: "Terrified of dental needles? Here is how we make it painless",
    views: 390000,
    difficulty: "Easy",
    shootTime: "15 mins",
    format: "Voiceover",
    generatedAppointments: 26,
    source: "Apex Implants India",
    engagementScore: 9.0,
    whyItWorked: [
      "🧠 Demonstrates dental numbing gel prefix",
      "⚠️ Focuses on visual comfort elements",
      "💬 Highly successful in converting phobic patients"
    ],
    sourceCreator: "Apex Implants India",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r038",
    topic: "Gap closure story",
    category: "Patient Stories",
    hook: "Closing his front tooth gap changed his confidence forever",
    views: 550000,
    difficulty: "Medium",
    shootTime: "30 mins",
    format: "Patient Testimonial",
    generatedAppointments: 30,
    source: "Smile Studio Patna",
    engagementScore: 11.1,
    whyItWorked: [
      "🎬 Strong emotional confidence narrative",
      "✨ Quick gap shift visual result",
      "💬 Encourages Patna locals to DM"
    ],
    sourceCreator: "Smile Studio Patna",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r039",
    topic: "Tongue Scraping",
    category: "Hygiene",
    hook: "Why brushing your tongue isn't enough to stop bad breath",
    views: 890000,
    difficulty: "Easy",
    shootTime: "10 mins",
    format: "Voiceover",
    generatedAppointments: 8,
    source: "Dr. Nidhi's Dental Care",
    engagementScore: 8.9,
    whyItWorked: [
      "🧠 Explains bacteria trapping structure of tongue papillae",
      "🪥 Promotes copper scrapers benefit",
      "⚡ ASMR scraping visual drives high retention"
    ],
    sourceCreator: "Dr. Nidhi's Dental Care",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r040",
    topic: "Pregnancy Dental Myths",
    category: "Myths",
    hook: "Is it safe to get dental treatment during pregnancy?",
    views: 430000,
    difficulty: "Medium",
    shootTime: "18 mins",
    format: "Talking Head",
    generatedAppointments: 13,
    source: "Mumbai Smile Clinic",
    engagementScore: 8.2,
    whyItWorked: [
      "🧠 Reassures expecting mothers on second trimester safety",
      "⚡ Clears confusion on dental x-rays during pregnancy",
      "💬 Highly shared in family chats"
    ],
    sourceCreator: "Mumbai Smile Clinic",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r041",
    topic: "Smile Design Process",
    category: "Transformations",
    hook: "The complete step-by-step process of digital smile design",
    views: 610000,
    difficulty: "Hard",
    shootTime: "55 mins",
    format: "Before/After",
    generatedAppointments: 21,
    source: "Veneer Artistry Delhi",
    engagementScore: 8.1,
    whyItWorked: [
      "✨ Inside look at clinic CAD/CAM tech",
      "🧠 High custom fit satisfaction visual",
      "💬 Pre-filters premium cosmetic target"
    ],
    sourceCreator: "Veneer Artistry Delhi",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r042",
    topic: "Veneers vs Crowns cost",
    category: "Costs",
    hook: "Veneers vs. Dental Crowns: The cost and performance difference",
    views: 340000,
    difficulty: "Easy",
    shootTime: "15 mins",
    format: "Talking Head",
    generatedAppointments: 17,
    source: "Dr. Shruti's Dental Art",
    engagementScore: 7.1,
    whyItWorked: [
      "💰 Detailed tooth shaving comparison",
      "🧠 Clinically advises veneers for front aesthetics only",
      "⚡ Direct conversion logic"
    ],
    sourceCreator: "Dr. Shruti's Dental Art",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r043",
    topic: "Dentist reacts to purple shampoo",
    category: "Doctor Reacts",
    hook: "Does purple tooth corrector actually whiten teeth instantly?",
    views: 1450000,
    difficulty: "Easy",
    shootTime: "15 mins",
    format: "Talking Head",
    generatedAppointments: 18,
    source: "Healthy Smiles India",
    engagementScore: 11.8,
    whyItWorked: [
      "🧠 Unveils truth on optical temporary stains",
      "😂 Popular aesthetic trend react format",
      "💬 Massive save & share numbers"
    ],
    sourceCreator: "Healthy Smiles India",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r044",
    topic: "Root Canal vs Extraction",
    category: "Costs",
    hook: "Saving your natural tooth vs. pulling it: The real costs",
    views: 410000,
    difficulty: "Easy",
    shootTime: "15 mins",
    format: "Talking Head",
    generatedAppointments: 29,
    source: "Dr. Rohan's Dental Hub",
    engagementScore: 8.4,
    whyItWorked: [
      "💰 Details future cost of replacement implants if pulled",
      "🧠 Protects natural tooth retention value",
      "💬 Generates massive booking consult volume"
    ],
    sourceCreator: "Dr. Rohan's Dental Hub",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r045",
    topic: "Gummy smile correction",
    category: "Transformations",
    hook: "How we fixed this gummy smile without surgery in 20 minutes",
    views: 690000,
    difficulty: "Medium",
    shootTime: "30 mins",
    format: "Before/After",
    generatedAppointments: 23,
    source: "Smile Designers Delhi",
    engagementScore: 9.2,
    whyItWorked: [
      "✨ Laser soft-tissue contouring visual",
      "🧠 Immediate side-by-side healed smile",
      "💬 Converts young aesthetic seekers"
    ],
    sourceCreator: "Smile Designers Delhi",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r046",
    topic: "Sensitivity triggers",
    category: "Hygiene",
    hook: "Teeth hurt when drinking cold water? Stop doing this...",
    views: 820000,
    difficulty: "Easy",
    shootTime: "10 mins",
    format: "Talking Head",
    generatedAppointments: 20,
    source: "Tooth Studio Pune",
    engagementScore: 8.7,
    whyItWorked: [
      "🧠 Explains enamel wear exposing dentin tubules",
      "🪥 Advises soft brushes & sensitivity paste",
      "💬 Saves driven by common cold trigger symptoms"
    ],
    sourceCreator: "Tooth Studio Pune",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r047",
    topic: "Hard vs Soft toothbrush",
    category: "Hygiene",
    hook: "Why hard toothbrushes should be banned (dentist explains)",
    views: 710000,
    difficulty: "Easy",
    shootTime: "12 mins",
    format: "Talking Head",
    generatedAppointments: 6,
    source: "Modern Dental Clinic",
    engagementScore: 8.1,
    whyItWorked: [
      "🧠 Visual demonstration of scrub wear on gum lining",
      "🪥 Shows wear on yellow root exposures",
      "💬 Highly shared warning to family"
    ],
    sourceCreator: "Modern Dental Clinic",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r048",
    topic: "Teeth whitening truth",
    category: "Myths",
    hook: "Why teeth whitening toothpaste is mostly a scam",
    views: 1150000,
    difficulty: "Easy",
    shootTime: "12 mins",
    format: "Talking Head",
    generatedAppointments: 12,
    source: "Dr. Neha's Dental World",
    engagementScore: 10.3,
    whyItWorked: [
      "🧠 Explains abrasives scratching enamel instead of bleaching",
      "⚠️ Warns against permanent yellowing from wear",
      "💬 Save rate spikes from consumer cost warnings"
    ],
    sourceCreator: "Dr. Neha's Dental World",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r049",
    topic: "Invisible Braces Cost",
    category: "Costs",
    hook: "How much do ceramic braces cost compared to metal braces?",
    views: 320000,
    difficulty: "Easy",
    shootTime: "15 mins",
    format: "Talking Head",
    generatedAppointments: 16,
    source: "Clove Dental Inspired",
    engagementScore: 7.3,
    whyItWorked: [
      "💰 Shows transparent price points in India",
      "🧠 Evaluates aesthetic vs bracket thickness",
      "💬 Direct booking lead generator"
    ],
    sourceCreator: "Clove Dental Inspired",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r050",
    topic: "Dental crown longevity",
    category: "Hygiene",
    hook: "How long does a dental crown actually last? (Hint: not forever)",
    views: 270000,
    difficulty: "Easy",
    shootTime: "15 mins",
    format: "Talking Head",
    generatedAppointments: 11,
    source: "Radiant Smiles Pune",
    engagementScore: 6.7,
    whyItWorked: [
      "🧠 Explains wear margins and micro leakage",
      "🪥 Advises yearly clinical checkups",
      "⚡ Honest expectation builder"
    ],
    sourceCreator: "Radiant Smiles Pune",
    lastSeen: "May 2026",
    industry: "dental"
  },
  {
    id: "r051",
    topic: "Laser dentistry fear",
    category: "Pain/Fear",
    hook: "Dental treatments with zero drills and zero needles? Meet lasers",
    views: 340000,
    difficulty: "Medium",
    shootTime: "25 mins",
    format: "Voiceover",
    generatedAppointments: 18,
    source: "Care Dental Clinic",
    engagementScore: 8.5,
    whyItWorked: [
      "🧠 Visual look at clinic silent laser cavities removal",
      "⚠️ Reassures pediatric and highly phobic patients",
      "💬 Highly shared locally"
    ],
    sourceCreator: "Care Dental Clinic",
    lastSeen: "May 2026",
    industry: "dental"
  }
];
