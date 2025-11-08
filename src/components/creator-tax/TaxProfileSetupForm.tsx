"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, FileText, IndianRupee, Percent, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { DialogFooter } from '@/components/ui/dialog';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { useUpsertTaxSettings } from '@/lib/hooks/useTaxSettings';
import { Profile, TaxSetting } from '@/types';

interface TaxProfileSetupFormProps {
  initialProfile: Profile;
  initialTaxSettings: TaxSetting | null;
  onSaveSuccess: () => void;
  onClose: () => void;
}

const BUSINESS_ENTITY_TYPES = ['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'HUF', 'Other'];
const ITR_SLABS = [
  { value: 'basic', label: 'Basic (Standard Deductions)' },
  { value: 'high', label: 'High (Complex Deductions)' },
];

const TaxProfileSetupForm: React.FC<TaxProfileSetupFormProps> = ({ initialProfile, initialTaxSettings, onSaveSuccess, onClose }) => {
  const { profile } = useSession();
  
  // Profile States
  const [businessName, setBusinessName] = useState(initialProfile.business_name || '');
  const [businessEntityType, setBusinessEntityType] = useState(initialProfile.business_entity_type || '');
  const [gstin, setGstin] = useState(initialProfile.gstin || '');
  const [pan, setPan] = useState(initialProfile.pan || '');

  // Tax Setting States
  const [gstRate, setGstRate] = useState(initialTaxSettings?.gst_rate ? (initialTaxSettings.gst_rate * 100).toString() : '18');
  const [tdsRate, setTdsRate] = useState(initialTaxSettings?.tds_rate ? (initialTaxSettings.tds_rate * 100).toString() : '10');
  const [itrSlab, setItrSlab] = useState(initialTaxSettings?.itr_slab || 'basic');

  const updateProfileMutation = useUpdateProfile();
  const upsertTaxSettingsMutation = useUpsertTaxSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id) {
      toast.error('User profile not found. Cannot save settings.');
      return;
    }

    if (!businessName.trim() || !businessEntityType.trim() || !pan.trim()) {
      toast.error('Business Name, Entity Type, and PAN are required for tax setup.');
      return;
    }

    const gst = parseFloat(gstRate) / 100;
    const tds = parseFloat(tdsRate) / 100;

    if (isNaN(gst) || isNaN(tds) || gst < 0 || tds < 0) {
      toast.error('Please enter valid percentage rates for GST and TDS.');
      return;
    }

    try {
      // 1. Update Profile (Business Identity)
      await updateProfileMutation.mutateAsync({
        id: profile.id,
        first_name: initialProfile.first_name || '',
        last_name: initialProfile.last_name || '',
        avatar_url: initialProfile.avatar_url || null,
        business_name: businessName.trim(),
        business_entity_type: businessEntityType,
        gstin: gstin.trim() || null,
        pan: pan.trim(),
      });

      // 2. Upsert Tax Settings (Rates/Slabs)
      await upsertTaxSettingsMutation.mutateAsync({
        creator_id: profile.id,
        gst_rate: gst,
        tds_rate: tds,
        itr_slab: itrSlab,
      });
      
      toast.success('Tax Profile Setup complete!');
      onSaveSuccess();
      onClose();
    } catch (error: any) {
      toast.error('Failed to save tax profile', { description: error.message });
    }
  };

  const isSubmitting = updateProfileMutation.isPending || upsertTaxSettingsMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4 border-b border-border pb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center"><Building2 className="h-4 w-4 mr-2" /> Business Identity</h3>
        <div>
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., Your Brand Name"
          />
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
          <Label htmlFor="pan">PAN (Permanent Account Number) *</Label>
          <Input
            id="pan"
            value={pan}
            onChange={(e) => setPan(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., ABCDE1234F"
          />
        </div>
        <div>
          <Label htmlFor="gstin">GSTIN (Optional)</Label>
          <Input
            id="gstin"
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.e., 27ABCDE1234F1Z5"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center"><Scale className="h-4 w-4 mr-2" /> Estimated Tax Rates</h3>
        <div>
          <Label htmlFor="gstRate">Estimated GST Rate (%)</Label>
          <div className="relative">
            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="gstRate"
              type="number"
              value={gstRate}
              onChange={(e) => setGstRate(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g., 18"
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="tdsRate">Estimated TDS Rate (%)</Label>
          <div className="relative">
            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="tdsRate"
              type="number"
              value={tdsRate}
              onChange={(e) => setTdsRate(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g., 10"
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="itrSlab">ITR Complexity / Expected Deductions</Label>
          <Select onValueChange={setItrSlab} value={itrSlab} disabled={isSubmitting}>
            <SelectTrigger id="itrSlab">
              <SelectValue placeholder="Select complexity" />
            </SelectTrigger>
            <SelectContent>
              {ITR_SLABS.map((slab) => (
                <SelectItem key={slab.value} value={slab.value}>{slab.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !businessName.trim() || !businessEntityType.trim() || !pan.trim()}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            'Save Tax Profile'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default TaxProfileSetupForm;