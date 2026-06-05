export interface GeneratedBrief {
  hook: string;
  script: string;
  caption: string;
  shotList: string[];
}

export type BriefVariant = 'hinglish' | 'shorter' | 'viral' | 'professional' | 'hindi' | 'english';

// ── AI Script Generator (NVIDIA) ─────────────────────────────────────────────

const NVIDIA_API_KEY = import.meta.env.VITE_NVIDIA_API_KEY;
const NVIDIA_MODEL   = 'meta/llama-3.3-70b-instruct';

const VARIANT_STYLE: Record<BriefVariant, string> = {
  hinglish:     'Hinglish (mix of Hindi and English) — casual, relatable, local Indian tone',
  shorter:      'Ultra-short punchy English — 10–15 second reel format, fast-cut style',
  viral:        'Viral fear-hook English/Hinglish — shocking opener, high urgency, trending audio cues',
  professional: 'Formal clinical English — evidence-based, trust-building, educational tone',
  hindi:        'Pure conversational Hindi in Devanagari script — warm and approachable',
  english:      'Clean modern English — friendly but authoritative dental-professional voice',
};

function buildDentalPrompt(
  topic: string, hook: string, variant: BriefVariant,
  doctorName: string, clinicName: string, city: string,
): string {
  return `You are an expert Indian dental marketing scriptwriter.
Generate a high-converting Instagram Reel script for a dental clinic.

Topic: ${topic}
Opening Hook: ${hook}
Script Style: ${VARIANT_STYLE[variant]}
Doctor: ${doctorName}
Clinic: ${clinicName}, ${city}

Respond with ONLY a raw JSON object (no markdown, no code fences, no explanation):
{
  "hook": "one sentence scroll-stopping opening line",
  "script": "full shot-by-shot script with [Shot 1:] [Shot 2:] labels, 80-130 words",
  "caption": "Instagram caption with emojis and hashtags, 60-90 words",
  "shotList": ["A-roll: description (0-3s)", "B-roll: description (3-7s)", "A-roll: CTA (7-12s)"]
}

Rules: scripts 80-130 words, end with CTA, include clinic name and city, shotList 3-4 items with timestamps.`;
}

function parseJsonFromText(raw: string): GeneratedBrief | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed: GeneratedBrief = JSON.parse(match[0]);
    if (parsed.hook && parsed.script && parsed.caption && Array.isArray(parsed.shotList)) return parsed;
  } catch { /* fall through */ }
  return null;
}

/** Generate a dental reel script via Supabase Edge Function → NVIDIA llama-3.1-nemotron-70b. */
export async function generateScriptWithAI(
  topic: string,
  hook: string,
  variant: BriefVariant,
  doctorName = 'Dr. Aryan Parmar',
  clinicName = 'YOUR DENTIST',
  city = 'Patna',
): Promise<GeneratedBrief | null> {
  if (!NVIDIA_API_KEY) {
    console.error('[AI Script] VITE_NVIDIA_API_KEY is not set');
    return null;
  }

  const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[AI Script] Supabase env vars missing');
    return null;
  }

  const prompt = buildDentalPrompt(topic, hook, variant, doctorName, clinicName, city);

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/generate-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        prompt,
        provider: 'nvidia',
        model: NVIDIA_MODEL,
        apiKey: NVIDIA_API_KEY,
        temperature: 0.85,
        maxTokens: 800,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[AI Script] Edge function HTTP ${res.status}:`, errBody);
      return null;
    }

    const data = await res.json();
    const raw = data?.text || '';
    if (!raw) {
      console.error('[AI Script] Empty response from edge function');
      return null;
    }

    const parsed = parseJsonFromText(raw);
    if (!parsed) console.error('[AI Script] Could not parse JSON from:', raw);
    return parsed;
  } catch (err) {
    console.error('[AI Script] Error:', err);
    return null;
  }
}

/** Generate a chat response for the dental workspace via Supabase Edge Function → NVIDIA */
export async function generateChatResponseWithAI(
  userMessage: string,
  doctorName = 'Dr. Aryan Parmar',
  clinicName = 'YOUR DENTIST',
  city = 'Patna',
): Promise<string | null> {
  if (!NVIDIA_API_KEY) {
    console.error('[AI Chat] VITE_NVIDIA_API_KEY is not set');
    return null;
  }

  const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[AI Chat] Supabase env vars missing');
    return null;
  }

  const systemPrompt = `You are a helpful and expert dental marketing AI Assistant. Keep your response extremely relevant to: ${doctorName} at ${clinicName} in ${city}.
