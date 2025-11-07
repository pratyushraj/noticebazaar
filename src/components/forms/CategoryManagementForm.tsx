"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DialogFooter } from '@/components/ui/dialog';
import { Category } from '@/types';
import { useAddCategory, useUpdateCategory } from '@/lib/hooks/useCategories';
import { useSession } from '@/contexts/SessionContext';

interface CategoryManagementFormProps {
  initialCategory?: Category | null;
  onSaveSuccess: () => void;
  onClose: () => void;
}

const CategoryManagementForm = ({ initialCategory, onSaveSuccess, onClose }: CategoryManagementFormProps) => {
  const { profile } = useSession();
  const [categoryName, setCategoryName] = useState(initialCategory?.name || '');

  const addCategoryMutation = useAddCategory();
  const updateCategoryMutation = useUpdateCategory();

  useEffect(() => {
    setCategoryName(initialCategory?.name || '');
  }, [initialCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      toast.error('Category name cannot be empty.');
      return;
    }
    if (!profile?.id) {
      toast.error('User profile not found. Cannot manage categories.');
      return;
    }

    try {
      if (initialCategory) {
        await updateCategoryMutation.mutateAsync({
          id: initialCategory.id,
          name: categoryName.trim(),
          client_id: profile.id,
        });
        toast.success('Category updated successfully!');
      } else {
        await addCategoryMutation.mutateAsync({
          name: categoryName.trim(),
          client_id: profile.id,
        });
        toast.success('Category created successfully!');
      }
      onSaveSuccess();
      onClose();
    } catch (error: any) {
      toast.error('Failed to save category', { description: error.message });
    }
  };

  const isSubmitting = addCategoryMutation.isPending || updateCategoryMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="categoryName">Category Name</Label>
        <Input
          id="categoryName"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          disabled={isSubmitting}
          placeholder="e.g., Tax Documents, Business Licenses"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={!categoryName.trim() || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            'Save Category'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default CategoryManagementForm;