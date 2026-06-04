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
  videoUrl?: string;
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
    id: "sc_DYT9CbtNM4h",
    topic: "Root canal treatment animation",
    category: "Transformations",
    hook: "Root canal treatment animation",
    views: 3204821,
    difficulty: "Hard",
    shootTime: "60s",
    format: "Before/After",
    generatedAppointments: 640,
    source: "@endoleventyuksel",
    engagementScore: 9.9,
    whyItWorked: ["🧠 Debunks a common misconception","⚠️ Fear-based hook grabs attention instantly","💬 High comment volume from skeptics","🚀 Mega-viral — exceeded 1M+ views"],
    sourceCreator: "@endoleventyuksel",
    lastSeen: "June 2025",
    industry: "dental",
    videoUrl: "https://www.instagram.com/reel/DYT9CbtNM4h/",
  },
  {
    id: "sc_DZIrvNYBIon",
    topic: "Teeth are supposed to have a hint of yellow",
    category: "Myths",
    hook: "Teeth are supposed to have a hint of yellow",
    views: 385874,
    difficulty: "Medium",
    shootTime: "30s",
    format: "Talking Head",
    generatedAppointments: 77,
    source: "@sid.and.listen",
    engagementScore: 7.3,
    whyItWorked: ["🧠 Debunks a common misconception","⚠️ Fear-based hook grabs attention instantly","💬 High comment volume from skeptics","🔥 Solid performer — 100K+ views"],
    sourceCreator: "@sid.and.listen",
    lastSeen: "June 2025",
    industry: "dental",
    videoUrl: "https://www.instagram.com/reel/DZIrvNYBIon/",
  },
  {
    id: "sc_DOolS08FCms",
    topic: "Tap 👆 into good oral health 🤩",
    category: "Myths",
    hook: "Tap 👆 into good oral health 🤩",
    views: 140875,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Talking Head",
    generatedAppointments: 28,
    source: "@colgateus",
    engagementScore: 5.8,
    whyItWorked: ["🧠 Debunks a common misconception","⚠️ Fear-based hook grabs attention instantly","💬 High comment volume from skeptics","🔥 Solid performer — 100K+ views"],
    sourceCreator: "@colgateus",
    lastSeen: "June 2025",
    industry: "dental",
    videoUrl: "https://www.instagram.com/reel/DOolS08FCms/",
  },
  {
    id: "sc_DPgkeJpks0n",
    topic: "Dental Implant in Just 10 Minutes",
    category: "Transformations",
    hook: "Dental Implant in Just 10 Minutes",
    views: 79384,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Talking Head",
    generatedAppointments: 15,
    source: "@orthosquaredental",
    engagementScore: 5.5,
    whyItWorked: ["✨ Visual proof drives aspiration","📲 Before/after format stops the scroll","💼 Direct booking intent from viewers"],
    sourceCreator: "@orthosquaredental",
    lastSeen: "June 2025",
    industry: "dental",
    videoUrl: "https://www.instagram.com/reel/DPgkeJpks0n/",
  },
  {
    id: "sc_DWXGTHFknms",
    topic: "Dentist Reveals What Really Happens In A ROOT CANAL",
    category: "Myths",
    hook: "Dentist Reveals What Really Happens In A ROOT CANAL",
    views: 57034,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Talking Head",
    generatedAppointments: 11,
    source: "@thebentistofficial",
    engagementScore: 5.3,
    whyItWorked: ["🧠 Debunks a common misconception","⚠️ Fear-based hook grabs attention instantly","💬 High comment volume from skeptics"],
    sourceCreator: "@thebentistofficial",
    lastSeen: "June 2025",
    industry: "dental",
    videoUrl: "https://www.instagram.com/reel/DWXGTHFknms/",
  },
  {
    id: "sc_DZFLDKvz_Eo",
    topic: "LIFE UPDATE! ... ( Dentistry, Gym, Content, Life, Failure, Balance)",
    category: "Patient Stories",
    hook: "LIFE UPDATE! ... ( Dentistry, Gym, Content, Life, Failure, Balance)",
    views: 46257,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Talking Head",
    generatedAppointments: 9,
    source: "@prince_bhansali__",
    engagementScore: 5.3,
    whyItWorked: ["🧠 Explains balance in doctor's busy life","⚠️ Raw honest story of failure and balance","💬 Massive community interactions from dental peers"],
    sourceCreator: "@prince_bhansali__",
    lastSeen: "June 2025",
    industry: "dental",
    videoUrl: "https://www.instagram.com/reel/DZFLDKvz_Eo/",
  },
{
    id: "r001",
    topic: "Does scaling loosen teeth?",
    category: "Myths",
    hook: "Does scaling loosen teeth? Here's what dentists don't tell you",
    views: 2435816,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Talking Head",
    generatedAppointments: 49,
    source: "Dr Morad Shaglouf",
    engagementScore: 9.2,
    whyItWorked: [
      "🧠 Common misconception about scaling",
      "⚠️ Fear-based hook capturing attention",
      "💬 High comment volume debating teeth stability"
    ],
    sourceCreator: "Dr Morad Shaglouf",
    lastSeen: "August 2024",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/sbLkVniGnhE"
  },
{
    id: "r002",
    topic: "Charcoal Toothpaste Warning",
    category: "Myths",
    hook: "Stop using charcoal toothpaste — it is destroying your enamel",
    views: 33510,
    difficulty: "Easy",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "The Everyday Dentist",
    engagementScore: 8.5,
    whyItWorked: [
      "🧠 Debunks popular beauty aesthetic trend",
      "⚠️ Urgency hook warning of enamel destruction",
      "⚡ Visual side-by-side sandpaper explanation"
    ],
    sourceCreator: "The Everyday Dentist",
    lastSeen: "October 2023",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/XLHV4KHMqDc"
  },
{
    id: "r003",
    topic: "DIY Tooth Whitening Reacts",
    category: "Doctor Reacts",
    hook: "Dentist reacts to viral lemon juice teeth whitening hack",
    views: 2405825,
    difficulty: "Medium",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 48,
    source: "The Braces Guy",
    engagementScore: 10.4,
    whyItWorked: [
      "😂 Humorous reaction format matching TikTok trends",
      "🧠 Science-backed explanation of citric acid danger",
      "💬 High debate and share rate"
    ],
    sourceCreator: "The Braces Guy",
    lastSeen: "September 2021",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/3CnjMJ5OvVI"
  },
{
    id: "r004",
    topic: "Aligners Journey",
    category: "Transformations",
    hook: "What 6 months of metal-free aligners did to her teeth",
    views: 20727,
    difficulty: "Hard",
    shootTime: "60s",
    format: "Before/After",
    generatedAppointments: 1,
    source: "Rivon Edge",
    engagementScore: 9.7,
    whyItWorked: [
      "✨ Aspirational before/after shift sequence",
      "🧠 Solves brace-related visual fear",
      "💬 Generates high 'Inquire for cost' comments"
    ],
    sourceCreator: "Rivon Edge",
    lastSeen: "June 2026",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/0IaszYGA37o"
  },
{
    id: "r005",
    topic: "Brushing Mistakes",
    category: "Hygiene",
    hook: "3 brushing mistakes you're making every single morning",
    views: 4,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Voiceover",
    generatedAppointments: 1,
    source: "TOOTH ENAMEL LAB",
    engagementScore: 7.9,
    whyItWorked: [
      "🧠 Points out everyday habit errors",
      "⚡ Easy-to-replicate visual guide",
      "🪥 Practical advice drives high bookmark/save rates"
    ],
    sourceCreator: "TOOTH ENAMEL LAB",
    lastSeen: "June 2026",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/1MllB7y-LL4"
  },
{
    id: "r006",
    topic: "Root Canal Cost Breakdown",
    category: "Costs",
    hook: "Why root canal treatment costs from ₹3000 to ₹12000",
    views: 32513,
    difficulty: "Easy",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "Dr. Rajat Sachdeva",
    engagementScore: 8.1,
    whyItWorked: [
      "💰 Absolute cost transparency build trust",
      "🧠 Clarifies tech differences (manual vs rotary)",
      "💬 Generates direct consultation inquiries"
    ],
    sourceCreator: "Dr. Rajat Sachdeva",
    lastSeen: "September 2025",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/33CsrItmWwY"
  },
{
    id: "r007",
    topic: "Root Canal Pain Honest Talk",
    category: "Pain/Fear",
    hook: "Does a Root Canal actually hurt? (Let's be completely honest)",
    views: 4,
    difficulty: "Medium",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "dentistark",
    engagementScore: 8.9,
    whyItWorked: [
      "🧠 Addresses primary patient anxiety head-on",
      "⚡ Explains modern painless local anesthetic",
      "💬 Sympathetic tone builds local clinic trust"
    ],
    sourceCreator: "dentistark",
    lastSeen: "June 2026",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/2m3UYWf869c"
  },
{
    id: "r008",
    topic: "Fearful Patient Story",
    category: "Patient Stories",
    hook: "She was so terrified of dentists, she didn't visit for 10 years...",
    views: 169,
    difficulty: "Medium",
    shootTime: "60s",
    format: "Patient Testimonial",
    generatedAppointments: 1,
    source: "Free Your Smile Dental Clinic | Delhi NCR",
    engagementScore: 11.5,
    whyItWorked: [
      "🎬 Strong narrative-driven emotional hook",
      "🧠 Focuses on empathetic sedation solutions",
      "✨ High social proof values"
    ],
    sourceCreator: "Free Your Smile Dental Clinic | Delhi NCR",
    lastSeen: "June 2024",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/o8y8dlkZvFc"
  },
{
    id: "r009",
    topic: "Mouthwash Side Effects",
    category: "Myths",
    hook: "Why using mouthwash right after brushing is actually bad",
    views: 30012,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "Washington Post",
    engagementScore: 9.1,
    whyItWorked: [
      "🧠 Counters standard commercial mouthwash tips",
      "⚡ Mind-blowing chemical interaction breakdown",
      "💬 Saves/shares fueled by surprise factor"
    ],
    sourceCreator: "Washington Post",
    lastSeen: "April 2025",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/1KhCelXWo_Q"
  },
{
    id: "r010",
    topic: "Rinsing After Brushing",
    category: "Hygiene",
    hook: "Stop spitting and rinsing! Here's the correct way to brush",
    views: 643364,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Voiceover",
    generatedAppointments: 13,
    source: "V Medica Clinics",
    engagementScore: 9.5,
    whyItWorked: [
      "🧠 Exposes wrong standard morning ritual",
      "🪥 Explains leaving fluoride protection layer",
      "⚡ Visual demonstration of correct process"
    ],
    sourceCreator: "V Medica Clinics",
    lastSeen: "August 2022",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/_YH9BF5DTL4"
  },
{
    id: "r011",
    topic: "Full Mouth Reconstruction",
    category: "Transformations",
    hook: "Full smile restoration for our 65-year-old grandfather",
    views: 139491,
    difficulty: "Hard",
    shootTime: "60s",
    format: "Before/After",
    generatedAppointments: 3,
    source: "Bhatia Dentopulse",
    engagementScore: 7.8,
    whyItWorked: [
      "✨ Emotional elder transformation dynamic",
      "🧠 Showcases advanced implant mapping capability",
      "💬 Strong validation from families booking for parents"
    ],
    sourceCreator: "Bhatia Dentopulse",
    lastSeen: "December 2022",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/prhbjuhcerc"
  },
{
    id: "r012",
    topic: "Wisdom Tooth Surgery",
    category: "Pain/Fear",
    hook: "What actually happens during a wisdom tooth removal?",
    views: 187527,
    difficulty: "Medium",
    shootTime: "60s",
    format: "Voiceover",
    generatedAppointments: 4,
    source: "Xavendar",
    engagementScore: 8.6,
    whyItWorked: [
      "🧠 Visual process map reduces mystery fear",
      "⚠️ Focuses on post-care reward (ice cream)",
      "💬 Extremely relatable to young adults"
    ],
    sourceCreator: "Xavendar",
    lastSeen: "September 2025",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/3SE3XTDTzgA"
  },
{
    id: "r013",
    topic: "DIY Aligner Dangers",
    category: "Doctor Reacts",
    hook: "Dentist reacts to DIY aligners ordered online",
    views: 535,
    difficulty: "Medium",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "Dr Akshay Rai",
    engagementScore: 9.3,
    whyItWorked: [
      "🧠 Warns about unsupervised teeth shifting",
      "😂 Sarcastic react to online brace advertising",
      "⚡ Drives clinical orthondotic checkup bookings"
    ],
    sourceCreator: "Dr Akshay Rai",
    lastSeen: "January 2023",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/QlOPyzKiZds"
  },
{
    id: "r014",
    topic: "Implant Cost vs Bridges",
    category: "Costs",
    hook: "Dental Implant vs. Dental Bridge: Which is worth your money?",
    views: 4115,
    difficulty: "Easy",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "Dental Implant Studio",
    engagementScore: 7.2,
    whyItWorked: [
      "💰 Shows 10-year cost efficiency of implants",
      "🧠 Explains bridge grinding damage to adjacent teeth",
      "⚡ High conversion rate for older patients"
    ],
    sourceCreator: "Dental Implant Studio",
    lastSeen: "April 2022",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/0ub6yYviq18"
  },
{
    id: "r015",
    topic: "Wedding Smile Makeover",
    category: "Transformations",
    hook: "Getting a smile makeover in 7 days before the wedding!",
    views: 1680,
    difficulty: "Hard",
    shootTime: "60s",
    format: "Before/After",
    generatedAppointments: 1,
    source: "Bhatia Dentopulse",
    engagementScore: 9.1,
    whyItWorked: [
      "✨ Aspirational timeline for brides-to-be",
      "🧠 Fast results with minimal veneers/whitening",
      "💬 Urgency triggers direct DM inquiries"
    ],
    sourceCreator: "Bhatia Dentopulse",
    lastSeen: "January 2023",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/oY0EKLPoQYo"
  },
{
    id: "r016",
    topic: "Why Gums Bleed",
    category: "Hygiene",
    hook: "If your gums bleed when brushing, do NOT stop brushing!",
    views: 225907,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Talking Head",
    generatedAppointments: 5,
    source: "Manipal Hospitals",
    engagementScore: 8.0,
    whyItWorked: [
      "🧠 Dispels fear of brushing tender bleeding areas",
      "⚡ Logical explanation of plaque-induced gingivitis",
      "🪥 Encourages correct light circular flossing"
    ],
    sourceCreator: "Manipal Hospitals",
    lastSeen: "September 2025",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/jeviYt1Eaow"
  },
{
    id: "r017",
    topic: "Yellow Teeth Myth",
    category: "Myths",
    hook: "Naturally yellow teeth are actually stronger than bright white?",
    views: 21675355,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Talking Head",
    generatedAppointments: 434,
    source: "Dental Digest",
    engagementScore: 11.2,
    whyItWorked: [
      "🧠 Shocking anatomical fact about dentin thickness",
      "⚡ Comforts patients insecure about natural shade",
      "💬 Generates massive debate in comment section"
    ],
    sourceCreator: "Dental Digest",
    lastSeen: "March 2025",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/1WW5L7XZr2s"
  },
{
    id: "r018",
    topic: "Teeth Whitening Cost",
    category: "Costs",
    hook: "Clinic Whitening vs. At-Home Whitening: True Cost Breakdown",
    views: 255320,
    difficulty: "Easy",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 5,
    source: "TRISA DENTAL SOLUTIONS",
    engagementScore: 6.9,
    whyItWorked: [
      "💰 Exposes cheap strip kits eroding enamel",
      "🧠 Defends clinical bleaching safety & duration",
      "⚡ Captures brides/groom prospects"
    ],
    sourceCreator: "TRISA DENTAL SOLUTIONS",
    lastSeen: "January 2023",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/29dHjCRD7lU"
  },
{
    id: "r019",
    topic: "Dentist reacts to DIY Braces",
    category: "Doctor Reacts",
    hook: "I cannot believe someone tried DIY braces at home...",
    views: 4032,
    difficulty: "Medium",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "Trident Smiles Dental",
    engagementScore: 9.9,
    whyItWorked: [
      "🧠 Warns against dangerous rubber-band setups",
      "😂 Genuine shock and professional horror react",
      "💬 Explains roots choking under gum pressure"
    ],
    sourceCreator: "Trident Smiles Dental",
    lastSeen: "July 2023",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/ll9C6FxK9bc"
  },
{
    id: "r020",
    topic: "Aligners Pain Level",
    category: "Pain/Fear",
    hook: "Does wearing clear aligners hurt? Honest comparison to braces",
    views: 697,
    difficulty: "Easy",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "Dr Sandiip S Aroraa",
    engagementScore: 8.4,
    whyItWorked: [
      "🧠 Truthful discomfort rating index",
      "⚠️ Normalizes initial pressure days",
      "💬 Attracts high-intent aligner prospects"
    ],
    sourceCreator: "Dr Sandiip S Aroraa",
    lastSeen: "March 2024",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/0jBgc_jahbw"
  },
{
    id: "r021",
    topic: "Grandmother Implant Story",
    category: "Patient Stories",
    hook: "We restored our grandmother's ability to eat her favorite food",
    views: 1021,
    difficulty: "Medium",
    shootTime: "60s",
    format: "Patient Testimonial",
    generatedAppointments: 1,
    source: "Dr Mayur Khairnar",
    engagementScore: 10.8,
    whyItWorked: [
      "🎬 Warm family emotion connection",
      "🧠 Practical explanation of chewing bite load",
      "💬 Direct booking from caring children"
    ],
    sourceCreator: "Dr Mayur Khairnar",
    lastSeen: "March 2025",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/aaU2ZSLn_XA"
  },
{
    id: "r022",
    topic: "Flossing Wrong",
    category: "Hygiene",
    hook: "You are flossing wrong! (And it is hurting your gums)",
    views: 612446,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Voiceover",
    generatedAppointments: 12,
    source: "FMS DENTAL BROADCASTING",
    engagementScore: 7.5,
    whyItWorked: [
      "🧠 Visual guide correcting gum bleeding triggers",
      "⚡ Demonstration of C-wrap technique",
      "🪥 High bookmark count for evening routines"
    ],
    sourceCreator: "FMS DENTAL BROADCASTING",
    lastSeen: "March 2023",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/cssLro3i4oY"
  },
{
    id: "r023",
    topic: "Fluoride Danger Myth",
    category: "Myths",
    hook: "Is fluoride toothpaste actually toxic? Let's check the science",
    views: 2141,
    difficulty: "Medium",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "Dr Aswin",
    engagementScore: 8.2,
    whyItWorked: [
      "🧠 Rebuts health influencer fear mongering",
      "⚡ Scientific toxicity comparison stats",
      "💬 Sparks logical hygiene discussion"
    ],
    sourceCreator: "Dr Aswin",
    lastSeen: "July 2025",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/ifKfysi-Y6Y"
  },
{
    id: "r024",
    topic: "Veneers Before/After",
    category: "Transformations",
    hook: "Veneers transformation: 10 teeth restored in 3 sittings",
    views: 1001,
    difficulty: "Hard",
    shootTime: "60s",
    format: "Before/After",
    generatedAppointments: 1,
    source: "Dr. Pro Smile",
    engagementScore: 8.7,
    whyItWorked: [
      "✨ Visual aesthetic transformation loop",
      "🧠 Focuses on custom digital shade mapping",
      "💬 Attracts high-value cosmetic requests"
    ],
    sourceCreator: "Dr. Pro Smile",
    lastSeen: "September 2025",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/BJSzOfCfJjs"
  },
{
    id: "r025",
    topic: "Scaling is not whitening",
    category: "Myths",
    hook: "Why teeth cleaning (scaling) won't make your yellow teeth white",
    views: 4261,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "That Dentist Girl",
    engagementScore: 9.0,
    whyItWorked: [
      "🧠 Clarifies difference between plaque and dentin shade",
      "⚡ Prevents post-scaling complaints",
      "💰 Sells actual clinic whitening treatments"
    ],
    sourceCreator: "That Dentist Girl",
    lastSeen: "October 2025",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/E64L4ge5PT4"
  },
{
    id: "r026",
    topic: "Invisalign Cost Breakdown",
    category: "Costs",
    hook: "The hidden costs of Invisalign you should know beforehand",
    views: 53831,
    difficulty: "Easy",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "DrBraces",
    engagementScore: 7.0,
    whyItWorked: [
      "💰 Complete cost honesty creates premium leads",
      "🧠 Details refinement alignments & retainers",
      "💬 Connects with Series-A / high income patients"
    ],
    sourceCreator: "DrBraces",
    lastSeen: "September 2024",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/6_J0G10gkmw"
  },
{
    id: "r027",
    topic: "Dentist reacts to Teeth Filing",
    category: "Doctor Reacts",
    hook: "Filing down your own teeth with a nail file?! Reacting to TikTok",
    views: 2623260,
    difficulty: "Easy",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 52,
    source: "The Bentist",
    engagementScore: 12.1,
    whyItWorked: [
      "🧠 Warns on irreversibility of enamel filing",
      "😂 High comedy and react expression appeal",
      "💬 Generates massive shares from worried parents"
    ],
    sourceCreator: "The Bentist",
    lastSeen: "May 2024",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/h9IIzZLh4m0"
  },
{
    id: "r028",
    topic: "Root Canal Avoidance",
    category: "Pain/Fear",
    hook: "What happens if you ignore a recommended Root Canal?",
    views: 10373,
    difficulty: "Easy",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "Royal Dental Clinics",
    engagementScore: 9.4,
    whyItWorked: [
      "⚠️ Educates on bone infection spreads",
      "🧠 Urgency trigger regarding irreversible pain",
      "💬 Direct booking conversion mechanism"
    ],
    sourceCreator: "Royal Dental Clinics",
    lastSeen: "November 2022",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/24m8xGvkKIg"
  },
{
    id: "r029",
    topic: "Kid's First Dental Visit",
    category: "Patient Stories",
    hook: "How we made this 5-year-old's first cavity filling fun!",
    views: 37243,
    difficulty: "Medium",
    shootTime: "60s",
    format: "Patient Testimonial",
    generatedAppointments: 1,
    source: "Mama Ayim",
    engagementScore: 10.2,
    whyItWorked: [
      "🎬 Warm cute child reaction dynamic",
      "🧠 Comforts parents who fear child dental fights",
      "💬 Direct booking from mothers"
    ],
    sourceCreator: "Mama Ayim",
    lastSeen: "August 2022",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/6iZtdbO58p0"
  },
{
    id: "r030",
    topic: "Electric vs Manual Brush",
    category: "Hygiene",
    hook: "Electric vs Manual Toothbrush: Dentist's honest recommendation",
    views: 7891,
    difficulty: "Easy",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "Royal Dental Clinics",
    engagementScore: 7.7,
    whyItWorked: [
      "🧠 Objective comparison breakdown of motor cycles",
      "🪥 Focuses on protection of gum margin line",
      "⚡ Relatable to tech-loving crowd"
    ],
    sourceCreator: "Royal Dental Clinics",
    lastSeen: "November 2024",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/0pa2pdE8auY"
  },
{
    id: "r031",
    topic: "Teeth grinding at night",
    category: "Hygiene",
    hook: "Waking up with a headache or jaw pain? Here is why",
    views: 16757,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Voiceover",
    generatedAppointments: 1,
    source: "Delhi 5 Dental Clinic",
    engagementScore: 8.3,
    whyItWorked: [
      "🧠 Explains bruxism headache correlations",
      "⚡ Shows night guard protection visual",
      "💬 Leads to night guard custom molds bookings"
    ],
    sourceCreator: "Delhi 5 Dental Clinic",
    lastSeen: "February 2025",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/z-G4ZL0q51A"
  },
{
    id: "r032",
    topic: "Aligners for adults",
    category: "Transformations",
    hook: "Am I too old to get braces or aligners at age 35?",
    views: 201774,
    difficulty: "Easy",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 4,
    source: "T32 Dental Care Clinic\u0026 Implant Centre, Mangalore",
    engagementScore: 8.6,
    whyItWorked: [
      "🧠 Comforts adult patients self-conscious of brackets",
      "✨ Showcases invisible clear tray aesthetic",
      "💬 Converts mature corporate clientele"
    ],
    sourceCreator: "T32 Dental Care Clinic\u0026 Implant Centre, Mangalore",
    lastSeen: "January 2024",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/5JVUy9tTE5E"
  },
{
    id: "r033",
    topic: "Bad breath test",
    category: "Hygiene",
    hook: "Do you have bad breath? Use this 5-second spoon test",
    views: 763,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Voiceover",
    generatedAppointments: 1,
    source: "Empyrean_Dental solutions by Dr Pratibha",
    engagementScore: 14.2,
    whyItWorked: [
      "⚡ Simple self-test prompts massive curiosity",
      "🧠 High shock factor concerning tongue bio-film",
      "💬 Explodes with saves/shares metrics"
    ],
    sourceCreator: "Empyrean_Dental solutions by Dr Pratibha",
    lastSeen: "July 2024",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/QFO504cQ-Pk"
  },
{
    id: "r034",
    topic: "Wisdom Tooth Myth",
    category: "Myths",
    hook: "Does everyone need their wisdom teeth removed?",
    views: 919,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "Dr.Pratima MDS",
    engagementScore: 8.8,
    whyItWorked: [
      "🧠 Clarifies necessity of tooth extraction",
      "⚠️ Relieves extraction paranoia",
      "⚡ Simple diagnostic x-ray display visual"
    ],
    sourceCreator: "Dr.Pratima MDS",
    lastSeen: "July 2025",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/rIHnW-O6trw"
  },
{
    id: "r035",
    topic: "Wisdom Tooth Cost",
    category: "Costs",
    hook: "Wisdom tooth removal cost: Simple extraction vs. surgical",
    views: 574972,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Talking Head",
    generatedAppointments: 11,
    source: "Dr.Mogla's My Dentist",
    engagementScore: 6.8,
    whyItWorked: [
      "💰 Shows price factors based on tooth impaction",
      "🧠 Prevents sticker shock for surgery patients",
      "💬 Excellent informational baseline"
    ],
    sourceCreator: "Dr.Mogla's My Dentist",
    lastSeen: "March 2023",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/4MqVFAo-qrU"
  },
{
    id: "r036",
    topic: "Dentist reacts to DIY grills",
    category: "Doctor Reacts",
    hook: "Dentist reacts to gluing rhinestones on teeth at home",
    views: 424,
    difficulty: "Medium",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "Doctor Seth",
    engagementScore: 10.1,
    whyItWorked: [
      "🧠 Warns on industrial toxic glue dangers",
      "😂 High fashion trends reaction format",
      "⚡ Sells clinic safe gems procedures"
    ],
    sourceCreator: "Doctor Seth",
    lastSeen: "October 2024",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/gSzf-0xxyIk"
  },
{
    id: "r037",
    topic: "Dental Anesthesia Fear",
    category: "Pain/Fear",
    hook: "Terrified of dental needles? Here is how we make it painless",
    views: 84081,
    difficulty: "Easy",
    shootTime: "45s",
    format: "Voiceover",
    generatedAppointments: 2,
    source: "Amara Aesthetic Studio",
    engagementScore: 9.0,
    whyItWorked: [
      "🧠 Demonstrates dental numbing gel prefix",
      "⚠️ Focuses on visual comfort elements",
      "💬 Highly successful in converting phobic patients"
    ],
    sourceCreator: "Amara Aesthetic Studio",
    lastSeen: "September 2025",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/ihvGjcgT4DA"
  },
{
    id: "r038",
    topic: "Gap closure story",
    category: "Patient Stories",
    hook: "Closing his front tooth gap changed his confidence forever",
    views: 249647,
    difficulty: "Medium",
    shootTime: "60s",
    format: "Patient Testimonial",
    generatedAppointments: 5,
    source: "Vijayadental",
    engagementScore: 11.1,
    whyItWorked: [
      "🎬 Strong emotional confidence narrative",
      "✨ Quick gap shift visual result",
      "💬 Encourages Patna locals to DM"
    ],
    sourceCreator: "Vijayadental",
    lastSeen: "August 2023",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/u54fSwux6nM"
  },
{
    id: "r039",
    topic: "Tongue Scraping",
    category: "Hygiene",
    hook: "Why brushing your tongue isn't enough to stop bad breath",
    views: 642249,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Voiceover",
    generatedAppointments: 13,
    source: "ANKIT TV",
    engagementScore: 8.9,
    whyItWorked: [
      "🧠 Explains bacteria trapping structure of tongue papillae",
      "🪥 Promotes copper scrapers benefit",
      "⚡ ASMR scraping visual drives high retention"
    ],
    sourceCreator: "ANKIT TV",
    lastSeen: "August 2024",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/Y1g3olbTDWw"
  },
{
    id: "r040",
    topic: "Pregnancy Dental Myths",
    category: "Myths",
    hook: "Is it safe to get dental treatment during pregnancy?",
    views: 4732,
    difficulty: "Medium",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "Garbh Samvad by Dr. Shraddha",
    engagementScore: 8.2,
    whyItWorked: [
      "🧠 Reassures expecting mothers on second trimester safety",
      "⚡ Clears confusion on dental x-rays during pregnancy",
      "💬 Highly shared in family chats"
    ],
    sourceCreator: "Garbh Samvad by Dr. Shraddha",
    lastSeen: "October 2025",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/J1863N6M8zU"
  },
{
    id: "r041",
    topic: "Smile Design Process",
    category: "Transformations",
    hook: "The complete step-by-step process of digital smile design",
    views: 6466,
    difficulty: "Hard",
    shootTime: "60s",
    format: "Before/After",
    generatedAppointments: 1,
    source: "Relief Dental Care Jaipur",
    engagementScore: 8.1,
    whyItWorked: [
      "✨ Inside look at clinic CAD/CAM tech",
      "🧠 High custom fit satisfaction visual",
      "💬 Pre-filters premium cosmetic target"
    ],
    sourceCreator: "Relief Dental Care Jaipur",
    lastSeen: "April 2022",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/aAkaNY683Ng"
  },
{
    id: "r042",
    topic: "Veneers vs Crowns cost",
    category: "Costs",
    hook: "Veneers vs. Dental Crowns: The cost and performance difference",
    views: 43579,
    difficulty: "Easy",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "The Everyday Dentist",
    engagementScore: 7.1,
    whyItWorked: [
      "💰 Detailed tooth shaving comparison",
      "🧠 Clinically advises veneers for front aesthetics only",
      "⚡ Direct conversion logic"
    ],
    sourceCreator: "The Everyday Dentist",
    lastSeen: "October 2024",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/TS1oLwyKUis"
  },
{
    id: "r043",
    topic: "Dentist reacts to purple shampoo",
    category: "Doctor Reacts",
    hook: "Does purple tooth corrector actually whiten teeth instantly?",
    views: 28577061,
    difficulty: "Easy",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 572,
    source: "_vector_",
    engagementScore: 11.8,
    whyItWorked: [
      "🧠 Unveils truth on optical temporary stains",
      "😂 Popular aesthetic trend react format",
      "💬 Massive save & share numbers"
    ],
    sourceCreator: "_vector_",
    lastSeen: "October 2023",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/wSuKznedIDI"
  },
{
    id: "r044",
    topic: "Root Canal vs Extraction",
    category: "Costs",
    hook: "Saving your natural tooth vs. pulling it: The real costs",
    views: 1147416,
    difficulty: "Easy",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 23,
    source: "Neetu Bisht",
    engagementScore: 8.4,
    whyItWorked: [
      "💰 Details future cost of replacement implants if pulled",
      "🧠 Protects natural tooth retention value",
      "💬 Generates massive booking consult volume"
    ],
    sourceCreator: "Neetu Bisht",
    lastSeen: "December 2022",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/tM8nDQXv6_4"
  },
{
    id: "r045",
    topic: "Gummy smile correction",
    category: "Transformations",
    hook: "How we fixed this gummy smile without surgery in 20 minutes",
    views: 9268,
    difficulty: "Medium",
    shootTime: "60s",
    format: "Before/After",
    generatedAppointments: 1,
    source: "Vijayadental",
    engagementScore: 9.2,
    whyItWorked: [
      "✨ Laser soft-tissue contouring visual",
      "🧠 Immediate side-by-side healed smile",
      "💬 Converts young aesthetic seekers"
    ],
    sourceCreator: "Vijayadental",
    lastSeen: "July 2023",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/azZ61K9ciiU"
  },
{
    id: "r046",
    topic: "Sensitivity triggers",
    category: "Hygiene",
    hook: "Teeth hurt when drinking cold water? Stop doing this...",
    views: 356,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "Smile Secrets by Dr. Shalini",
    engagementScore: 8.7,
    whyItWorked: [
      "🧠 Explains enamel wear exposing dentin tubules",
      "🪥 Advises soft brushes & sensitivity paste",
      "💬 Saves driven by common cold trigger symptoms"
    ],
    sourceCreator: "Smile Secrets by Dr. Shalini",
    lastSeen: "May 2026",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/1PL5nLSvZvI"
  },
{
    id: "r047",
    topic: "Hard vs Soft toothbrush",
    category: "Hygiene",
    hook: "Why hard toothbrushes should be banned (dentist explains)",
    views: 122,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "The Dental Network",
    engagementScore: 8.1,
    whyItWorked: [
      "🧠 Visual demonstration of scrub wear on gum lining",
      "🪥 Shows wear on yellow root exposures",
      "💬 Highly shared warning to family"
    ],
    sourceCreator: "The Dental Network",
    lastSeen: "December 2023",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/r45jNPeqTBk"
  },
{
    id: "r048",
    topic: "Teeth whitening truth",
    category: "Myths",
    hook: "Why teeth whitening toothpaste is mostly a scam",
    views: 165006,
    difficulty: "Easy",
    shootTime: "30s",
    format: "Talking Head",
    generatedAppointments: 3,
    source: "Upchar India",
    engagementScore: 10.3,
    whyItWorked: [
      "🧠 Explains abrasives scratching enamel instead of bleaching",
      "⚠️ Warns against permanent yellowing from wear",
      "💬 Save rate spikes from consumer cost warnings"
    ],
    sourceCreator: "Upchar India",
    lastSeen: "January 2023",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/DTMiTG3PscY"
  },
{
    id: "r049",
    topic: "Invisible Braces Cost",
    category: "Costs",
    hook: "How much do ceramic braces cost compared to metal braces?",
    views: 5392,
    difficulty: "Easy",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "Dr Preeti Kadu - Dental Clinic",
    engagementScore: 7.3,
    whyItWorked: [
      "💰 Shows transparent price points in India",
      "🧠 Evaluates aesthetic vs bracket thickness",
      "💬 Direct booking lead generator"
    ],
    sourceCreator: "Dr Preeti Kadu - Dental Clinic",
    lastSeen: "December 2023",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/86Xmq_ojNFY"
  },
{
    id: "r050",
    topic: "Dental crown longevity",
    category: "Hygiene",
    hook: "How long does a dental crown actually last? (Hint: not forever)",
    views: 7617,
    difficulty: "Easy",
    shootTime: "45s",
    format: "Talking Head",
    generatedAppointments: 1,
    source: "Vivid Specialized Dentistry",
    engagementScore: 6.7,
    whyItWorked: [
      "🧠 Explains wear margins and micro leakage",
      "🪥 Advises yearly clinical checkups",
      "⚡ Honest expectation builder"
    ],
    sourceCreator: "Vivid Specialized Dentistry",
    lastSeen: "April 2025",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/s1QARgulI18"
  },
{
    id: "r051",
    topic: "Laser dentistry fear",
    category: "Pain/Fear",
    hook: "Dental treatments with zero drills and zero needles? Meet lasers",
    views: 351,
    difficulty: "Medium",
    shootTime: "60s",
    format: "Voiceover",
    generatedAppointments: 1,
    source: "Clove Dental",
    engagementScore: 8.5,
    whyItWorked: [
      "🧠 Visual look at clinic silent laser cavities removal",
      "⚠️ Reassures pediatric and highly phobic patients",
      "💬 Highly shared locally"
    ],
    sourceCreator: "Clove Dental",
    lastSeen: "June 2024",
    industry: "dental",
    videoUrl: "https://www.youtube.com/embed/Fi0nGmHKYf4"
  }
];
