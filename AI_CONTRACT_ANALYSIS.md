# AI-Powered Contract Analysis

The Contract Scanner now uses **free AI (LLM)** to analyze brand deal contracts, providing more intelligent and comprehensive analysis than rule-based methods.

## 🚀 Quick Start (No Setup Required!)

**By default, AI analysis is DISABLED** and uses rule-based analysis. To enable AI:

1. **Set environment variable** in your server `.env` file:
   ```env
   USE_AI_CONTRACT_ANALYSIS=true
   ```

2. **That's it!** The system will use Hugging Face (free, no API key needed).

## 🎯 Free LLM Providers

### 1. Hugging Face (Default - No API Key Needed!)

**Best for:** Getting started quickly, no setup required

```env
USE_AI_CONTRACT_ANALYSIS=true
LLM_PROVIDER=huggingface
LLM_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

**Note:** First request may take ~30 seconds (model loading), subsequent requests are faster.

### 2. Groq (Fastest, Free API Key)

**Best for:** Speed and performance

1. Sign up at https://console.groq.com (free)
2. Get your API key
3. Add to `.env`:

```env
USE_AI_CONTRACT_ANALYSIS=true
LLM_PROVIDER=groq
LLM_MODEL=llama-3.1-8b-instant
LLM_API_KEY=your_groq_api_key_here
```

**Free models:**
- `llama-3.1-8b-instant` (fastest)
- `mixtral-8x7b-32768` (more capable)

### 3. Google Gemini (Recommended - High Quality)

**Best for:** High-quality, reliable responses

1. Get your API key from https://makersuite.google.com/app/apikey
2. Add to `.env`:

```env
USE_AI_CONTRACT_ANALYSIS=true
LLM_PROVIDER=gemini
LLM_MODEL=gemini-pro
LLM_API_KEY=your_gemini_api_key_here
```

**Free models:**
- `gemini-pro` (recommended)
- `gemini-pro-vision` (for image analysis)

### 4. Together AI (Free Tier)

**Best for:** High-quality responses

1. Sign up at https://together.ai (free tier available)
2. Get your API key
3. Add to `.env`:

```env
USE_AI_CONTRACT_ANALYSIS=true
LLM_PROVIDER=together
LLM_MODEL=mistralai/Mixtral-8x7B-Instruct-v0.1
LLM_API_KEY=your_together_api_key_here
```

## 📝 Environment Configuration

Add these to your server `.env` file:

```env
# Enable AI contract analysis
USE_AI_CONTRACT_ANALYSIS=true

# Choose your provider (default: huggingface)
LLM_PROVIDER=huggingface

# Model name (varies by provider)
LLM_MODEL=mistralai/Mistral-7B-Instruct-v0.2

# API key (optional for Hugging Face, required for Groq/Together)
LLM_API_KEY=your_api_key_here
```

## 🔄 How It Works

1. **AI Analysis (if enabled):**
   - Extracts text from PDF
   - Sends to free LLM (Hugging Face/Groq/Together)
   - AI analyzes contract and returns structured JSON
   - Identifies issues, verified clauses, key terms, and recommendations

2. **Fallback to Rule-Based:**
   - If AI fails or is disabled, uses rule-based analysis
   - Ensures reliability even if AI service is unavailable

## 📊 What AI Analysis Provides

- **Intelligent Issue Detection:** Identifies complex contract problems beyond simple pattern matching
- **Context-Aware Recommendations:** Provides actionable advice based on contract context
- **Key Terms Extraction:** Automatically extracts deal value, duration, deliverables, payment schedule, exclusivity
- **Risk Assessment:** Calculates protection score and overall risk level
- **Verified Clauses:** Highlights positive aspects of the contract

## 🔧 Troubleshooting

### "AI analysis failed, falling back to rule-based"

**Hugging Face:**
- Model might be loading (first request takes ~30 seconds)
- Try again after a few seconds
- Some models require API key for rate limits (optional)

**Groq/Gemini/Together:**
- Check if API key is set correctly
- Verify API key is valid
- Check free tier limits

### Slow Responses

- **Hugging Face**: First request is slow (model loading), subsequent requests are faster
- **Switch to Groq**: Much faster responses
- **Use smaller models**: Faster but less capable

### Rate Limits

- **Hugging Face**: Public models have rate limits (get free API key to increase)
- **Groq**: Generous free tier
- **Gemini**: Generous free tier (60 requests/minute)
- **Together AI**: Generous free tier

## 🎉 Benefits Over Rule-Based Analysis

1. **More Intelligent:** Understands context and contract structure
2. **Better Issue Detection:** Finds subtle problems rule-based methods miss
3. **Comprehensive Analysis:** Provides detailed explanations and recommendations
4. **Adaptive:** Learns from different contract formats and styles
5. **Future-Proof:** Can be improved by switching to better models

## ⚙️ Disable AI Analysis

To use rule-based analysis only:

```env
USE_AI_CONTRACT_ANALYSIS=false
# Or simply don't set the variable
```

The system will automatically fall back to rule-based analysis.

