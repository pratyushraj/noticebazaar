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
            "bg-secondary/50 border border-border rounded-xl backdrop-blur-xl",
            "text-foreground placeholder:text-foreground/40",
            "px-4 py-3",
            "focus:border-border focus:ring-2 focus:ring-white/20",
            error && "border-destructive/50 focus:border-destructive"
          )}
        >
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent className="bg-secondary/50 backdrop-blur-xl border border-border rounded-xl text-foreground">
          {EXPENSE_CATEGORIES.map((cat) => (
            <SelectItem 
              key={cat} 
              value={cat} 
              className="hover:bg-secondary/50 focus:bg-secondary/50"
            >
              {cat}
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

