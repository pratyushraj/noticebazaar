import axios from 'axios';

const NVIDIA_KEY = import.meta.env.VITE_NVIDIA_API_KEY;

export const scanChatScreenshot = async (base64Image: string) => {
  if (NVIDIA_KEY) {
    return await scanWithNvidia(base64Image);
  }

  throw new Error("No AI API Key found (NVIDIA is required).");
};

async function scanWithNvidia(base64Image: string) {
  const response = await axios.post(
    "https://integrate.api.nvidia.com/v1/chat/completions",
    {
      model: "nvidia/llama-3.1-nemotron-nano-vl-8b-v1",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: getSystemPrompt() },
            { type: "image_url", image_url: { url: base64Image } }
          ]
        }
      ],
      max_tokens: 1024,
      temperature: 0.2,
      top_p: 0.7
    },
    {
      headers: {
        Authorization: `Bearer ${NVIDIA_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  const text = response.data.choices[0].message.content;
  const jsonStr = text.replace(/```json|```/g, "").trim();
  return JSON.parse(jsonStr);
}

function getSystemPrompt() {
  return `
    You are an expert talent manager. Analyze this Instagram DM chat screenshot between a brand manager and a creator.
    Extract the following information and return ONLY as a valid JSON object:
    
    {
      "full_name": "string or null",
      "instagram_handle": "string or null (without @)",
      "followers": "number or null",
      "avg_views": "number or null",
      "engagement_rate": "number or null",
      "category": "string or null",
      "location": "string or null (e.g. Mumbai, Maharashtra)",
      "payout_upi": "string or null",
      "pincode": "string or null",
      "shipping_address": "string or null",
      "base_rate": "number or null (for 1 reel)",
      "past_brands": "string array or null",
      "audience_language": "string or null",
      "audience_gender_split": "string or null (e.g. '70% Female')",
      "audience_age_range": "string or null (e.g. '18-24')",
      "intro_line": "a catchy 1-sentence hook based on their style",
      "vibes": "comma separated vibes like Aesthetic, Relatable, Fun"
    }

    If data is missing, use null. Be precise with numbers.
  `;
}

export const refineTranscriptWithLLM = async (
  rawTranscript: string,
  context: 'notes' | 'prescription' | 'teeth' | 'nextVisit'
): Promise<string> => {
  if (!rawTranscript.trim()) return '';

  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const nvidiaKey = import.meta.env.VITE_NVIDIA_API_KEY;

  const prompt = `
You are an expert AI medical and dental scribe working in an Indian clinic context. 
The following is a raw, potentially noisy speech-to-text transcription of a doctor's dictation.
Your task is to correct any phonetic errors, spelling mistakes, numbers, and terminology mishearings, particularly focusing on Indian accents and common medical/dental terms.

Context of dictation: "${context}"
Raw transcript: "${rawTranscript}"

Guidelines:
1. For prescriptions (Rx), make sure medical names are spelled correctly (e.g., "paracetamol 650mg", "amoxicillin 500mg", "pantocid", "limcee", "combiflam", "augmentin", etc.). Correct phrases like "six fifty mg" to "650mg", "three days" to "3 days" or "for 3 days", etc.
2. For dental chart notes, match tooth numbers (11 to 48) and treatments (e.g., "RCT", "root canal", "implant", "scaling", "extraction").
3. For clinical notes/complaints, format them nicely (e.g., "patient complaining of pain in lower right back tooth since 3 days").
4. Keep the output matching the format of the intended field.
5. If the transcript is extremely short or contains no medical context, just clean up grammatical/spelling errors.
6. Return ONLY the refined/corrected text. Do not include any intro, explanation, markdown formatting (like code blocks), or extra commentary. Just the corrected text.
`;

  if (nvidiaKey) {
    try {
      const response = await axios.post(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        {
          model: "meta/llama-3.1-8b-instruct",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt }
              ]
            }
          ],
          max_tokens: 512,
          temperature: 0.1
        },
        {
          headers: {
            Authorization: `Bearer ${nvidiaKey}`,
            "Content-Type": "application/json"
          }
        }
      );
      const text = response.data?.choices?.[0]?.message?.content;
      if (text) return text.trim();
    } catch (e) {
      console.error("NVIDIA refinement failed, trying Gemini", e);
    }
  }

  if (geminiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const refinedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (refinedText) return refinedText.trim();
      }
    } catch (e) {
      console.error("Gemini refinement failed", e);
    }
  }

  return rawTranscript;
};

