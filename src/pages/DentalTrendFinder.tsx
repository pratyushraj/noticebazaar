import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
  Video
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

  // State for AI Generator
  const [aiCategory, setAiCategory] = useState<TrendCategory>('Myths');
  const [aiTone, setAiTone] = useState<string>('Educational');
  const [generatedIdeas, setGeneratedIdeas] = useState<any[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const { generateText, isGenerating, error } = useLocalLLM({
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
    "audio": "Trending audio suggestion description"
  }
]`;

    try {
      const responseText = await generateText(prompt);
      // Clean potential JSON markdown wraps
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
            audio: "Chill Lo-Fi Beat (Original Audio)"
          },
          {
            title: "Charcoal Toothpaste Warning",
            hook: "Read this before buying charcoal toothpaste!",
            body: "Show a piece of sandpaper. Rub it on a surface to show how abrasive charcoal particles scrape away precious enamel that never returns.",
            cta: "Comment your toothpaste brand & we will review it!",
            format: "Talking Head",
            audio: "Synthwave Instrumental Trend"
          },
          {
            title: "White Teeth Strengths",
            hook: "Why naturally yellow teeth are actually stronger than paper-white teeth.",
            body: "Explain that dentin is naturally pale yellow, showing through translucent enamel. Bright white usually means enamel thinning.",
            cta: "Schedule a dental checkup by tapping the link in bio.",
            format: "Voiceover",
            audio: "Aesthetic Chill Vibe"
          },
          {
            title: "Fluoride Safety check",
            hook: "Is your toothpaste toxic? Let's check the facts.",
            body: "Show fluoride ppm numbers. Debunk the toxicity myth by explaining that you would need to swallow 5 whole tubes to get sick.",
            cta: "Save this reel to protect your family's oral hygiene!",
            format: "Talking Head",
            audio: "Inspiring Corporate Synth"
          },
          {
            title: "Mouthwash Post Brushing",
            hook: "Stop using mouthwash right after brushing!",
            body: "Show that mouthwash washes away the highly beneficial fluoride left behind by your toothpaste, rendering the brush useless.",
            cta: "Tag a friend who always uses mouthwash!",
            format: "Voiceover",
            audio: "Upbeat Pop Instrumental"
          }
        ],
        Transformations: [
          {
            title: "Wedding Makeover Journey",
            hook: "Rebuilding this bride's smile in just 7 days!",
            body: "Show the patient's self-conscious smile, followed by clip of digital mapping, finishing with the stunning porcelain veneer reveal.",
            cta: "DM 'MAKEOVER' to secure a free smile consultation.",
            format: "Before/After",
            audio: "Romantic Bollywood Acoustic"
          },
          {
            title: "6 Months Clear Aligners",
            hook: "What 6 months of clear aligners did to her teeth.",
            body: "Visual timeline transition showing teeth shifting week-by-week. Clear, metallic-free aesthetic.",
            cta: "Tap the link in bio to check your aligners eligibility.",
            format: "Before/After",
            audio: "Upbeat electro-pop drop"
          },
          {
            title: "Grandmother's New Smile",
            hook: "Giving our grandmother her favorite food back.",
            body: "Show her struggling with hard food, followed by 3D implant placement visual, ending with her eating an apple happily.",
            cta: "Send this to someone who needs dental implants!",
            format: "Patient Testimonial",
            audio: "Soft Emotional Piano"
          },
          {
            title: "Gap Closure Magic",
            hook: "Closing a front gap in under 30 minutes.",
            body: "Show composite bonding process up close. Quick, painless veneer replacement aesthetic.",
            cta: "Book your cosmetic consult today via our bio link.",
            format: "Before/After",
            audio: "Satisfying ASMR Lo-Fi"
          },
          {
            title: "Gummy Smile Makeover",
            hook: "How we fixed this gummy smile without surgery.",
            body: "Show laser gingivectomy process. Quick, pain-free contouring highlighting the immediate healing results.",
            cta: "Comment 'SMILE' to learn more about laser contouring.",
            format: "Before/After",
            audio: "Energizing Synthpop"
          }
        ],
        "Doctor Reacts": [
          {
            title: "DIY Whitening Reaction",
            hook: "Dentist reacts to viral lemon juice whitening hack.",
            body: "Split screen: TikToker rubbing lemons on teeth, dentist rubbing hands on face in horror. Explain how citric acid dissolves enamel.",
            cta: "Follow us to save your teeth from internet hacks!",
            format: "Talking Head",
            audio: "Funny Comedy Soundboard"
          },
          {
            title: "DIY Nail File Brushing",
            hook: "Filing down your own teeth with a nail file?!",
            body: "React to the dangerous trend. Explain how filing removes enamel, exposes nerves, and leads to permanent root canals.",
            cta: "Share this to save someone from ruining their smile!",
            format: "Talking Head",
            audio: "Dramatic Orchestral Build"
          },
          {
            title: "DIY Braces Horror",
            hook: "Dentist reacts to home-made rubber band braces.",
            body: "Explain how rubber bands slip under gums, choke tooth roots, and cause teeth to literally fall out in weeks.",
            cta: "Drop your dental questions in the comments!",
            format: "Talking Head",
            audio: "Suspenseful Drone Vibe"
          },
          {
            title: "DIY Rhinestones Glue",
            hook: "Gluing gems to teeth with superglue? Please don't.",
            body: "Explain the toxicity of superglue and how it traps bacteria underneath, causing instant decay.",
            cta: "DM us for safe, temporary tooth gems done in clinic!",
            format: "Talking Head",
            audio: "Pop Dance Instrumental"
          },
          {
            title: "Purple Shampoo Toothpaste",
            hook: "Does purple corrector toothpaste actually work?",
            body: "Explain color theory (purple neutralizes yellow). Admit it works for 2 hours, but doesn't whiten the actual tooth structure.",
            cta: "Save this reel to save your money on fake whitening!",
            format: "Talking Head",
            audio: "Retro Synth Vibe"
          }
        ],
        Hygiene: [
          {
            title: "Morning Brushing Flaw",
            hook: "3 mistakes you're making every morning.",
            body: "Show brushing too hard, rinsing with water immediately, and brushing right after acidic coffee instead of waiting.",
            cta: "Comment 'GUIDE' for our free oral health PDF!",
            format: "Voiceover",
            audio: "Chill Chill Summer Beat"
          },
          {
            title: "Spoon breath test",
            hook: "Do you have bad breath? Use this 5-second spoon test.",
            body: "Scrape the back of your tongue with a metal spoon, let it dry, and smell it. Explain why tongue scraping is mandatory.",
            cta: "Book a deep scaling session using our link in bio.",
            format: "Voiceover",
            audio: "Satisfying ASMR Sounds"
          },
          {
            title: "Bleeding Gums Truth",
            hook: "If your gums bleed when brushing, do NOT stop brushing!",
            body: "Explain that bleeding is a sign of plaque buildup (gingivitis). Stopping brushing makes it worse. Gentle flossing is the cure.",
            cta: "Tap link in bio to schedule a gum health check.",
            format: "Talking Head",
            audio: "Inspiring Corporate Synth"
          },
          {
            title: "Flossing Wrong Tutorial",
            hook: "You are flossing wrong! (And it is hurting your gums)",
            body: "Show snapping floss straight down vs. curving it in a 'C' shape around each tooth structure.",
            cta: "Save this video for your nightly routine!",
            format: "Voiceover",
            audio: "Lo-Fi Beats for Studying"
          },
          {
            title: "Toothbrush replacement",
            hook: "Your toothbrush is a breeding ground for bacteria.",
            body: "Show frayed bristles vs. fresh bristles. Explain the 3-month rule and after-flu replacement.",
            cta: "Tag someone who hasn't changed their brush in a year!",
            format: "Voiceover",
            audio: "Groovy Disco Pop"
          }
        ],
        Costs: [
          {
            title: "Implant True Cost",
            hook: "How much does a dental implant actually cost in India?",
            body: "Break down components: titanium fixture, abutment, crown, surgical fee. Compare to the cost of letting bone melt.",
            cta: "DM 'IMPLANT' for pricing sheets of our clinic.",
            format: "Talking Head",
            audio: "Corporate Finance Beat"
          },
          {
            title: "Root Canal Price Variance",
            hook: "Why root canal treatment costs from ₹3000 to ₹12000.",
            body: "Explain technology differences: manual files vs. rotary, dental microscope, custom fiber posts, and crown materials.",
            cta: "Book your pain-free consultation via our bio.",
            format: "Talking Head",
            audio: "Smooth Elevator Jazz"
          },
          {
            title: "Treatments Worth Buying",
            hook: "Dental treatments worth paying for vs. ones you can skip.",
            body: "Highly worth: Scaling, cavity filling, aligners. Skip: DIY kits, expensive whitening toothpastes, non-medical veneers.",
            cta: "Drop your treatment questions below!",
            format: "Talking Head",
            audio: "Retro Synth Vibe"
          },
          {
            title: "Implant vs Bridge",
            hook: "Dental Implant vs. Dental Bridge: Which is worth your money?",
            body: "Explain how bridges shave adjacent healthy teeth, while implants protect them. Cost comparison over 15 years.",
            cta: "Book an appointment to save your adjacent teeth.",
            format: "Talking Head",
            audio: "Inspiring Synthwave"
          },
          {
            title: "Aligner Price Secrets",
            hook: "The hidden costs of Invisalign you should know beforehand.",
            body: "Break down refinement trays, retainers, and clinical attachment costs. Prompts transparency.",
            cta: "Comment 'ALIGN' to get a customized estimate.",
            format: "Talking Head",
            audio: "Minimal Techno Ambient"
          }
        ],
        "Pain/Fear": [
          {
            title: "Root Canal Pain Truth",
            hook: "Does a Root Canal actually hurt? (Let's be completely honest)",
            body: "Explain modern anesthesia. Show that a root canal actually RELIEVES pain, and is no more painful than a regular filling.",
            cta: "DM 'PAINLESS' to chat with our comfort specialist.",
            format: "Talking Head",
            audio: "Calming Ambient Pad"
          },
          {
            title: "Wisdom Tooth Extraction",
            hook: "What actually happens during a wisdom tooth removal?",
            body: "Walk through step-by-step with simple illustrations to remove the fear of the unknown. Emphasize post-op ice cream.",
            cta: "Share this with someone who is putting off their wisdom tooth surgery!",
            format: "Voiceover",
            audio: "Aesthetic Chill Vibe"
          },
          {
            title: "Terrified of needles?",
            hook: "Read this if you're avoiding the dentist out of fear.",
            body: "Show local anesthetic gel used to numb gums BEFORE any needle touches, and explain nitrous oxide (laughing gas).",
            cta: "Tap link in bio to book a gentle-dental appointment.",
            format: "Talking Head",
            audio: "Soft Peaceful Acoustic"
          },
          {
            title: "Laser Dentistry comfort",
            hook: "Dental treatments with zero drills and zero needles?",
            body: "Show laser dentistry removing decay silently with no vibration and no pain. Perfect for kids and anxious adults.",
            cta: "Comment 'LASER' to see if you qualify.",
            format: "Voiceover",
            audio: "Tech-Focused Synth"
          },
          {
            title: "Anxiety checklist",
            hook: "3 things we do to make anxious patients feel safe.",
            body: "List weighted blankets, custom Netflix goggles, and a signal to STOP treatment immediately if they raise their hand.",
            cta: "Save this for your next dental visit!",
            format: "Talking Head",
            audio: "Lo-Fi Instrumental Lounge"
          }
        ],
        "Patient Stories": [
          {
            title: "Traveling for Smile Design",
            hook: "Why Rahul traveled 500km for his smile design.",
            body: "Show Rahul's self-conscious teeth, the digital preview, the 2 sittings of porcelain veneers, and his new confident posture.",
            cta: "DM 'NEW SMILE' to start your online consultation.",
            format: "Patient Testimonial",
            audio: "Cinematic Uplifting Strings"
          },
          {
            title: "Smiling after 5 years",
            hook: "She hasn't smiled in 5 years, until today...",
            body: "Show a client who stopped laughing due to broken teeth, undergoing full mouth reconstruction, ending with tears of joy.",
            cta: "Tap link in bio to schedule a restorative consult.",
            format: "Patient Testimonial",
            audio: "Inspiring Piano Melody"
          },
          {
            title: "First Kid Cavity",
            hook: "How we made this 5-year-old's first cavity filling fun!",
            body: "Show the child blowing bubbles, selecting toys, laughing, and showing off her clean teeth. Removes childhood fear.",
            cta: "Share this with parents who have anxious kids!",
            format: "Patient Testimonial",
            audio: "Cute Playful Whistling"
          },
          {
            title: "Anesthesia Wears Off React",
            hook: "What our patients say when the anesthesia wears off.",
            body: "Record hilarious and sweet patient reactions after waking up from implant surgeries under conscious sedation.",
            cta: "Comment your funny dentist stories below!",
            format: "Patient Testimonial",
            audio: "Upbeat Acoustic Guitar"
          },
          {
            title: "Full reconstruction grandmother",
            hook: "We restored our grandmother's ability to eat her favorite food.",
            body: "Show a sweet elderly patient talking about how much she missed chewing nuts, followed by her implant restoration.",
            cta: "Book an implant evaluation for your parents.",
            format: "Patient Testimonial",
            audio: "Warm Acoustic Vibe"
          }
        ]
      };
      
      const categoryFallback = fallbacks[aiCategory] || fallbacks.Myths;
      setGeneratedIdeas(categoryFallback);
    }
  };

  // Deep-link helper to send details to ReelGenerator
  const handleUseIdea = (idea: any, category: string) => {
    const params = new URLSearchParams({
      hook: idea.hook,
      topic: idea.title || idea.topic || '',
      format: idea.format,
      category: category
    });
    navigate(`/reel-generator?${params.toString()}`);
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

  // Gated logic: first 6 are free, remaining are locked if user is logged out
  const displayReels = filteredReels.slice(0, 6);
  const lockedReels = filteredReels.slice(6);
  const totalCount = filteredReels.length;

  return (
    <div className="min-h-screen bg-[#020504] text-white font-outfit pb-24 relative overflow-hidden">
      <Helmet>
        <title>Dental Trend Finder & Viral Reel Ideas | Creator Armour</title>
        <meta name="description" content="Unlock what dental content is actually going viral on Instagram in India. Access our curated database of viral reels, analyze topic heatmaps, and generate scripts prefilled in our Reel Studio." />
      </Helmet>

      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-20%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-25%] w-[60%] h-[60%] bg-teal-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-6 pt-12 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black tracking-widest uppercase">
          <Zap className="w-3.5 h-3.5 fill-emerald-400 animate-pulse" />
          <span>Dental Viral Content Engine</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white max-w-4xl mx-auto leading-tight">
          What Content Is <span className="text-emerald-400 italic">Actually Working</span> On Dental Instagram?
        </h1>
        <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
          Stop guessing your hooks. We analyzed 500+ dental clinic reels in India to bring you the exact topics, formats, and scripts that generate patient appointments.
        </p>

        {/* Global Stats Badge */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-bold uppercase tracking-wider text-white/50">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>500+ Reels Analyzed</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl">
            <Heart className="w-4 h-4 text-emerald-400" />
            <span>Avg. 8.4% Engagement</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>50+ Curated Ideas</span>
          </div>
        </div>
      </div>

      {/* Trending Topics Pills */}
      <div className="max-w-4xl mx-auto px-6 mt-12 bg-neutral-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
        <h2 className="text-xs font-black text-emerald-400 tracking-widest uppercase mb-4 flex items-center gap-2 justify-center">
          <Flame className="w-4 h-4 fill-emerald-400" /> Trending Topics This Month
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
        
        {/* HEATMAP SECTION (12 Cols on small, 5 Cols on large) */}
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
                // Calculate percentage relative to max views (620k)
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

        {/* AI GENERATOR SECTION (12 Cols on small, 7 Cols on large) */}
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
              
              {generatedIdeas.map((idea, idx) => (
                <div key={idx} className="p-6 rounded-3xl bg-neutral-900/40 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-black tracking-wider text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                      Idea {idx + 1}: {idea.format || 'Talking Head'}
                    </span>
                    <span className="text-[10px] text-white/40 font-bold italic">
                      🎵 {idea.audio || 'Trending Audio'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-lg font-black text-white">{idea.title || `Viral ${aiCategory} Idea`}</h4>
                    <p className="text-xs text-white/50 leading-relaxed">
                      💡 <strong>Hook:</strong> <span className="text-white italic">"{idea.hook}"</span>
                    </p>
                    <p className="text-xs text-white/50 leading-relaxed">
                      🎬 <strong>Body Visuals:</strong> {idea.body}
                    </p>
                    <p className="text-xs text-white/50 leading-relaxed">
                      📢 <strong>CTA:</strong> {idea.cta}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleCopyIdea(idea, idx)}
                      className="flex-1 p-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-white/5"
                    >
                      {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Script
                    </button>
                    <button
                      onClick={() => handleUseIdea(idea, aiCategory)}
                      className="flex-1 p-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Video className="w-3.5 h-3.5 fill-black" />
                      Open in Studio
                    </button>
                  </div>
                </div>
              ))}
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
            {/* Category Filter */}
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

            {/* Difficulty Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl hover:bg-white/5 text-xs text-white/80 border-l border-white/10">
              <Clock className="w-3.5 h-3.5 text-white/40" />
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-transparent border-none text-white focus:outline-none cursor-pointer font-bold"
              >
                <option value="All" className="bg-neutral-900">All Difficulties</option>
                <option value="Easy" className="bg-neutral-900">Easy (Simple)</option>
                <option value="Medium" className="bg-neutral-900">Medium (Editing)</option>
                <option value="Hard" className="bg-neutral-900">Hard (Setup)</option>
              </select>
            </div>

            {/* Format Filter */}
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
          </div>
        </div>

        {/* Database Cards Grid */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayReels.map((reel) => (
              <div 
                key={reel.id} 
                className="p-6 rounded-3xl bg-neutral-900/40 border border-white/5 flex flex-col justify-between h-[280px] hover:border-emerald-500/20 hover:bg-emerald-500/[0.01] transition-all duration-300 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-black text-white/40 uppercase tracking-widest">
                    <span>{reel.category}</span>
                    <span className="text-emerald-400 font-black">{reel.engagementScore}% Engagement</span>
                  </div>
                  <h3 className="text-base font-black text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                    "{reel.hook}"
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/70">
                      {reel.format}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/70">
                      Diff: {reel.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/70">
                      {reel.shootTime} shoot
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase font-black tracking-wider">Est. Views</span>
                    <span className="text-sm font-black text-white">
                      {reel.views >= 1000000 ? `${(reel.views / 1000000).toFixed(1)}M` : `${reel.views / 1000}K`}
                    </span>
                  </div>
                  
                  {reel.generatedAppointments && (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-emerald-400/70 uppercase font-black tracking-wider">Patients</span>
                      <span className="text-sm font-black text-emerald-400">+{reel.generatedAppointments}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleUseIdea(reel, reel.category)}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-xl flex items-center gap-1 transition-all"
                  >
                    Use Hook <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* If logged in, render the remaining cards */}
            {isLoggedIn && lockedReels.map((reel) => (
              <div 
                key={reel.id} 
                className="p-6 rounded-3xl bg-neutral-900/40 border border-white/5 flex flex-col justify-between h-[280px] hover:border-emerald-500/20 hover:bg-emerald-500/[0.01] transition-all duration-300 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-black text-white/40 uppercase tracking-widest">
                    <span>{reel.category}</span>
                    <span className="text-emerald-400 font-black">{reel.engagementScore}% Engagement</span>
                  </div>
                  <h3 className="text-base font-black text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                    "{reel.hook}"
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/70">
                      {reel.format}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/70">
                      Diff: {reel.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/70">
                      {reel.shootTime} shoot
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase font-black tracking-wider">Est. Views</span>
                    <span className="text-sm font-black text-white">
                      {reel.views >= 1000000 ? `${(reel.views / 1000000).toFixed(1)}M` : `${reel.views / 1000}K`}
                    </span>
                  </div>

                  {reel.generatedAppointments && (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-emerald-400/70 uppercase font-black tracking-wider">Patients</span>
                      <span className="text-sm font-black text-emerald-400">+{reel.generatedAppointments}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleUseIdea(reel, reel.category)}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-xl flex items-center gap-1 transition-all"
                  >
                    Use Hook <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Gating Overlay for logged out users */}
          {!isLoggedIn && lockedReels.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 top-[280px] bg-gradient-to-t from-[#020504] via-[#020504]/95 to-transparent flex flex-col items-center justify-center pt-24 pb-8 text-center z-20">
              <div className="p-8 rounded-[32px] bg-neutral-900/90 border border-white/10 max-w-md space-y-6 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md mx-6 ring-1 ring-white/10">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto">
                  <Lock className="w-5 h-5 text-emerald-400" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white">Unlock Full Database</h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    You are viewing a public preview of the database. Sign up to unlock all {VIRAL_REEL_DATABASE.length} pre-researched dental hooks, difficulty filters, and creator rate sheets.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <a
                    href="/signup?redirect=dental-trends"
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-2xl uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                  >
                    Sign Up For Free <ArrowRight className="w-3.5 h-3.5 stroke-[3px]" />
                  </a>
                  <a
                    href="/login?redirect=dental-trends"
                    className="text-xs text-white/40 hover:text-white transition-colors font-bold"
                  >
                    Already have an account? Sign In
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
