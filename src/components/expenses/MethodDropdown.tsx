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
            "bg-secondary/50 border border-border rounded-xl backdrop-blur-xl",
            "text-foreground placeholder:text-foreground/40",
            "px-4 py-3",
            "focus:border-border focus:ring-2 focus:ring-white/20",
            error && "border-destructive/50 focus:border-destructive"
          )}
        >
          <SelectValue placeholder="Select payment method" />
        </SelectTrigger>
        <SelectContent className="bg-secondary/50 backdrop-blur-xl border border-border rounded-xl text-foreground">
          {PAYMENT_METHODS.map((method) => (
            <SelectItem 
              key={method} 
              value={method.toLowerCase().replace(' ', '_')} 
              className="hover:bg-secondary/50 focus:bg-secondary/50"
            >
              {method}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-destructive text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