If the user asks for a script/reel/caption, generate a fresh and highly engaging one.
Keep your response concise, professional, friendly, and structured. Use bullet points or markdown styling. Max 180 words.`;

  const fullPrompt = `${systemPrompt}\n\nUser request: "${userMessage}"`;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/generate-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        provider: 'nvidia',
        model: NVIDIA_MODEL,
        apiKey: NVIDIA_API_KEY,
        temperature: 0.7,
        maxTokens: 600,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[AI Chat] Edge function HTTP ${res.status}:`, errBody);
      return null;
    }

    const data = await res.json();
    return data?.text || null;
  } catch (err) {
    console.error('[AI Chat] Error:', err);
    return null;
  }
}




const DENTAL_TEMPLATES: Record<string, Record<BriefVariant, GeneratedBrief>> = {
  'scaling': {
    hinglish: {
      hook: '"Scaling se daant hilte hain?" Sach jaan kar aap surprise ho jaoge.',
      script: `[Shot 1: Dr. Aryan sitting in clinic, looking serious, then smiling and pointing to camera]
Aaj clinic mein ek patient ne mujhse poocha, "Doctor scaling karwane se daant loose ho jaate hain kya?"

[Shot 2: Close-up of doctor holding a dental model with plaque/tartar buildup]
Sach ye hai ki scaling daant ko loose nahi karti. Jo tartar aur calculus (gandagi) daanton ke beech jama hota hai, wahi unko temporary support deta hai.

[Shot 3: Dr. Aryan showing scaling ultrasonic tip and smiling]
Usko remove karne ke baad jab gap feel hota hai, toh logon ko lagta hai daant hil rahe hain. Actually, scaling aapke gums aur teeth ko healthy banati hai aur bone loss rokti hai!

[Shot 4: CTA overlay with booking link]
Agar aapne bhi ye myth suna hai, toh comment mein "SCALING" likhiye aur abhi apna checkup book karein!`,
      caption: `Scaling se daant loose nahi hote ❌\n\nYe sabse common dental myth hai. Calculus and tartar buildup are the real enemies that destroy your gums. Scaling simply cleans them! 🦷\n\nBook your consultation with Dr. Aryan Parmar at YOUR DENTIST.\n📍 Patliputra, Patna\n\n#YourDentistPatna #DrAryanParmar #DentalScaling #PatnaDentist`,
      shotList: [
        "A-roll: Dr. Aryan introducing the scaling myth (0-3s)",
        "B-roll: Close-up of tartar/plaque on a model or screen (3-7s)",
        "B-roll: Pointing to ultrasonic scaler showing gentle vibrations (7-11s)",
        "A-roll: Dr. Aryan delivering the final reassurance and CTA (11-15s)"
      ]
    },
    shorter: {
      hook: 'Scaling = Loose teeth? Absolute lie! ❌',
      script: `[Shot 1: Quick cut of ultrasonic scaler working on model]
Agar aapko lagta hai scaling se daant hilte hain, toh aap bilkul galat hain! 

[Shot 2: Dr. Aryan speaking fast directly to camera]
Scaling sirf aapke daanton ke beech phasi gandi tartar ki layer ko saaf karti hai, enamel ko nahi. 

[Shot 3: Showing a clean white smile model]
Wo tartar gums ko damage kar raha hota hai. Clear gum health matlab stronger teeth! Comment "SCALING" to clean your smile today!`,
      caption: `Myth Buster: Scaling does NOT loosen teeth! ❌ It removes harmful tartar that causes gum disease. Let's get clean!\n\n📍 Visit YOUR DENTIST, Patna.`,
      shotList: [
        "B-roll: Fast montage of teeth cleaning visual (0-2s)",
        "A-roll: Dr. Aryan debunking the myth directly (2-7s)",
        "B-roll: Text overlay 'Book Clean Today' with address (7-10s)"
      ]
    },
    viral: {
      hook: 'Warning ⚠️ Stop ignoring this dental advice in Patna!',
      script: `[Shot 1: Pointing to a shocking overlay: "DAANT DHILE HO GAYE?"]
Aapke daant scaling ki wajah se nahi hil rahe... balki us tartar ki wajah se hil rahe hain jo aapne saalon se saaf nahi karwaya!

[Shot 2: Extreme close-up of scaler vibration in water, showing mist]
Ultrasonic scaling safe water waves se chalti hai, isme koi cutting tool nahi hota. Agar scaling nahi karwaoge toh pyorrhea se sach mein daant gir jayenge!

[Shot 3: Smile reveal with energetic music drop]
Save this reel for your next checkup. Comment 'BOOK' and get 10% off on your scaling package this week at YOUR DENTIST, Patna!`,
      caption: `The real warning your teeth want you to know! ⚠️ Leaving tartar untreated leads to severe bone loss and actual tooth loss. Professional cleaning is safe, painless, and vital! 🦷\n\n💬 Comment 'BOOK' for a WhatsApp appointment link.`,
      shotList: [
        "A-roll: Shocked expression from doctor with dynamic text overlay (0-3s)",
        "B-roll: Detail video of scaling mist and gentle technique (3-8s)",
        "A-roll: Final pitch with interactive discount offer (8-15s)"
      ]
    },
    professional: {
      hook: 'Clinical Fact: The biological reality of ultrasonic dental scaling.',
      script: `[Shot 1: Dr. Aryan in clinical coat, standing in front of high-end equipment]
Hello, I am Dr. Aryan Parmar. Today we are addressing the persistent clinical myth regarding dental scaling and tooth mobility.

[Shot 2: Screen display showing bone structure and gum pockets]
Scaling utilizes ultrasonic micro-vibrations to break down subgingival calculus. This procedure does not touch dental enamel or alter bone structures.

[Shot 3: Dr. Aryan smiling professionally]
The sensation of temporary mobility post-procedure is due to transient space where calculus was acting as a splint. Gums heal within 48 hours. Schedule your clinical hygiene visit at YOUR DENTIST, Patna.`,
      caption: `Clinical Insights: Ultrasonic scaling is a non-invasive prophylactic therapy to prevent periodontal disease. It preserves bone height and maintains gingival attachments. 🏥\n\nConsultation with Dr. Aryan Parmar, YOUR DENTIST, Patliputra Colony, Patna.`,
      shotList: [
        "A-roll: Doctor standing in formal setting introducing clinical topic (0-4s)",
        "B-roll: Clinical diagrams/screen showing periodontal attachment (4-9s)",
        "A-roll: Reassurance on safety and invitation to consultation (9-15s)"
      ]
    },
    hindi: {
      hook: 'क्या स्केलिंग कराने से दांत सच में ढीले हो जाते हैं? 🦷',
      script: `[Shot 1: डॉ. आर्यन कैमरे के सामने मुस्कुराते हुए]
आज क्लिनिक में मुझसे एक मरीज ने पूछा, "डॉक्टर साहब, स्केलिंग (दांतों की सफाई) से दांत कमजोर हो जाते हैं क्या?"

[Shot 2: मॉडल पर दांत की गंदगी को दिखाते हुए]
सच तो ये है कि स्केलिंग से दांत ढीले नहीं होते। दांतों के बीच जो पीली गंदगी (टार्टर) जमा होती है, वह मसूड़ों को सड़ा रही होती है।

[Shot 3: डॉ. आर्यन सफाई यंत्र दिखाते हुए]
जब सफाई से वो मैल हटता है, तो कुछ दिन दांतों में खालीपन लगता है। इसे ढीला होना नहीं कहते! स्केलिंग आपके दांतों की उम्र बढ़ाती है।

[Shot 4: बुकिंग विवरण स्क्रीन पर]
आज ही 'YOUR DENTIST' पटना आएं और अपनी मसूड़ों की जांच करवाएं। कमेंट में "जांच" लिखें!`,
      caption: `दांतों की सफाई से मसूड़े स्वस्थ होते हैं, कमजोर नहीं! ❌ दांतों के बीच जमा टार्टर ही मसूड़ों को नुकसान पहुंचाता है। सुरक्षित स्केलिंग के लिए आज ही संपर्क करें।\n\n🏥 YOUR DENTIST - डॉ. आर्यन परमार, पाटलिपुत्र, पटना।`,
      shotList: [
        "ए-रोल: डॉ. आर्यन हिंदी में विषय की शुरुआत करते हुए (0-3s)",
        "बी-रोल: टार्टर और गंदगी हटाने की क्रिया का प्रदर्शन (3-8s)",
        "ए-रोल: अंतिम सलाह और क्लिनिक आने का आमंत्रण (8-15s)"
      ]
    },
    english: {
      hook: 'Is dental scaling making your teeth loose? Let\'s bust this myth.',
      script: `[Shot 1: Dr. Aryan in modern dental surgery cabin]
A common question in our practice is whether professional scaling and polishing causes tooth mobility. The short answer is: absolutely not.

[Shot 2: Close-up of ultrasonic tip cleaning teeth model]
Scaling removes pathogenic calculus buildup that actively destroys bone. When this rigid calculus is cleaned, patients notice natural spaces previously hidden.

[Shot 3: Dr. Aryan speaking with confidence]
It is the calculus that was causing bone loss, not the treatment. Regular scaling preserves your natural smile. Book your visit at YOUR DENTIST, Patna today!`,
      caption: `Myth Buster: Dental scaling does not damage enamel or cause teeth to loosen. It removes toxic bacterial plaque that causes periodontitis. 🦷\n\nAppointments: Dr. Aryan Parmar, Patliputra Colony, Patna.`,
      shotList: [
        "A-roll: Dr. Aryan speaking directly in professional English (0-3s)",
        "B-roll: Video demonstrating gentle plaque removal (3-8s)",
        "A-roll: Health reminder and call to book appointments (8-12s)"
      ]
    }
  }
};

