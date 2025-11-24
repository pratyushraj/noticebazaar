"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SmartInboxZeroProps {
  onSendMessage?: (message: string) => void;
}

export const SmartInboxZero: React.FC<SmartInboxZeroProps> = ({ onSendMessage }) => {
  return (
    <div className="h-full min-h-[calc(100vh-400px)] md:min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 max-w-md"
      >
        {/* Sleeping AI Advisor Illustration */}
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative w-32 h-32 mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-2xl" />
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="text-8xl">😴</div>
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-6 h-6 text-purple-400" />
            </motion.div>
          </div>
        </motion.div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">All quiet — go create!</h3>
          <p className="text-sm text-white/60">
            Your AI advisor is resting peacefully. No urgent messages or action items.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => onSendMessage?.("Hi! I have a question about my contracts.")}
            className="bg-white/10 border border-white/20 text-white hover:bg-white/20"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Start a conversation
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SmartInboxZero;

