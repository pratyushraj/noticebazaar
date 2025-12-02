# Free Online LLM Setup for AI Email Composer

The AI Email Composer now supports multiple **free online LLM providers**. No need to install anything locally!

## 🎯 Recommended: Hugging Face (No API Key Needed!)

**Best for:** Getting started quickly, no setup required

1. **No configuration needed!** It works out of the box.
2. The default is already set to Hugging Face.
3. Just use the AI composer - it will work immediately.

**Models available:**
- `mistralai/Mistral-7B-Instruct-v0.2` (default)
- `meta-llama/Llama-2-7b-chat-hf`
- `google/flan-t5-large`

## ⚡ Alternative: Groq (Fastest, Free API Key)

**Best for:** Speed and performance

1. Sign up at https://console.groq.com (free)
2. Get your API key
3. Add to `.env.local`:

```env
VITE_LLM_PROVIDER=groq
VITE_LLM_MODEL=llama-3.1-8b-instant
VITE_LLM_API_KEY=your_groq_api_key_here
```

**Free models:**
- `llama-3.1-8b-instant` (fastest)
- `mixtral-8x7b-32768` (more capable)

## 🤖 Together AI (Free Tier)

**Best for:** High-quality responses

1. Sign up at https://together.ai (free tier available)
2. Get your API key
3. Add to `.env.local`:

```env
VITE_LLM_PROVIDER=together
VITE_LLM_MODEL=mistralai/Mixtral-8x7B-Instruct-v0.1
VITE_LLM_API_KEY=your_together_api_key_here
```

## 🔑 OpenAI (Limited Free Tier)

**Best for:** Best quality (but limited free usage)

1. Get API key from https://platform.openai.com
2. Add to `.env.local`:

```env
VITE_LLM_PROVIDER=openai
VITE_LLM_MODEL=gpt-3.5-turbo
VITE_LLM_API_KEY=your_openai_api_key_here
```

## 💻 Local: Ollama (Optional)

If you prefer local processing:

1. Install Ollama: `brew install ollama` (macOS) or download from https://ollama.ai
2. Start: `ollama serve`
3. Download model: `ollama pull llama3.2`
4. Add to `.env.local`:

```env
VITE_LLM_PROVIDER=ollama
VITE_LLM_MODEL=llama3.2
```

## 📝 Environment Configuration

Create `.env.local` in your project root:

```env
# Choose your provider (default: huggingface)
VITE_LLM_PROVIDER=huggingface

# Model name (varies by provider)
VITE_LLM_MODEL=mistralai/Mistral-7B-Instruct-v0.2

# API key (only needed for groq, together, openai)
VITE_LLM_API_KEY=your_api_key_here
```

## 🚀 Quick Start (No Setup!)

**Just use it!** The default Hugging Face provider works immediately:

1. Open "Message Brand" modal
2. Click "AI Assistant"
3. Click "Generate" or "Improve"
4. Done! ✨

## 📊 Provider Comparison

| Provider | Speed | Quality | Setup | Free Tier |
|----------|-------|---------|-------|-----------|
| Hugging Face | Medium | Good | None | ✅ Unlimited |
| Groq | ⚡ Fastest | Good | API Key | ✅ Generous |
| Together AI | Fast | Excellent | API Key | ✅ Generous |
| OpenAI | Fast | Best | API Key | ⚠️ Limited |
| Ollama | Medium | Good | Install | ✅ Unlimited |

## 🎨 Usage Tips

1. **Start with Hugging Face** - No setup, works immediately
2. **Upgrade to Groq** - If you want faster responses (free API key)
3. **Use Together AI** - For best quality (free tier available)
4. **Try different tones** - Professional, Friendly, Formal, Casual
5. **Use "Improve"** - Enhance your existing draft
6. **Quick suggestions** - One-click greetings, questions, closings

## 🔧 Troubleshooting

### "Failed to generate email" Error

**Hugging Face:**
- Model might be loading (first request takes ~30 seconds)
- Try again after a few seconds
- Some models require API key for rate limits (optional)

**Groq/Together/OpenAI:**
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
- **Together AI**: Generous free tier
- **OpenAI**: Limited free tier

## 🎉 That's It!

The AI Email Composer is ready to use with free online LLMs. No installation, no local setup - just works! 🚀

