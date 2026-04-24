

import { motion } from 'framer-motion';
import { Sparkles, Shield, CreditCard, Briefcase, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeScreenProps {
  onNext: () => void;
  userName?: string;
}

const WelcomeScreen = ({ onNext, userName }: WelcomeScreenProps) => {
  const features = [
    {
      icon: Briefcase,
      title: 'Track Brand Deals',
      description: 'Manage all your partnerships in one place',
      color: 'text-info'
    },
    {
      icon: CreditCard,
      title: 'Payment Management',
      description: 'Never miss a payment with smart reminders',
      color: 'text-green-400'
    },
    {
      icon: Shield,
      title: 'Content Protection',
      description: 'Register and protect your original content',
      color: 'text-secondary'
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto text-center space-y-8"
    >
      {/* Welcome Header */}
      <div className="space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg"
        >
          <Sparkles className="w-10 h-10 text-foreground" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl font-bold text-foreground"
        >
          Welcome{userName ? `, ${userName}` : ''}! 👋
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-secondary max-w-lg mx-auto"
        >
          Let's set up your Creator Armour account in just 2 minutes
        </motion.p>
      </div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid md:grid-cols-3 gap-6 mt-12"
      >
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-border hover:bg-secondary/15 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto ${feature.color === 'text-info' ? 'bg-gradient-to-br from-blue-500/20 to-blue-400/10' :
                feature.color === 'text-green-400' ? 'bg-gradient-to-br from-green-500/20 to-green-400/10' :
                  'bg-gradient-to-br from-purple-500/20 to-purple-400/10'
                }`}>
                <Icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-secondary">{feature.description}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="pt-8"
      >
        <Button
          onClick={onNext}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-foreground px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          Get Started
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        <p className="text-sm text-secondary mt-4">
          Takes less than 2 minutes • No credit card required
        </p>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeScreen;

