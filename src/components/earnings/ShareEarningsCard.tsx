"use client";

import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Download } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface ShareEarningsCardProps {
  earnings: number;
  month: string;
  growth?: number;
}

const ShareEarningsCard: React.FC<ShareEarningsCardProps> = ({
  earnings,
  month,
  growth,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const formatEarnings = (amount: number): string => {
    if (amount >= 100000) {
      const lakhs = (amount / 100000).toFixed(2);
      return `₹${lakhs} Lakh`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const generateShareImage = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0A0E27',
        scale: 2,
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      
      // Create download link
      const link = document.createElement('a');
      link.download = `earnings-${month.toLowerCase()}-${new Date().getFullYear()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('Earnings card downloaded! Share it on Instagram Stories 🎉');
    } catch (error) {
      toast.error('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0A0E27',
        scale: 2,
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          toast.success('Copied to clipboard! Paste in Instagram Stories 📱');
        }
      });
    } catch (error) {
      toast.error('Failed to copy image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card 
        ref={cardRef}
        className="bg-gradient-to-br from-purple-500/30 via-blue-500/30 to-pink-500/30 backdrop-blur-[40px] border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden relative p-8"
        style={{ width: '400px', height: '600px' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.1] to-transparent pointer-events-none" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white">
          <div className="mb-6">
            <p className="text-sm text-white/60 mb-2">Earnings This Month</p>
            <h2 className="text-5xl font-bold mb-2">{formatEarnings(earnings)}</h2>
            <p className="text-lg text-white/80">{month} {new Date().getFullYear()}</p>
            {growth && growth > 0 && (
              <p className="text-sm text-green-400 mt-2">+{growth}% from last month</p>
            )}
          </div>
          <div className="mt-auto pt-6">
            <p className="text-xs text-white/40">Powered by NoticeBazaar</p>
          </div>
        </div>
      </Card>
      
      <div className="flex gap-3">
        <Button
          onClick={generateShareImage}
          disabled={isGenerating}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button
          onClick={copyToClipboard}
          disabled={isGenerating}
          variant="outline"
          className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Copy
        </Button>
      </div>
    </div>
  );
};

export default ShareEarningsCard;

