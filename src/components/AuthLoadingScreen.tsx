"use client";

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const AuthLoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center space-y-6 text-center px-4"
      >
        {/* Animated Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <Loader2 className="w-12 h-12 text-purple-300" />
        </motion.div>

        {/* Primary Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">
            Loading your workspace…
          </h2>
          <p className="text-sm text-purple-200 max-w-md">
            Setting up your deals, messages, and protections
          </p>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-xs text-purple-300/60 mt-8"
        >
          Powered by CreatorArmour · Secure Legal Workspace
        </motion.p>
      </motion.div>
    </div>
  );
};

export default AuthLoadingScreen;

