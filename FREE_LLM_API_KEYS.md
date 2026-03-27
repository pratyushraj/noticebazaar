# Free LLM API Keys Setup

Hugging Face now requires an API key. Here are the **best free alternatives**:

## 🚀 Recommended: Groq (Fastest & Free)

**Why Groq?**
- ⚡ **Fastest** responses (GPU-accelerated)
- ✅ **Generous free tier** (30 requests/minute)
- 🎯 **No credit card** required
- 🔒 **Secure** and reliable

**Setup:**
1. Sign up at https://console.groq.com (free)
2. Go to **API Keys** section
3. Create a new API key
4. Add to `.env.local`:
   ```env
   VITE_LLM_PROVIDER=groq
   VITE_LLM_MODEL=llama-3.1-8b-instant
   VITE_LLM_API_KEY=your_groq_api_key_here
   ```

**Free Models:**
- `llama-3.1-8b-instant` (fastest, recommended)
- `mixtral-8x7b-32768` (more capable)

## 🤗 Alternative: Hugging Face (Now Requires API Key)

**Setup:**
1. Sign up at https://huggingface.co (free)
2. Go to **Settings** → **Access Tokens**
3. Create a new token (read permission)
4. Add to `.env.local`:
   ```env
   VITE_LLM_PROVIDER=huggingface
   VITE_LLM_MODEL=mistralai/Mistral-7B-Instruct-v0.2
   VITE_LLM_API_KEY=your_hf_token_here
   ```

## 🤖 Together AI (Also Free)

**Setup:**
1. Sign up at https://together.ai (free tier available)
2. Get your API key
3. Add to `.env.local`:
   ```env
   VITE_LLM_PROVIDER=together
   VITE_LLM_MODEL=mistralai/Mixtral-8x7B-Instruct-v0.1
   VITE_LLM_API_KEY=your_together_key_here
   ```

## 💻 Local: Ollama (No API Key Needed)

If you prefer local processing:

1. Install: `brew install ollama` (macOS)
2. Start: `ollama serve`
3. Download: `ollama pull llama3.2`
4. Add to `.env.local`:
   ```env
   VITE_LLM_PROVIDER=ollama
   VITE_LLM_MODEL=llama3.2
   ```

## 📝 Quick Start (Groq - Recommended)

1. **Get free API key**: https://console.groq.com
2. **Add to `.env.local`**:
   ```env
   VITE_LLM_PROVIDER=groq
   VITE_LLM_API_KEY=your_key_here
   ```
3. **Done!** The AI composer will work immediately.

## 🎯 Why Groq is Best

- ✅ **No setup complexity** - just API key
- ✅ **Fastest responses** - GPU-powered
- ✅ **Free tier** - 30 req/min (plenty for email generation)
- ✅ **No credit card** - truly free
- ✅ **Reliable** - enterprise-grade infrastructure

The default is now set to Groq. Just add your free API key and you're ready to go! 🚀