// Generic generator for other topics that don't match scaling
export function generateBriefForTopic(topic: string, details: string, defaultHook: string, variant: BriefVariant = 'hinglish'): GeneratedBrief {
  const normalizedTopic = topic.toLowerCase();
  
  // Return hardcoded scaling template if it matches scaling
  if (normalizedTopic.includes('scaling') || normalizedTopic.includes('loosen') || normalizedTopic.includes('cleaning')) {
    return DENTAL_TEMPLATES.scaling[variant];
  }

  // Smart fallback generator for other topics
  const doctorName = "Dr. Aryan Parmar";
  const clinicName = "YOUR DENTIST";
  const city = "Patna";
  const area = "Patliputra Colony";

  switch (variant) {
    case 'shorter':
      return {
        hook: `Quick check: ${defaultHook || topic} ⚡`,
        script: `[Shot 1: Dr. Aryan gesturing to camera]
Agar aap ${topic} ke baare mein pareshan hain, toh ye 10 seconds ki video dhyaan se dekhiye!

[Shot 2: Showing dental treatment visualization]
Humare clinic mein isko painless tarike se treat kiya jata hai. No pain, best results.

[Shot 3: Address card overlay]
Book your consult now at ${clinicName}, ${city}. Comment 'CARE' for details!`,
        caption: `Stop worrying about ${topic}! ❌ Get the right care today. 🏥\n\nConsult Dr. Aryan Parmar at ${clinicName}, ${city}.\n📍 ${area}`,
        shotList: [
          "A-roll: Dr. Aryan introducing the solution fast (0-3s)",
          "B-roll: Close-up of treatment setup or clinic environment (3-7s)",
          "A-roll: Call to action with WhatsApp comment info (7-10s)"
        ]
      };
    
    case 'viral':
      return {
        hook: `Warning ⚠️ Bihar doctors won't tell you this about ${topic}!`,
        script: `[Shot 1: Energetic pointing gesture with shock emoji overlay]
Aap sab ${topic} ko ignore kar rahe hain, par ye aapke smile ko permanently damage kar sakta hai!

[Shot 2: Zoom on dentist pointing at a white Board or slide screen]
Log saste hacks use karte hain, par clinically proven treatements hi safe hain. Apna enamel kharab mat kijiye.

[Shot 3: Dr. Aryan holding an implant/crown model]
Save this reel for your next pain event. DM us 'SMILE' for a free screening voucher at ${clinicName}, ${city}!`,
        caption: `The warning you can't afford to skip! ⚠️ Let's debunk ${topic} together. Comment 'SMILE' to unlock a special screening offer at ${clinicName}, Patna. 🦷\n\n#${clinicName.replace(/\s+/g, '')} #PatnaDentist #ViralDentalTips`,
        shotList: [
          "A-roll: High-energy warning intro with emoji graphics (0-3s)",
          "B-roll: Quick steps showing safe treatment processes (3-8s)",
          "A-roll: DM promotion for discounted dental checkups (8-15s)"
        ]
      };

    case 'professional':
      return {
        hook: `Clinical guidelines regarding ${topic} — explained by ${doctorName}.`,
        script: `[Shot 1: Dr. Aryan in formal consultation room]
Hello. Today we are presenting evidence-based guidelines regarding ${topic} and how modern dentistry manages this pathology.

[Shot 2: Clinical slides displaying details of treatments]
Early diagnostic checkups ensure that we prevent root canal infections or severe gingival bone loss. We leverage digital intraoral scans.

[Shot 3: Dr. Aryan summarizing clinical advice]
Proactive maintenance is less invasive and more cost-effective. Contact our reception at ${clinicName}, ${city} to schedule a comprehensive evaluation.`,
        caption: `Clinical Protocol: A brief review of diagnostics and treatment timelines for ${topic}. Recommended visit intervals: every 6 months. 🏥\n\nYOUR DENTIST — Dr. Aryan Parmar\n📍 ${area}, Patna`,
        shotList: [
          "A-roll: Formal introduction by Dr. Aryan (0-4s)",
          "B-roll: Interactive diagnostics demonstration (4-9s)",
          "A-roll: Official clinical invitation to checkup (9-15s)"
        ]
      };

    case 'hindi':
      return {
        hook: `${topic} से परेशान हैं? जानिए इसका सही और सुरक्षित इलाज।`,
        script: `[Shot 1: डॉ. आर्यन हाथ में डेंटल मॉडल लिए हुए]
नमस्ते, मैं डॉ. आर्यन परमार हूँ। क्या आप भी ${topic} की समस्या से जूझ रहे हैं और डरे हुए हैं?

[Shot 2: क्लिनिक के आधुनिक ट्रीटमेंट रूम का शॉट]
मरीजों को लगता है कि इसका इलाज बहुत दर्दनाक होगा, लेकिन हमारे आधुनिक क्लिनिक में हम इसे पूरी तरह आरामदायक बनाते हैं।

[Shot 3: डॉ. आर्यन मरीजों को समझाते हुए]
अपनी मुस्कान से समझौता न करें। आज ही पटना के पाटलिपुत्र कॉलोनी में स्थित 'YOUR DENTIST' क्लिनिक आएं और सही सलाह पाएं।`,
        caption: `${topic} का सही और सुरक्षित इलाज अब पटना में उपलब्ध है। 🏥 दर्द रहित इलाज और आधुनिक तकनीकों के लिए संपर्क करें।\n\n🏥 YOUR DENTIST - डॉ. आर्यन परमार, पटना।`,
        shotList: [
          "ए-रोल: डॉ. आर्यन हिंदी में विषय का विवरण देते हुए (0-4s)",
          "बी-रोल: आधुनिक सुरक्षित ट्रीटमेंट चेयर्स का प्रदर्शन (4-9s)",
          "ए-रोल: क्लिनिक आने का आग्रह (9-15s)"
        ]
      };

    case 'english':
      return {
        hook: `Suffering from ${topic}? Here is what you should do next.`,
        script: `[Shot 1: Dr. Aryan speaking with focus]
Hello. Let's discuss a critical patient query regarding ${topic} and why standard OTC solutions may not work.

[Shot 2: Showing patient care focus at YOUR DENTIST]
To achieve optimal outcomes, we perform custom diagnostic analysis and craft personalized care plans for every tooth.

[Shot 3: Final smile shot]
Let us help you smile with confidence again. Visit us at ${clinicName}, ${city} for a complete checkup.`,
        caption: `Oral Health Update: Understanding ${topic} and clinical solutions. 🦷 Schedule your comprehensive smile check at ${clinicName}.\n\n📍 ${area}, Patna`,
        shotList: [
          "A-roll: Introduction to the diagnostic topic (0-3s)",
          "B-roll: Demonstration of patient-focused diagnosis (3-7s)",
          "A-roll: Call to book consultation (7-11s)"
        ]
      };

    case 'hinglish':
    default:
      return {
        hook: `"${topic} se pareshan hain?" Ab tension lene ki zaroorat nahi hai.`,
        script: `[Shot 1: Dr. Aryan holding dental equipment, pointing with friendly face]
Aaj clinic mein ek patient ne mujhse poocha, "Doctor, kya ${topic} ka koi permanent solution hai?"

[Shot 2: Highlighting clean, sterile instrumentation]
Sach ye hai ki modern dentistry mein iska treatment bilkul safe aur painless ho chuka hai. Delay karne se pain aur badh jata hai.

[Shot 3: Dr. Aryan smiling at camera]
Aapke smile ki care humari priority hai. Agar aap Patna mein hain, toh consult karein ${clinicName}. Comment mein "${topic.split(' ')[0].toUpperCase()}" likhein and direct appointment link payein!`,
        caption: `${topic} se pareshan hone ki bilkul zaroorat nahi hai. ❌ Relatable care aur pain-free dental solutions available hain. Book your slot with Dr. Aryan Parmar today! 🦷\n\n🏥 ${clinicName}\n📍 ${area}, Patna\n\n#${clinicName.replace(/\s+/g, '')} #DrAryanParmar #PatnaDentist`,
        shotList: [
          "A-roll: Relatable question on the topic in Hinglish (0-3s)",
          "B-roll: Showing clean clinical equipment and patient care setting (3-7s)",
          "A-roll: Dr. Aryan inviting comments and giving CTA (7-12s)"
        ]
      };
  }
}
