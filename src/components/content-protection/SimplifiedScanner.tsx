"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Settings, Link, Upload, Instagram, Youtube, Music, Facebook, Twitter, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface SimplifiedScannerProps {
  onScan: (query: string, platforms: string[]) => void;
  isScanning?: boolean;
}

const PLATFORMS = [
  { id: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { id: 'YouTube', icon: Youtube, color: 'text-red-500' },
  { id: 'TikTok', icon: Music, color: 'text-black dark:text-white' },
  { id: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { id: 'Twitter', icon: Twitter, color: 'text-sky-500' },
  { id: 'Pinterest', icon: ImageIcon, color: 'text-red-600' },
];

const SimplifiedScanner: React.FC<SimplifiedScannerProps> = ({
  onScan,
  isScanning = false,
}) => {
  const [query, setQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Instagram', 'YouTube', 'TikTok']);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds 5MB limit. Please upload a smaller file.`);
      return false;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload an image or video file.');
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        // Handle file upload
        // In a real app, you'd upload the file and get a URL
        toast.info('File upload feature coming soon!');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        // Handle file upload
        toast.info('File upload feature coming soon!');
      }
      // Reset input to allow selecting the same file again
      e.target.value = '';
    }
  };

  const handleScan = () => {
    if (!query.trim()) {
      toast.error('Please enter a URL or content description');
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }
    onScan(query, selectedPlatforms);
  };

  return (
    <Card className="bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Scan for Stolen Content</h2>
        </div>

        {/* Input Area */}
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-6 mb-4 transition-all",
            isDragging
              ? "border-purple-400 bg-purple-500/10"
              : "border-white/10 hover:border-purple-400/50 bg-white/5"
          )}
        >
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-2 w-full">
              <Link className="w-5 h-5 text-white/60" />
              <Input
                type="text"
                placeholder="Paste any link or upload content"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                disabled={isScanning}
              />
            </div>
            <div className="text-sm text-white/60 text-center">
              Or drag & drop image/video here
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Upload file for content scanning"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </div>
        </div>

        {/* AI Detection Info */}
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-white/60">
            🤖 AI will auto-detect: Platform, Content Type
          </p>
        </div>

        {/* Platform Selection */}
        <div className="mb-4">
          <label className="text-sm font-medium text-white mb-2 block">
            Scan Platforms:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const isSelected = selectedPlatforms.includes(platform.id);
              
              return (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  disabled={isScanning}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border transition-all",
                    isSelected
                      ? "bg-purple-500/20 border-purple-400 text-white"
                      : "bg-white/5 border-white/10 hover:border-purple-400/50 text-white/60 hover:bg-white/10"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isSelected ? platform.color : "text-white/60")} />
                  <span className="text-sm font-medium">{platform.id}</span>
                  {isSelected && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleScan}
            disabled={isScanning || !query.trim() || selectedPlatforms.length === 0}
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Start Scan
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            disabled={isScanning}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <Settings className="w-4 h-4 mr-2" />
            Advanced
          </Button>
        </div>

        {/* Advanced Options */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-white/5"
            >
              <p className="text-sm text-white/60 mb-2">Advanced options coming soon...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default SimplifiedScanner;

