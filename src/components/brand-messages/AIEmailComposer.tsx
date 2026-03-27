import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, X, Zap, FileText, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLocalLLM } from '@/lib/hooks/useLocalLLM';
import { cn } from '@/lib/utils';

interface AIEmailComposerProps {
  value: string;
  onChange: (value: string) => void;
  brandName: string;
  dealTitle?: string;
  purpose?: 'deliverable_question' | 'payment_question' | 'general' | 'follow_up';
  disabled?: boolean;
  className?: string;
}

export const AIEmailComposer: React.FC<AIEmailComposerProps> = ({
  value,
  onChange,
  brandName,
  dealTitle,
  purpose = 'general',
  disabled = false,
  className,
}) => {
  const [tone] = useState<'professional' | 'friendly' | 'formal' | 'casual'>('professional');
  const { generateEmail, generateEmailSuggestion, isGenerating, error, provider } = useLocalLLM();

  const handleError = (err: any, action: string) => {
    const errorMsg = err.message || `Failed to ${action}`;
    if (errorMsg.includes('API key') || errorMsg.includes('key required')) {
      toast.error('API Key Required', {
        description: `Please add your ${provider === 'groq' ? 'Groq' : provider} API key to .env.local. See FREE_LLM_API_KEYS.md for setup.`,
        duration: 6000,
      });
    } else if (errorMsg.includes('Failed to fetch') || errorMsg.includes('network')) {
      toast.error('Network Error', {
        description: 'Could not connect to the AI service. Please check your internet connection.',
      });
    } else {
      toast.error(`Failed to ${action}`, {
        description: errorMsg,
        duration: 5000,
      });
    }
  };

  const handleGenerateAIEmail = async () => {
    try {
      const generated = await generateEmail({
        brandName,
        dealTitle,
        context: value || undefined,
        tone,
        purpose,
      });
      onChange(generated);
      toast.success('Email generated!', {
        description: 'Review and edit as needed.',
      });
    } catch (err: any) {
      handleError(err, 'generate email');
    }
  };

  const handleImprove = async () => {
    if (!value.trim()) {
      toast.error('Please enter some text first', {
        description: 'Write a message in the text area, then click Improve.',
      });
      return;
    }

    try {
      const improved = await generateEmailSuggestion(value, {
        brandName,
        dealTitle,
        tone,
        purpose,
      });
      onChange(improved);
      toast.success('Email improved!', {
        description: 'Review the enhanced version.',
      });
    } catch (err: any) {
      handleError(err, 'improve email');
    }
  };

  const handleShorten = async () => {
    if (!value.trim()) {
      toast.error('Please enter some text first', {
        description: 'Write a message in the text area, then click Shorten.',
      });
      return;
    }

    try {
      // Create a prompt to shorten the text
      const shortenPrompt = `Shorten the following message while keeping all important information and maintaining a ${tone} tone. Make it more concise and to the point:\n\n${value}`;
      
      const shortened = await generateEmail({
        brandName,
        dealTitle,
        context: shortenPrompt,
        tone,
        purpose,
      });
      onChange(shortened);
      toast.success('Email shortened!', {
        description: 'Review the concise version.',
      });
    } catch (err: any) {
      handleError(err, 'shorten email');
    }
  };

  const handleExpand = async () => {
    if (!value.trim()) {
      toast.error('Please enter some text first', {
        description: 'Write a message in the text area, then click Expand.',
      });
      return;
    }

    try {
      // Create a prompt to expand the text
      const expandPrompt = `Expand the following message with more details, context, and clarity while maintaining a ${tone} tone. Add relevant information about ${brandName}${dealTitle ? ` and the deal: ${dealTitle}` : ''}:\n\n${value}`;
      
      const expanded = await generateEmail({
        brandName,
        dealTitle,
        context: expandPrompt,
        tone,
        purpose,
      });
      onChange(expanded);
      toast.success('Email expanded!', {
        description: 'Review the detailed version.',
      });
    } catch (err: any) {
      handleError(err, 'expand email');
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Generate AI Email Button */}
      <div className="space-y-1.5">
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={handleGenerateAIEmail}
          disabled={disabled || isGenerating}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 h-11"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating AI Email...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate AI Email
            </>
          )}
        </Button>
        <p className="text-xs text-purple-300/70 px-1">
          Creates a ready-to-send email using AI
        </p>
      </div>

      {/* Writing Tools Section */}
      <div className="space-y-2">
        <p className="text-xs text-purple-300/80 font-medium">Writing Tools</p>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleImprove}
            disabled={disabled || isGenerating || !value.trim()}
            className="bg-white/5 border-white/20 text-purple-200 hover:bg-white/10 hover:border-purple-400/40 hover:text-purple-100 transition-all h-9 text-xs"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ...
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 mr-1" />
                Improve
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShorten}
            disabled={disabled || isGenerating || !value.trim()}
            className="bg-white/5 border-white/20 text-purple-200 hover:bg-white/10 hover:border-purple-400/40 hover:text-purple-100 transition-all h-9 text-xs"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ...
              </>
            ) : (
              <>
                <FileText className="w-3 h-3 mr-1" />
                Shorten
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExpand}
            disabled={disabled || isGenerating || !value.trim()}
            className="bg-white/5 border-white/20 text-purple-200 hover:bg-white/10 hover:border-purple-400/40 hover:text-purple-100 transition-all h-9 text-xs"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ...
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3 mr-1" />
                Expand
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-xs text-red-300">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-semibold mb-1">Error generating email</p>
              <p className="text-red-300/80">{error}</p>
              {error.includes('API key') && (
                <p className="mt-2 text-red-300/70">
                  💡 Get a free API key: <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="underline">console.groq.com</a>
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              className="h-5 w-5 p-0 text-red-300 hover:text-red-200 flex-shrink-0"
              title="Reload page"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};

