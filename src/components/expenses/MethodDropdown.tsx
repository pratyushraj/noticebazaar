import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const PAYMENT_METHODS = [
  'UPI',
  'Bank Transfer',
  'Cash',
  'Card'
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];

interface MethodDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export const MethodDropdown: React.FC<MethodDropdownProps> = ({
  value,
  onValueChange,
  disabled,
  error,
}) => {
  return (
    <div>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger 
          className={cn(
            "bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
            "text-white placeholder:text-white/40",
            "px-4 py-3",
            "focus:border-white/30 focus:ring-2 focus:ring-white/20",
            error && "border-red-400/50 focus:border-red-400"
          )}
        >
          <SelectValue placeholder="Select payment method" />
        </SelectTrigger>
        <SelectContent className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white">
          {PAYMENT_METHODS.map((method) => (
            <SelectItem 
              key={method} 
              value={method.toLowerCase().replace(' ', '_')} 
              className="hover:bg-white/10 focus:bg-white/10"
            >
              {method}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

