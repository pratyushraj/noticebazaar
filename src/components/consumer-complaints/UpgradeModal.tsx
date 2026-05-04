

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle2, Sparkles } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/upgrade?source=consumer-complaints');
  };

  const features = [
    'Unlimited creator filing',
    'Faster legal resolutions',
    'Priority legal support',
    'Full Legal Shield protection',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800 text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl font-bold">
              Legal Shield is a Creator Pro benefit
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-300 text-base">
            Get unlimited creator filing, faster legal resolutions, and priority support.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              What you'll get:
            </p>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Maybe later
          </Button>
          <Button
            onClick={handleUpgrade}
            className="bg-primary hover:bg-primary text-foreground flex-1 sm:flex-initial"
          >
            Upgrade to Creator Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
















