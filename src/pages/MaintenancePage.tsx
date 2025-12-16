"use client";

import React from 'react';
import { Wrench, Clock, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

/**
 * Server maintenance page
 * - Shown when backend is under maintenance
 * - Provides status updates and support contact
 * - Auto-refreshes to check when service is restored
 */
export const MaintenancePage: React.FC = () => {
  const [lastChecked, setLastChecked] = React.useState(new Date());
  const [isChecking, setIsChecking] = React.useState(false);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      // Try to ping the API
      const response = await fetch('/api/health', { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        // Service is back online
        window.location.reload();
      } else {
        setLastChecked(new Date());
      }
    } catch (error) {
      // Still in maintenance
      setLastChecked(new Date());
    } finally {
      setIsChecking(false);
    }
  };

  // Auto-check every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      handleCheckStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}
        >
          <Wrench className="w-24 h-24 mx-auto mb-6 text-purple-400" />
        </motion.div>
        
        <h1 className="text-3xl font-bold mb-2">We're Under Maintenance</h1>
        <p className="text-white/70 mb-4">
          We're making some improvements to serve you better. We'll be back shortly.
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm text-purple-300 mb-6">
          <Clock className="w-4 h-4" />
          <span>Expected downtime: 30-60 minutes</span>
        </div>

        <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
          <p className="text-xs text-purple-300 mb-2">Last checked:</p>
          <p className="text-sm text-white/80">
            {lastChecked.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
          >
            {isChecking ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Status
              </>
            )}
          </Button>
          
          <a href="mailto:support@creatorarmour.com?subject=Maintenance Inquiry" className="block">
            <Button variant="outline" className="w-full bg-white/10 text-white hover:bg-white/20 border-white/20">
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </a>
        </div>

        <p className="text-xs text-purple-400 mt-6">
          We'll automatically check for service restoration every 30 seconds.
        </p>
      </motion.div>
    </div>
  );
};

export default MaintenancePage;

