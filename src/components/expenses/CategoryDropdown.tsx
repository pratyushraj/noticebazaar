import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const EXPENSE_CATEGORIES = [
  'Software',
  'Equipment',
  'Travel',
  'Food & Beverages',
  'Ads / Marketing',
  'Subscriptions',
  'Team / Freelancers',
  'Other'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

interface CategoryDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  value,
  onValueChange,
  disabled,
  error,
}) => {
  return (
    <div>
      <Select value={value} onValueChange={onValueChange} disabled={disabled} required>
        <SelectTrigger 
          className={cn(
            "bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
            "text-white placeholder:text-white/40",
            "px-4 py-3",
            "focus:border-white/30 focus:ring-2 focus:ring-white/20",
            error && "border-red-400/50 focus:border-red-400"
          )}
        >
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white">
          {EXPENSE_CATEGORIES.map((cat) => (
            <SelectItem 
              key={cat} 
              value={cat} 
              className="hover:bg-white/10 focus:bg-white/10"
            >
              {cat}
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

