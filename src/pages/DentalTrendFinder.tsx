import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';

import { 
  Sparkles, 
  TrendingUp, 
  Lock, 
  ArrowRight, 
  Flame, 
  ChevronRight, 
  Filter, 
  Clock, 
  Coins, 
  Check, 
  Copy, 
  Play,
  Heart,
  MessageCircle,
  Eye,
  Zap,
  Shield,
  HelpCircle,
  Video,
  Calendar,
  FolderHeart
} from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useLocalLLM } from '@/lib/hooks/useLocalLLM';
import { 
  DENTAL_TOPIC_CLUSTERS, 
  TRENDING_THIS_MONTH, 
  VIRAL_REEL_DATABASE,
  TrendIdea,
  TrendCategory,
  TrendDifficulty,
  TrendFormat
} from '@/data/dentalTrends';

export default function DentalTrendFinder() {
  const { session } = useSession();
  const navigate = useNavigate();
  const isLoggedIn = !!session;

  // State for database filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedFormat, setSelectedFormat] = useState<string>('All');
  const [sortByViews, setSortByViews] = useState<string>('highToLow');

  // State for AI Generator
  const [aiCategory, setAiCategory] = useState<TrendCategory>('Myths');
  const [aiTone, setAiTone] = useState<string>('Educational');
  const [generatedIdeas, setGeneratedIdeas] = useState<any[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Persistence Save State UI lists (pre-fill from localStorage on mount)
  const [savedCalendarTopics, setSavedCalendarTopics] = useState<string[]>(() => {
    try {
      const items = localStorage.getItem('ca_content_workspace_items');
      if (items) {
        const parsed = JSON.parse(items);
        return parsed.map((item: any) => item.sourceTopic).filter(Boolean);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [savedVaultTopics, setSavedVaultTopics] = useState<string[]>(() => {
    try {
      const items = localStorage.getItem('ca_content_vault');
      if (items) {
        const parsed = JSON.parse(items);
        return parsed.map((item: any) => item.topic).filter(Boolean);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const { generateText, isGenerating } = useLocalLLM({
    temperature: 0.8,
    maxTokens: 1200
  });

  // Handle LLM script generation
  const handleGenerateIdeas = async () => {
    const selectedCluster = DENTAL_TOPIC_CLUSTERS.find(c => c.id === aiCategory);
    const avgViewsText = selectedCluster ? `${selectedCluster.avgViews.toLocaleString()} views` : 'high engagement';
    
    const prompt = `You are a dental content strategist specializing in high-performing Indian Instagram reels.
Based on viral trend data showing that "${aiCategory}" content averages ${avgViewsText} on Instagram, generate exactly 5 creative, highly engaging reel ideas for a local dental clinic aiming to attract new patients.

Tone of voice: ${aiTone}
Niche: Local Indian Dentist Clinic, relatable and trustworthy.

You must structure the output strictly as a valid JSON array of 5 objects, with NO surrounding markdown block, NO explanations, NO intro text, and NO trailing text. The output MUST be directly parseable by JSON.parse.

JSON structure:
[
  {
    "title": "Short catchy title",
    "hook": "Scroll-stopping first 3 seconds hook",
    "body": "Brief step-by-step description of what happens visually and verbally in the reel",
    "cta": "Clear call to action targeting clinic bookings or comments",
    "format": "Talking Head / Voiceover / Before/After / Patient Testimonial",
    "audio": "Trending audio suggestion description",
    "whyItWorked": ["Styled emoji bullet 1", "Styled emoji bullet 2"]
  }
]`;

    try {
      const responseText = await generateText(prompt);
      const cleanJson = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) {
        setGeneratedIdeas(parsed);
      } else {
        throw new Error("Response was not a JSON array");
      }
    } catch (err) {
      console.error("Failed to generate or parse AI ideas, using fallback...", err);
      // Fallback generator when LLM key is absent or returns non-JSON
      const fallbacks: Record<TrendCategory, any[]> = {
        Myths: [
          {
            title: "Scaling Myths Exposed",
            hook: "Does scaling loosen your teeth? The answer might shock you.",
            body: "Explain with a 3D dental model how calculus is removed, showing that scaling actually tightens teeth over time by protecting bone.",
            cta: "DM 'SCALING' to book a professional cleaning session today!",
            format: "Talking Head",
            audio: "Chill Lo-Fi Beat (Original Audio)",
            whyItWorked: [
              "🧠 Common misconception about scaling",
              "⚠️ Fear-based hook capturing attention",
              "💬 High comment volume debating teeth stability"
            ]
          },
          {
            title: "Charcoal Toothpaste Warning",
            hook: "Read this before buying charcoal toothpaste!",
            body: "Show a piece of sandpaper. Rub it on a surface to show how abrasive charcoal particles scrape away precious enamel that never returns.",
            cta: "Comment your toothpaste brand & we will review it!",
            format: "Talking Head",
            audio: "Synthwave Instrumental Trend",
            whyItWorked: [
              "🧠 Debunks popular beauty aesthetic trend",
              "⚠️ Urgency hook warning of enamel destruction",
              "⚡ Visual side-by-side sandpaper explanation"
            ]
          },
          {
            title: "White Teeth Strengths",
            hook: "Why naturally yellow teeth are actually stronger than paper-white teeth.",
            body: "Explain that dentin is naturally pale yellow, showing through translucent enamel. Bright white usually means enamel thinning.",
            cta: "Schedule a dental checkup by tapping the link in bio.",
            format: "Voiceover",
            audio: "Aesthetic Chill Vibe",
            whyItWorked: [
              "🧠 Shocking anatomical fact about dentin thickness",
              "⚡ Comforts patients insecure about natural shade",
              "💬 Generates massive debate in comment section"
            ]
          },
          {
            title: "Fluoride Safety check",
            hook: "Is your toothpaste toxic? Let's check the facts.",
            body: "Show fluoride ppm numbers. Debunk the toxicity myth by explaining that you would need to swallow 5 whole tubes to get sick.",
            cta: "Save this reel to protect your family's oral hygiene!",
            format: "Talking Head",
            audio: "Inspiring Corporate Synth",
            whyItWorked: [
              "🧠 Rebuts health influencer fear mongering",
              "⚡ Scientific toxicity comparison stats",
              "💬 Sparks logical hygiene discussion"
            ]
          },
          {
            title: "Mouthwash Post Brushing",
            hook: "Stop using mouthwash right after brushing!",
            body: "Show that mouthwash washes away the highly beneficial fluoride left behind by your toothpaste, rendering the brush useless.",
            cta: "Tag a friend who always uses mouthwash!",
            format: "Voiceover",
            audio: "Upbeat Pop Instrumental",
            whyItWorked: [
              "🧠 Counters standard commercial mouthwash tips",
              "⚡ Mind-blowing chemical interaction breakdown",
              "💬 Saves/shares fueled by surprise factor"
            ]
          }
        ],
        Transformations: [
          {
            title: "Wedding Makeover Journey",
            hook: "Rebuilding this bride's smile in just 7 days!",
            body: "Show the patient's self-conscious smile, followed by clip of digital mapping, finishing with the stunning porcelain veneer reveal.",
            cta: "DM 'MAKEOVER' to secure a free smile consultation.",
            format: "Before/After",
            audio: "Romantic Bollywood Acoustic",
            whyItWorked: [
              "✨ Aspirational timeline for brides-to-be",
              "🧠 Fast results with minimal veneers/whitening",
              "💬 Urgency triggers direct DM inquiries"
            ]
          },
          {
            title: "6 Months Clear Aligners",
            hook: "What 6 months of clear aligners did to her teeth.",
            body: "Visual timeline transition showing teeth shifting week-by-week. Clear, metallic-free aesthetic.",
            cta: "Tap the link in bio to check your aligners eligibility.",
            format: "Before/After",
            audio: "Upbeat electro-pop drop",
            whyItWorked: [
              "✨ Aspirational before/after shift sequence",
              "🧠 Solves brace-related visual fear",
              "💬 Generates high 'Inquire for cost' comments"
            ]
          },
          {
            title: "Grandmother's New Smile",
            hook: "Giving our grandmother her favorite food back.",
            body: "Show her struggling with hard food, followed by 3D implant placement visual, ending with her eating an apple happily.",
            cta: "Send this to someone who needs dental implants!",
            format: "Patient Testimonial",
            audio: "Soft Emotional Piano",
            whyItWorked: [
              "🎬 Warm family emotion connection",
              "🧠 Practical explanation of chewing bite load",
              "💬 Direct booking from caring children"
            ]
          },
          {
            title: "Gap Closure Magic",
            hook: "Closing a front gap in under 30 minutes.",
            body: "Show composite bonding process up close. Quick, painless veneer replacement aesthetic.",
            cta: "Book your cosmetic consult today via our bio link.",
            format: "Before/After",
            audio: "Satisfying ASMR Lo-Fi",
            whyItWorked: [
              "✨ Visual aesthetic transformation loop",
              "🧠 Focuses on custom digital shade mapping",
              "💬 Attracts high-value cosmetic requests"
            ]
          },
          {
            title: "Gummy Smile Makeover",
            hook: "How we fixed this gummy smile without surgery.",
            body: "Show laser gingivectomy process. Quick, pain-free contouring highlighting the immediate healing results.",
            cta: "Comment 'SMILE' to learn more about laser contouring.",
            format: "Before/After",
            audio: "Energizing Synthpop",
            whyItWorked: [
              "✨ Laser soft-tissue contouring visual",
              "🧠 Immediate side-by-side healed smile",
              "💬 Converts young aesthetic seekers"
            ]
          }
        ],
        "Doctor Reacts": [
          {
            title: "DIY Whitening Reaction",
            hook: "Dentist reacts to viral lemon juice whitening hack.",
            body: "Split screen: TikToker rubbing lemons on teeth, dentist rubbing hands on face in horror. Explain how citric acid dissolves enamel.",
            cta: "Follow us to save your teeth from internet hacks!",
            format: "Talking Head",
            audio: "Funny Comedy Soundboard",
            whyItWorked: [
              "😂 Humorous reaction format matching TikTok trends",
              "🧠 Science-backed explanation of citric acid danger",
              "💬 High debate and share rate"
            ]
          },
          {
            title: "DIY Nail File Brushing",
            hook: "Filing down your own teeth with a nail file?!",
            body: "React to the dangerous trend. Explain how filing removes enamel, exposes nerves, and leads to permanent root canals.",
            cta: "Share this to save someone from ruining their smile!",
            format: "Talking Head",
            audio: "Dramatic Orchestral Build",
            whyItWorked: [
              "🧠 Warns on irreversibility of enamel filing",
              "😂 High comedy and react expression appeal",
              "💬 Generates massive shares from worried parents"
            ]
          },
          {
            title: "DIY Braces Horror",
            hook: "Dentist reacts to home-made rubber band braces.",
            body: "Explain how rubber bands slip under gums, choke tooth roots, and cause teeth to literally fall out in weeks.",
            cta: "Drop your dental questions in the comments!",
            format: "Talking Head",
            audio: "Suspenseful Drone Vibe",
            whyItWorked: [
              "🧠 Warns against dangerous rubber-band setups",
              "😂 Genuine shock and professional horror react",
              "💬 Explains roots choking under gum pressure"
            ]
          },
          {
            title: "DIY Rhinestones Glue",
            hook: "Gluing gems to teeth with superglue? Please don't.",
            body: "Explain the toxicity of superglue and how it traps bacteria underneath, causing instant decay.",
            cta: "DM us for safe, temporary tooth gems done in clinic!",
            format: "Talking Head",
            audio: "Pop Dance Instrumental",
            whyItWorked: [
              "🧠 Warns on industrial toxic glue dangers",
              "😂 High fashion trends reaction format",
              "⚡ Sells clinic safe gems procedures"
            ]
          },
          {
            title: "Purple Shampoo Toothpaste",
            hook: "Does purple corrector toothpaste actually work?",
            body: "Explain color theory (purple neutralizes yellow). Admit it works for 2 hours, but doesn't whiten the actual tooth structure.",
            cta: "Save this reel to save your money on fake whitening!",
            format: "Talking Head",
            audio: "Retro Synth Vibe",
            whyItWorked: [
              "🧠 Unveils truth on optical temporary stains",
              "😂 Popular aesthetic trend react format",
              "💬 Massive save & share numbers"
            ]
          }
        ],
        Hygiene: [
          {
            title: "Morning Brushing Flaw",
            hook: "3 mistakes you're making every morning.",
            body: "Show brushing too hard, rinsing with water immediately, and brushing right after acidic coffee instead of waiting.",
            cta: "Comment 'GUIDE' for our free oral health PDF!",
            format: "Voiceover",
            audio: "Chill Chill Summer Beat",
            whyItWorked: [
              "🧠 Points out everyday habit errors",
              "⚡ Easy-to-replicate visual guide",
              "🪥 Practical advice drives high bookmark/save rates"
            ]
          },
          {
            title: "Spoon breath test",
            hook: "Do you have bad breath? Use this 5-second spoon test.",
            body: "Scrape the back of your tongue with a metal spoon, let it dry, and smell it. Explain why tongue scraping is mandatory.",
            cta: "Book a deep scaling session using our link in bio.",
            format: "Voiceover",
            audio: "Satisfying ASMR Sounds",
            whyItWorked: [
              "⚡ Simple self-test prompts massive curiosity",
              "🧠 High shock factor concerning tongue bio-film",
              "💬 Explodes with saves/shares metrics"
            ]
          },
          {
            title: "Bleeding Gums Truth",
            hook: "If your gums bleed when brushing, do NOT stop brushing!",
            body: "Explain that bleeding is a sign of plaque buildup (gingivitis). Stopping brushing makes it worse. Gentle flossing is the cure.",
            cta: "Tap link in bio to schedule a gum health check.",
            format: "Talking Head",
            audio: "Inspiring Corporate Synth",
            whyItWorked: [
              "🧠 Dispels fear of brushing tender bleeding areas",
              "⚡ Logical explanation of plaque-induced gingivitis",
              "🪥 Encourages correct light circular flossing"
            ]
          },
          {
            title: "Flossing Wrong Tutorial",
            hook: "You are flossing wrong! (And it is hurting your gums)",
            body: "Show snapping floss straight down vs. curving it in a 'C' shape around each tooth structure.",
            cta: "Save this video for your nightly routine!",
            format: "Voiceover",
            audio: "Lo-Fi Beats for Studying",
            whyItWorked: [
              "🧠 Visual guide correcting gum bleeding triggers",
              "⚡ Demonstration of C-wrap technique",
              "🪥 High bookmark count for evening routines"
            ]
          },
          {
            title: "Toothbrush replacement",
            hook: "Your toothbrush is a breeding ground for bacteria.",
            body: "Show frayed bristles vs. fresh bristles. Explain the 3-month rule and after-flu replacement.",
            cta: "Tag someone who hasn't changed their brush in a year!",
            format: "Voiceover",
            audio: "Groovy Disco Pop",
            whyItWorked: [
              "🧠 Visual demonstration of scrub wear on gum lining",
              "🪥 Shows wear on yellow root exposures",
              "💬 Highly shared warning to family"
            ]
          }
        ],
        Costs: [
          {
            title: "Implant True Cost",
            hook: "How much does a dental implant actually cost in India?",
            body: "Break down components: titanium fixture, abutment, crown, surgical fee. Compare to the cost of letting bone melt.",
            cta: "DM 'IMPLANT' for pricing sheets of our clinic.",
            format: "Talking Head",
            audio: "Corporate Finance Beat",
            whyItWorked: [
              "💰 Absolute cost transparency build trust",
              "🧠 Clarifies tech differences (manual vs rotary)",
              "💬 Generates direct consultation inquiries"
            ]
          },
          {
            title: "Root Canal Price Variance",
            hook: "Why root canal treatment costs from ₹3000 to ₹12000.",
            body: "Explain technology differences: manual files vs. rotary, dental microscope, custom fiber posts, and crown materials.",
            cta: "Book your pain-free consultation via our bio.",
            format: "Talking Head",
            audio: "Smooth Elevator Jazz",
            whyItWorked: [
              "💰 Complete cost honesty creates premium leads",
              "🧠 Details refinement alignments & retainers",
              "💬 Connects with Series-A / high income patients"
            ]
          },
          {
            title: "Treatments Worth Buying",
            hook: "Dental treatments worth paying for vs. ones you can skip.",
            body: "Highly worth: Scaling, cavity filling, aligners. Skip: DIY kits, expensive whitening toothpastes, non-medical veneers.",
            cta: "Drop your treatment questions below!",
            format: "Talking Head",
            audio: "Retro Synth Vibe",
            whyItWorked: [
              "💰 Exposes cheap strip kits eroding enamel",
              "🧠 Defends clinical bleaching safety & duration",
              "⚡ Captures brides/groom prospects"
            ]
          },
          {
            title: "Implant vs Bridge",
            hook: "Dental Implant vs. Dental Bridge: Which is worth your money?",
            body: "Explain how bridges shave adjacent healthy teeth, while implants protect them. Cost comparison over 15 years.",
            cta: "Book an appointment to save your adjacent teeth.",
            format: "Talking Head",
            audio: "Inspiring Synthwave",
            whyItWorked: [
              "💰 Shows 10-year cost efficiency of implants",
              "🧠 Explains bridge grinding damage to adjacent teeth",
              "⚡ High conversion rate for older patients"
            ]
          },
          {
            title: "Aligner Price Secrets",
            hook: "The hidden costs of Invisalign you should know beforehand.",
            body: "Break down refinement trays, retainers, and clinical attachment costs. Prompts transparency.",
            cta: "Comment 'ALIGN' to get a customized estimate.",
            format: "Talking Head",
            audio: "Minimal Techno Ambient",
            whyItWorked: [
              "💰 Complete cost honesty creates premium leads",
              "🧠 Details refinement alignments & retainers",
              "💬 Connects with Series-A / high income patients"
            ]
          }
        ],
        "Pain/Fear": [
          {
            title: "Root Canal Pain Truth",
            hook: "Does a Root Canal actually hurt? (Let's be honest)",
            body: "Explain modern anesthesia. Show that a root canal actually RELIEVES pain, and is no more painful than a regular filling.",
            cta: "DM 'PAINLESS' to chat with our comfort specialist.",
            format: "Talking Head",
            audio: "Calming Ambient Pad",
            whyItWorked: [
              "🧠 Addresses primary patient anxiety head-on",
              "⚡ Explains modern painless local anesthetic",
              "💬 Sympathetic tone builds local clinic trust"
            ]
          },
          {
            title: "Wisdom Tooth Extraction",
            hook: "What actually happens during a wisdom tooth removal?",
            body: "Walk through step-by-step with simple illustrations to remove the fear of the unknown. Emphasize post-op ice cream.",
            cta: "Share this with someone who is putting off their wisdom tooth surgery!",
            format: "Voiceover",
            audio: "Aesthetic Chill Vibe",
            whyItWorked: [
              "🧠 Visual process map reduces mystery fear",
              "⚠️ Focuses on post-care reward (ice cream)",
              "💬 Extremely relatable to young adults"
            ]
          },
          {
            title: "Terrified of needles?",
            hook: "Read this if you're avoiding the dentist out of fear.",
            body: "Show local anesthetic gel used to numb gums BEFORE any needle touches, and explain nitrous oxide (laughing gas).",
            cta: "Tap link in bio to book a gentle-dental appointment.",
            format: "Talking Head",
            audio: "Soft Peaceful Acoustic",
            whyItWorked: [
              "🧠 Demonstrates dental numbing gel prefix",
              "⚠️ Focuses on visual comfort elements",
              "💬 Highly successful in converting phobic patients"
            ]
          },
          {
            title: "Laser Dentistry comfort",
            hook: "Dental treatments with zero drills and zero needles?",
            body: "Show laser dentistry removing decay silently with no vibration and no pain. Perfect for kids and anxious adults.",
            cta: "Comment 'LASER' to see if you qualify.",
            format: "Voiceover",
            audio: "Tech-Focused Synth",
            whyItWorked: [
              "🧠 Visual look at clinic silent laser cavities removal",
              "⚠️ Reassures pediatric and highly phobic patients",
              "💬 Highly shared locally"
            ]
          },
          {
            title: "Anxiety checklist",
            hook: "3 things we do to make anxious patients feel safe.",
            body: "List weighted blankets, custom Netflix goggles, and a signal to STOP treatment immediately if they raise their hand.",
            cta: "Save this for your next dental visit!",
            format: "Talking Head",
            audio: "Lo-Fi Instrumental Lounge",
            whyItWorked: [
              "🧠 Explains headache correlations",
              "⚡ Shows night guard protection visual",
              "💬 Leads to night guard custom molds bookings"
            ]
          }
        ],
        "Patient Stories": [
          {
            title: "Traveling for Smile Design",
            hook: "Why Rahul traveled 500km for his smile design.",
            body: "Show Rahul's self-conscious teeth, the digital preview, the 2 sittings of porcelain veneers, and his new confident posture.",
            cta: "DM 'NEW SMILE' to start your online consultation.",
            format: "Patient Testimonial",
            audio: "Cinematic Uplifting Strings",
            whyItWorked: [
              "🎬 Strong emotional confidence narrative",
              "✨ Quick gap shift visual result",
              "💬 Encourages Patna locals to DM"
            ]
          },
          {
            title: "Smiling after 5 years",
            hook: "She hasn't smiled in 5 years, until today...",
            body: "Show a client who stopped laughing due to broken teeth, undergoing full mouth reconstruction, ending with tears of joy.",
            cta: "Tap link in bio to schedule a restorative consult.",
            format: "Patient Testimonial",
            audio: "Inspiring Piano Melody",
            whyItWorked: [
              "🎬 Strong narrative-driven emotional hook",
              "🧠 Focuses on empathetic sedation solutions",
              "✨ High social proof values"
            ]
          },
          {
            title: "First Kid Cavity",
            hook: "How we made this 5-year-old's first cavity filling fun!",
            body: "Show the child blowing bubbles, selecting toys, laughing, and showing off her clean teeth. Removes childhood fear.",
            cta: "Share this with parents who have anxious kids!",
            format: "Patient Testimonial",
            audio: "Cute Playful Whistling",
            whyItWorked: [
              "🎬 Warm cute child reaction dynamic",
              "🧠 Comforts parents who fear child dental fights",
              "💬 Direct booking from mothers"
            ]
          },
          {
            title: "Anesthesia Wears Off React",
            hook: "What our patients say when the anesthesia wears off.",
            body: "Record hilarious and sweet patient reactions after waking up from implant surgeries under conscious sedation.",
            cta: "Comment your funny dentist stories below!",
            format: "Patient Testimonial",
            audio: "Upbeat Acoustic Guitar",
            whyItWorked: [
              "🎬 Active creator vlog format",
              "🧠 Shows dentist consultation and immediate bleaching",
              "💬 Attracts local foodies and lifestyle segment"
            ]
          },
          {
            title: "Full reconstruction grandmother",
            hook: "We restored our grandmother's ability to eat her favorite food.",
            body: "Show a sweet elderly patient talking about how much she missed chewing nuts, followed by her implant restoration.",
            cta: "Book an implant evaluation for your parents.",
            format: "Patient Testimonial",
            audio: "Warm Acoustic Vibe",
            whyItWorked: [
              "🎬 Warm family emotion connection",
              "🧠 Practical explanation of chewing bite load",
              "💬 Direct booking from caring children"
            ]
          }
        ]
      };
      
      const categoryFallback = fallbacks[aiCategory] || fallbacks.Myths;
      setGeneratedIdeas(categoryFallback);
    }
  };

  // Clone for My Clinic function (Saves to Content Workspace and redirects to Studio/ReelGenerator)
  const handleCloneForMyClinic = (idea: any, category: string) => {
    try {
      const savedItems = localStorage.getItem('ca_content_workspace_items');
      let itemsList: any[] = [];
      if (savedItems) {
        itemsList = JSON.parse(savedItems);
      }
      
      const topicTitle = idea.topic || idea.title || 'Untitled Dental Reel';
      const clonedItem = {
        id: crypto.randomUUID(),
        day: null,
        week: null,
        type: 'Reel',
        topic: topicTitle,
        status: 'Draft',
        details: idea.body || `Cloned proven viral idea from Dental Trend Finder category ${category}.`,
        hook: idea.hook || `Select a script style above to write the opening hook.`,
        script: `No script generated yet. Please select an AI Script style above (like HINGLISH or VIRAL) to generate a custom dental script using NVIDIA AI.`,
        caption: `No caption generated yet. Select an AI Script style above to generate.`,
        assets: [],
        source: 'Dental Trend Finder (Cloned)',
        sourceType: 'trend-finder',
        sourceTopic: topicTitle,
        industry: 'dental',
        scheduledDate: null,
        createdAt: Date.now()
      };

      itemsList.push(clonedItem);
      localStorage.setItem('ca_content_workspace_items', JSON.stringify(itemsList));
      
      toast.success(`Cloned "${topicTitle}" to My Clinic! Opening in Workspace...`);
      
      setTimeout(() => {
        navigate(`/dentist-proposal`);
      }, 800);
    } catch (err) {
      console.error(err);
      toast.error('Failed to clone idea for your clinic.');
    }
  };

  // Save to Calendar function (Creates a standard ContentItem in localStorage - Day: null for drafts queue)
  const handleSaveToCalendar = (idea: any, category: string) => {
    try {
      const savedItems = localStorage.getItem('ca_content_workspace_items');
      let itemsList: any[] = [];
      if (savedItems) {
        itemsList = JSON.parse(savedItems);
      }
      
      const topicTitle = idea.topic || idea.title || 'Untitled Dental Reel';
      const newCalendarItem = {
        id: crypto.randomUUID(),
        day: null, // Draft Ideas Queue (does not auto-assign days)
        week: null, // Draft Ideas Queue
        type: 'Reel',
        topic: topicTitle,
        status: 'Draft',
        details: idea.body || `Proven viral idea from Dental Trend Finder category ${category}.`,
        hook: idea.hook || `Select a script style above to write the opening hook.`,
        script: `No script generated yet. Please select an AI Script style above (like HINGLISH or VIRAL) to generate a custom dental script using NVIDIA AI.`,
        caption: `No caption generated yet. Select an AI Script style above to generate.`,
        assets: [],
        source: 'Dental Trend Finder',
        sourceType: 'trend-finder',
        sourceTopic: topicTitle,
        industry: 'dental',
        scheduledDate: null,
        createdAt: Date.now()
      };

      itemsList.push(newCalendarItem);
      localStorage.setItem('ca_content_workspace_items', JSON.stringify(itemsList));
      setSavedCalendarTopics(prev => [...prev, topicTitle]);
      toast.success(`Successfully saved "${newCalendarItem.topic}" to Content Workspace Draft Queue!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save to Content Workspace Calendar.');
    }
  };

  // Save to Vault function (Saves to ca_content_vault - lightweight structure)
  const handleSaveToVault = (idea: any, category: string) => {
    try {
      const savedVault = localStorage.getItem('ca_content_vault');
      let vaultList: any[] = [];
      if (savedVault) {
        vaultList = JSON.parse(savedVault);
      }

      const topicTitle = idea.topic || idea.title || 'Untitled Dental Reel';

      const newVaultItem = {
        id: crypto.randomUUID(),
        topic: topicTitle,
        hook: idea.hook || '',
        category: category,
        difficulty: idea.difficulty || 'Easy',
        savedAt: Date.now(),
        source: 'Dental Trend Finder',
        industry: 'dental'
      };

      vaultList.push(newVaultItem);
      localStorage.setItem('ca_content_vault', JSON.stringify(vaultList));
      setSavedVaultTopics(prev => [...prev, topicTitle]);
      toast.success(`Successfully saved "${newVaultItem.topic}" to Content Vault Library!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save to Content Vault.');
    }
  };

  // Copy idea to clipboard
  const handleCopyIdea = (idea: any, index: number) => {
    const textToCopy = `Title: ${idea.title || idea.topic}\nHook: ${idea.hook}\nBody: ${idea.body}\nCTA: ${idea.cta}\nFormat: ${idea.format}\nAudio: ${idea.audio}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Filter Database logic
  const filteredReels = VIRAL_REEL_DATABASE.filter(item => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesDiff = selectedDifficulty === 'All' || item.difficulty === selectedDifficulty;
    const matchesFormat = selectedFormat === 'All' || item.format === selectedFormat;
    return matchesCat && matchesDiff && matchesFormat;
  });

  // Sort Database logic
  const displayReels = [...filteredReels].sort((a, b) => {
    if (sortByViews === 'highToLow') {
      return b.views - a.views;
    }
    if (sortByViews === 'lowToHigh') {
      return a.views - b.views;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#020504] text-white font-outfit pb-24 relative overflow-hidden">
      <Helmet>
        <title>Dental Trend Finder & Viral Reel Ideas | Creator Armour</title>
        <meta name="description" content="Unlock what dental content is actually going viral on Instagram in India. Access our curated database of viral reels, analyze topic heatmaps, and generate scripts prefilled in our Reel Studio." />
      </Helmet>

      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-20%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-25%] w-[60%] h-[60%] bg-teal-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Top Header Navigation */}
      <div className="max-w-7xl mx-auto px-6 pt-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <span className="font-black tracking-widest text-xs uppercase text-neutral-400">Creator Armour</span>
        </div>
        <button
          onClick={() => navigate('/dentist-proposal')}
          className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black text-white transition-all uppercase tracking-wider"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>My Clinic Workspace</span>
          <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-6 pt-6 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black tracking-widest uppercase">
          <Zap className="w-3.5 h-3.5 fill-emerald-400 animate-pulse" />
          <span>Dental Viral Content Engine</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white max-w-4xl mx-auto leading-tight">
          What Content Is <span className="text-emerald-400 italic">Actually Working</span> On Dental Instagram?
        </h1>
        
        {/* Metric Grid instead of standard taglines */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <span className="block text-2xl font-black text-emerald-400">500+</span>
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Viral Dental Reels</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <span className="block text-2xl font-black text-emerald-400">7</span>
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Categories</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <span className="block text-2xl font-black text-emerald-400">50+</span>
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Proven Hooks</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <span className="block text-2xl font-black text-emerald-400">100%</span>
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Ready-to-Use Scripts</span>
          </div>
        </div>
      </div>

      {/* Most Requested Topics Section */}
      <div className="max-w-4xl mx-auto px-6 mt-12 bg-neutral-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
        <h2 className="text-xs font-black text-emerald-400 tracking-widest uppercase mb-4 flex items-center gap-2 justify-center">
          <Flame className="w-4 h-4 fill-emerald-400 animate-bounce" /> 🔥 Most Requested Topics This Month
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {TRENDING_THIS_MONTH.map((item) => (
            <span 
              key={item.rank} 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-sm hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] cursor-default transition-all"
            >
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">
                {item.rank}
              </span>
              <span className="font-bold text-white/95">{item.topic}</span>
              <span className="text-[10px] text-white/40 font-bold bg-white/5 px-2 py-0.5 rounded-md">
                {item.views}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* HEATMAP SECTION */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 md:p-8 rounded-[32px] bg-neutral-900/40 border border-white/5 backdrop-blur-md space-y-6">
            <div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" /> Viral Topic Heatmap
              </h2>
              <p className="text-xs text-white/40 leading-relaxed mt-1">
                Average views per category across 500+ Indian dental reels.
              </p>
            </div>

            <div className="space-y-4">
              {DENTAL_TOPIC_CLUSTERS.map((cluster) => {
                const percentage = Math.min((cluster.avgViews / 620000) * 100, 100);
                return (
                  <div key={cluster.id} className="space-y-1.5 group">
                    <div className="flex items-center justify-between text-xs font-bold text-white/80">
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{cluster.icon}</span>
                        <span className="group-hover:text-emerald-400 transition-colors">{cluster.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/50 text-[10px]">
                        <span>{cluster.avgViews / 1000}K views</span>
                        <span>·</span>
                        <span className="text-emerald-400 font-bold">{cluster.avgEngagement}% engagement</span>
                      </div>
                    </div>
                    {/* Bar */}
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: cluster.color,
                          boxShadow: `0 0 10px ${cluster.color}40`
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-white/30 leading-snug pt-0.5 group-hover:text-white/50 transition-colors">
                      {cluster.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI GENERATOR SECTION */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 md:p-8 rounded-[32px] bg-gradient-to-br from-emerald-950/20 to-teal-950/10 border border-emerald-500/10 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Sparkles className="w-48 h-48 text-emerald-400" />
            </div>
            
            <div className="max-w-xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-black tracking-widest text-emerald-400 uppercase">
                <Sparkles className="w-4 h-4" />
                <span>Dental AI Script Engine</span>
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-white">
                Generate Viral Reels <span className="text-emerald-400 italic">For Your Clinic</span> In 10 Seconds.
              </h2>
              <p className="text-sm text-white/60 leading-relaxed">
                Choose a proven viral topic cluster and selected tone. Our AI will draft 5 structured reel scripts with scroll-stopping hooks and CTAs, fully compatible with our animated studio.
              </p>
            </div>

            {/* Inputs grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Topic Category</label>
                <select
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value as TrendCategory)}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none focus:border-emerald-500/30 font-bold"
                >
                  {DENTAL_TOPIC_CLUSTERS.map(c => (
                    <option key={c.id} value={c.id} className="bg-neutral-900">
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Selected Tone</label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none focus:border-emerald-500/30 font-bold"
                >
                  <option value="Educational" className="bg-neutral-900">🎓 Educational & Informative</option>
                  <option value="Humorous" className="bg-neutral-900">😂 Humorous & Entertaining</option>
                  <option value="Cost-focused" className="bg-neutral-900">💰 Transparency & Cost</option>
                  <option value="Relatable" className="bg-neutral-900">😱 Empathetic & Comforting</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateIdeas}
              disabled={isGenerating}
              className="w-full mt-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-black font-black rounded-2xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Generating Scripts...
                </>
              ) : (
                <>
                  <Sparkles className="w-4.5 h-4.5 fill-black" />
                  Generate 5 Reel Ideas
                </>
              )}
            </button>
          </div>

          {/* AI Output Cards */}
          {generatedIdeas.length > 0 && (
            <div className="space-y-4 animate-[reelSlideUp_0.4s_ease-out]">
              <h3 className="text-xs font-black text-emerald-400 tracking-widest uppercase">✨ Generated Reels for your clinic</h3>
              
              {generatedIdeas.map((idea, idx) => {
                const topicTitle = idea.title || idea.topic || `Viral ${aiCategory} Idea`;
                const isSavedToCalendar = savedCalendarTopics.includes(topicTitle);
                const isSavedToVault = savedVaultTopics.includes(topicTitle);

                return (
                  <div key={idx} className="p-6 rounded-3xl bg-neutral-900/40 border border-white/5 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-black tracking-wider text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                        Idea {idx + 1}: {idea.format || 'Talking Head'}
                      </span>
                      <span className="text-[10px] text-white/40 font-bold italic">
                        🎵 {idea.audio || 'Trending Audio'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-lg font-black text-white">{topicTitle}</h4>
                      <p className="text-xs text-white/50 leading-relaxed">
                        💡 <strong>Hook:</strong> <span className="text-white italic">"{idea.hook}"</span>
                      </p>
                      <p className="text-xs text-white/50 leading-relaxed">
                        🎬 <strong>Body Visuals:</strong> {idea.body}
                      </p>
                      <p className="text-xs text-white/50 leading-relaxed">
                        📢 <strong>CTA:</strong> {idea.cta}
                      </p>

                      {/* Styled Why it worked list */}
                      {idea.whyItWorked && idea.whyItWorked.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Why It Worked</span>
                          <ul className="space-y-1">
                            {idea.whyItWorked.map((bullet: string, bIdx: number) => (
                              <li key={bIdx} className="text-[11px] font-medium text-neutral-300 flex items-center gap-1.5">
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleCopyIdea(idea, idx)}
                        className="flex-1 min-w-[100px] p-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-white/5"
                      >
                        {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy
                      </button>
                      <button
                        onClick={() => handleSaveToVault(idea, aiCategory)}
                        disabled={isSavedToVault}
                        className={`flex-1 min-w-[100px] p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                          isSavedToVault 
                            ? 'bg-neutral-900 border-white/5 text-neutral-500 cursor-not-allowed' 
                            : 'bg-neutral-800 border-white/5 text-white hover:bg-neutral-700'
                        }`}
                      >
                        {isSavedToVault ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-rose-400" />
                            Saved to Vault
                          </>
                        ) : (
                          <>
                            <FolderHeart className="w-3.5 h-3.5 text-rose-400" />
                            Save to Vault
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleSaveToCalendar(idea, aiCategory)}
                        disabled={isSavedToCalendar}
                        className={`flex-1 min-w-[100px] p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                          isSavedToCalendar
                            ? 'bg-neutral-900 border-white/5 text-neutral-500 cursor-not-allowed'
                            : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20'
                        }`}
                      >
                        {isSavedToCalendar ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-cyan-400" />
                            Saved to Calendar
                          </>
                        ) : (
                          <>
                            <Calendar className="w-3.5 h-3.5" />
                            Save to Calendar
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleCloneForMyClinic(idea, aiCategory)}
                        className="flex-1 min-w-[100px] p-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Video className="w-3.5 h-3.5 fill-black" />
                        Clone for My Clinic
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CURATED VIRAL DATABASE SECTION */}
      <div className="max-w-7xl mx-auto px-6 mt-20 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-white">
              Curated Viral Dental Reels Database
            </h2>
            <p className="text-sm text-white/50 max-w-xl leading-relaxed mt-1">
              Top performing dentist reels in India ranked by engagement metrics. Apply filters to find specific formats.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-neutral-900/60 p-2 rounded-2xl border border-white/5">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl hover:bg-white/5 text-xs text-white/80">
              <Filter className="w-3.5 h-3.5 text-white/40" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent border-none text-white focus:outline-none cursor-pointer font-bold"
              >
                <option value="All" className="bg-neutral-900">All Categories</option>
                <option value="Myths" className="bg-neutral-900">Myths</option>
                <option value="Transformations" className="bg-neutral-900">Transformations</option>
                <option value="Doctor Reacts" className="bg-neutral-900">Doctor Reacts</option>
                <option value="Patient Stories" className="bg-neutral-900">Patient Stories</option>
                <option value="Costs" className="bg-neutral-900">Costs</option>
                <option value="Pain/Fear" className="bg-neutral-900">Pain/Fear</option>
                <option value="Hygiene" className="bg-neutral-900">Hygiene</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl hover:bg-white/5 text-xs text-white/80 border-l border-white/10">
              <Clock className="w-3.5 h-3.5 text-white/40" />
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-transparent border-none text-white focus:outline-none cursor-pointer font-bold"
              >
                <option value="All" className="bg-neutral-900">All Difficulties</option>
                <option value="Easy" className="bg-neutral-900">Easy Shoot</option>
                <option value="Medium" className="bg-neutral-900">Medium Shoot</option>
                <option value="Hard" className="bg-neutral-900">Hard Shoot</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl hover:bg-white/5 text-xs text-white/80 border-l border-white/10">
              <Coins className="w-3.5 h-3.5 text-white/40" />
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="bg-transparent border-none text-white focus:outline-none cursor-pointer font-bold"
              >
                <option value="All" className="bg-neutral-900">All Formats</option>
                <option value="Talking Head" className="bg-neutral-900">Talking Head</option>
                <option value="Voiceover" className="bg-neutral-900">Voiceover</option>
                <option value="Before/After" className="bg-neutral-900">Before/After</option>
                <option value="Patient Testimonial" className="bg-neutral-900">Patient Testimonial</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl hover:bg-white/5 text-xs text-white/80 border-l border-white/10">
              <Eye className="w-3.5 h-3.5 text-white/40" />
              <select
                value={sortByViews}
                onChange={(e) => setSortByViews(e.target.value)}
                className="bg-transparent border-none text-white focus:outline-none cursor-pointer font-bold"
              >
                <option value="highToLow" className="bg-neutral-900">Views: High to Low</option>
                <option value="lowToHigh" className="bg-neutral-900">Views: Low to High</option>
                <option value="none" className="bg-neutral-900">Default Order</option>
              </select>
            </div>
          </div>
        </div>

        {/* Database Cards Grid */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayReels.map((reel) => {
              const isSavedToCalendar = savedCalendarTopics.includes(reel.topic);
              const isSavedToVault = savedVaultTopics.includes(reel.topic);

              return (
                <div 
                  key={reel.id} 
                  className="p-6 rounded-3xl bg-neutral-900/40 border border-white/5 flex flex-col justify-between min-h-[360px] hover:border-emerald-500/20 hover:bg-emerald-500/[0.01] transition-all duration-300 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-black text-white/40 uppercase tracking-widest">
                      <span>{reel.category}</span>
                      <span className="text-emerald-400 font-black">{reel.engagementScore}% Engagement</span>
                    </div>

                    {/* Execution Badges */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-wider">
                        {reel.difficulty} Shoot
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/70">
                        {reel.shootTime}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/70">
                        {reel.format}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                      "{reel.hook}"
                    </h3>

                    {/* Reference Reel — YouTube or Instagram embed */}
                    {reel.videoUrl && (
                      <div className="mt-3 space-y-1.5">
                        <span className="text-[8px] font-black uppercase tracking-wider text-emerald-400/70 flex items-center gap-1">
                          🎬 Reference Reel
                        </span>
                        <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-black" style={{ aspectRatio: '9/16', maxHeight: '220px' }}>
                          <iframe
                            src={
                              reel.videoUrl.includes('instagram.com')
                                ? `${reel.videoUrl.replace(/\/$/, '')}/embed/`
                                : `${reel.videoUrl}?autoplay=0&rel=0&modestbranding=1`
                            }
                            className="w-full h-full"
                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                            title={`Reference: ${reel.topic}`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Styled Emoji Bullets for Why It Worked */}
                    {reel.whyItWorked && (
                      <div className="space-y-1 pt-1.5">
                        <span className="text-[8px] font-black uppercase tracking-wider text-neutral-500">Why It Worked</span>
                        <ul className="space-y-0.5">
                          {reel.whyItWorked.map((bullet, idx) => (
                            <li key={idx} className="text-[10px] font-medium text-neutral-400 flex items-center gap-1.5">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-white/5">
                    {/* Detailed Source attribution block */}
                    <div className="flex items-center justify-between text-[9px] text-white/40 uppercase font-mono font-bold">
                      <span>Based on: <strong className="text-white">{reel.views.toLocaleString('en-IN')} Views</strong></span>
                      <span>{reel.sourceCreator}</span>
                      <span>Last Seen: {reel.lastSeen}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">

                      <div className="flex gap-1.5 ml-auto">
                        <button
                          onClick={() => handleSaveToVault(reel, reel.category)}
                          disabled={isSavedToVault}
                          className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                            isSavedToVault 
                              ? 'bg-neutral-900 border border-white/5 text-neutral-600 cursor-not-allowed' 
                              : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                          }`}
                          title={isSavedToVault ? "Saved to Vault" : "Save to Vault"}
                        >
                          {isSavedToVault ? <Check className="w-4 h-4 text-emerald-400" /> : <FolderHeart className="w-4 h-4 text-rose-400" />}
                        </button>
                        <button
                          onClick={() => handleSaveToCalendar(reel, reel.category)}
                          disabled={isSavedToCalendar}
                          className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                            isSavedToCalendar
                              ? 'bg-neutral-900 border border-white/5 text-neutral-600 cursor-not-allowed'
                              : 'bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400'
                          }`}
                          title={isSavedToCalendar ? "Saved to Calendar" : "Save to Calendar"}
                        >
                          {isSavedToCalendar ? <Check className="w-4 h-4 text-emerald-400" /> : <Calendar className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleCloneForMyClinic(reel, reel.category)}
                          className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-xl flex items-center gap-1 transition-all"
                        >
                          Clone for My Clinic <ChevronRight className="w-3 h-3 stroke-[2px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
