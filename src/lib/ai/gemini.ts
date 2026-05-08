import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const NVIDIA_KEY = import.meta.env.VITE_NVIDIA_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_KEY || "");

export const scanChatScreenshot = async (base64Image: string) => {
  // Prefer NVIDIA if key is present (higher quality for complex charts)
  if (NVIDIA_KEY) {
    return await scanWithNvidia(base64Image);
  }
  
  if (GEMINI_KEY) {
    return await scanWithGemini(base64Image);
  }

  throw new Error("No AI API Key found (Gemini or NVIDIA).");
};

async function scanWithGemini(base64Image: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = getSystemPrompt();

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Image.split(",")[1],
        mimeType: "image/jpeg",
      },
    },
  ]);

  const response = await result.response;
  const text = response.text();
  const jsonStr = text.replace(/```json|```/g, "").trim();
  return JSON.parse(jsonStr);
}

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
