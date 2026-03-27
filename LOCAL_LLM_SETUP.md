# Local LLM Setup for AI Email Composer

The AI Email Composer uses a local LLM (default: Ollama) to help creators write professional emails to brands.

## Quick Setup (Ollama)

### 1. Install Ollama

**macOS:**
```bash
brew install ollama
# or download from https://ollama.ai
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download from https://ollama.ai/download

### 2. Start Ollama

```bash
ollama serve
```

This starts the Ollama server on `http://localhost:11434`

### 3. Download a Model

```bash
# Recommended models (choose one):
ollama pull llama3.2        # Fast, good quality (recommended)
ollama pull mistral         # Alternative option
ollama pull phi3            # Smaller, faster
ollama pull gemma2          # Google's model
```

### 4. Configure Environment (Optional)

Create a `.env.local` file:

```env
# Local LLM Configuration
VITE_LOCAL_LLM_ENDPOINT=http://localhost:11434/api/generate
VITE_LOCAL_LLM_MODEL=llama3.2
```

If not set, defaults to:
- Endpoint: `http://localhost:11434/api/generate`
- Model: `llama3.2`

## Usage

1. **Start Ollama**: `ollama serve`
2. **Open Message Brand Modal**: Click "Message Brand" on any deal
3. **Click "AI Assistant"**: Toggle AI features
4. **Select Tone**: Professional, Friendly, Formal, or Casual
5. **Generate**: Click "Generate" for a full email, or "Improve" to enhance existing text
6. **Quick Add**: Use quick buttons for greetings, questions, or closings

## Features

- ✅ **Full Email Generation**: Creates complete professional emails
- ✅ **Email Improvement**: Enhances your existing draft
- ✅ **Tone Selection**: Professional, Friendly, Formal, or Casual
- ✅ **Quick Suggestions**: One-click greetings, questions, closings
- ✅ **Fallback Templates**: Works even if LLM is unavailable
- ✅ **Privacy**: All processing happens locally, no data sent to external APIs

## Troubleshooting

### "Failed to generate email" Error

1. **Check if Ollama is running:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Verify model is downloaded:**
   ```bash
   ollama list
   ```

3. **Test the model:**
   ```bash
   ollama run llama3.2 "Write a professional email"
   ```

### Change Default Model

Edit `.env.local`:
```env
VITE_LOCAL_LLM_MODEL=mistral
```

### Use Different LLM Service

If you're using a different local LLM service, update the endpoint:

```env
VITE_LOCAL_LLM_ENDPOINT=http://localhost:8000/v1/completions
```

The hook expects a response in this format:
```json
{
  "response": "generated text",
  // or
  "text": "generated text"
}
```

## Alternative: Browser-Based LLM

For a fully client-side solution (no server required), you can use Transformers.js:

1. Install: `npm install @xenova/transformers`
2. Update `useLocalLLM.ts` to use Transformers.js instead of Ollama API
3. Models run directly in the browser (slower but more private)

## Performance Tips

- **Smaller models** (phi3, gemma2) are faster but less capable
- **Larger models** (llama3.2, mistral) are slower but better quality
- **GPU acceleration** significantly improves speed (if available)
- **Model quantization** reduces memory usage

## Privacy & Security

- ✅ All processing happens locally
- ✅ No data sent to external services
- ✅ No API keys required
- ✅ Works offline (after initial model download)

