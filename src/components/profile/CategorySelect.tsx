

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CategorySelectProps {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const CATEGORIES = [
  'Fashion',
  'Tech',
  'Fitness',
  'Finance',
  'Beauty',
  'Comedy',
  'Gaming',
  'Food',
  'Education',
  'Travel',
  'Lifestyle',
] as const;

const CategorySelect: React.FC<CategorySelectProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="category" className="text-foreground">Creator Category</Label>
      <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="category" className="bg-[#0F121A] text-foreground border-border">
          <SelectValue placeholder="Select your category" />
        </SelectTrigger>
        <SelectContent className="bg-[#0F121A] text-foreground border-border">
          {CATEGORIES.map((category) => (
            <SelectItem key={category} value={category} className="hover:bg-secondary/50">
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategorySelect;

