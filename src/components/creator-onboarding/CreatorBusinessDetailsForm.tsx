"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, FileText, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { Profile } from '@/types';

interface CreatorBusinessDetailsFormProps {
  initialData: Profile;
  onSaveSuccess: () => void;
  onClose?: () => void; // Optional for wizard flow
}

const BUSINESS_ENTITY_TYPES = ['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'HUF', 'Other'];

const CreatorBusinessDetailsForm = ({ initialData, onSaveSuccess, onClose }: CreatorBusinessDetailsFormProps) => {
  const { profile } = useSession();
  const [businessName, setBusinessName] = useState(initialData.business_name || '');
  const [businessEntityType, setBusinessEntityType] = useState(initialData.business_entity_type || '');
  const [gstin, setGstin] = useState(initialData.gstin || '');
  const [pan, setPan] = useState(initialData.pan || '');

  const updateProfileMutation = useUpdateProfile();

  useEffect(() => {
    setBusinessName(initialData.business_name || '');
    setBusinessEntityType(initialData.business_entity_type || '');
    setGstin(initialData.gstin || '');
    setPan(initialData.pan || '');
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id) {
      toast.error('Creator profile not found. Cannot save business details.');
      return;
    }

    if (!businessName.trim() || !businessEntityType.trim()) {
      toast.error('Business Name and Entity Type are required.');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        id: profile.id,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        avatar_url: profile.avatar_url || null,
        business_name: businessName.trim(),
        business_entity_type: businessEntityType,
        gstin: gstin.trim() || null,
        pan: pan.trim() || null,
      });
      toast.success('Business details saved successfully!');
      onSaveSuccess();
    } catch (error: any) {
      toast.error('Failed to save business details', { description: error.message });
    }
  };

  const isSubmitting = updateProfileMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="businessName">Business Name *</Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., Your Brand Name"
            className="pl-9"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="businessEntityType">Business Entity Type *</Label>
        <Select onValueChange={setBusinessEntityType} value={businessEntityType} disabled={isSubmitting}>
          <SelectTrigger id="businessEntityType">
            <SelectValue placeholder="Select entity type" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_ENTITY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="gstin">GSTIN (Optional)</Label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="gstin"
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., 27ABCDE1234F1Z5"
            className="pl-9"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="pan">PAN (Optional)</Label>
        <div className="relative">
          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="pan"
            value={pan}
            onChange={(e) => setPan(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., ABCDE1234F"
            className="pl-9"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !businessName.trim() || !businessEntityType.trim()}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            'Save & Continue'
          )}
        </Button>
      </div>
    </form>
  );
};

export default CreatorBusinessDetailsForm;