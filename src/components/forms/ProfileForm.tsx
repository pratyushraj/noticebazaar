"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Profile } from '@/types';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar'; // Import DEFAULT_AVATAR_URL
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfileFormProps {
  initialProfile: Profile;
  onSaveSuccess?: () => void;
  isAdminView?: boolean;
}

const ProfileForm = ({ initialProfile, onSaveSuccess, isAdminView = false }: ProfileFormProps) => {
  const [firstName, setFirstName] = useState(initialProfile.first_name || '');
  const [lastName, setLastName] = useState(initialProfile.last_name || '');
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url || '');
  const [role, setRole] = useState<'client' | 'admin' | 'chartered_accountant' | 'creator'>(initialProfile.role); // Updated role type

  const updateProfileMutation = useUpdateProfile();

  useEffect(() => {
    setFirstName(initialProfile.first_name || '');
    setLastName(initialProfile.last_name || '');
    setAvatarUrl(initialProfile.avatar_url || '');
    setRole(initialProfile.role);
  }, [initialProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First Name and Last Name are required.');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        id: initialProfile.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        avatar_url: avatarUrl.trim() || null,
        role: role, // Include role in the update
      });
      toast.success('Profile updated successfully!');
      onSaveSuccess?.();
    } catch (error: any) {
      toast.error('Failed to update profile', { description: error.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center space-y-4 mb-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarUrl || DEFAULT_AVATAR_URL} alt={`${firstName} ${lastName}`} />
          <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
            {getInitials(firstName, lastName)}
          </AvatarFallback>
        </Avatar>
        {isAdminView && <p className="text-sm text-muted-foreground">Email: {initialProfile.email}</p>} {/* Display email for admin view */}
        {isAdminView && <p className="text-sm text-muted-foreground">Current Role: {initialProfile.role}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName" className="text-foreground">First Name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={updateProfileMutation.isPending}
            className="bg-input text-foreground border-border"
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={updateProfileMutation.isPending}
            className="bg-input text-foreground border-border"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="avatarUrl" className="text-foreground">Avatar URL (Optional)</Label>
        <Input
          id="avatarUrl"
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="Enter URL for your profile picture"
          disabled={updateProfileMutation.isPending}
          className="bg-input text-foreground border-border"
        />
      </div>
      {isAdminView && (
        <div>
          <Label htmlFor="role" className="text-foreground">Role</Label>
          <Select onValueChange={(value: 'client' | 'admin' | 'chartered_accountant' | 'creator') => setRole(value)} value={role} disabled={updateProfileMutation.isPending}>
            <SelectTrigger id="role" className="bg-input text-foreground border-border">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground border-border">
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="chartered_accountant">Chartered Accountant</SelectItem>
              <SelectItem value="creator">Creator</SelectItem> {/* New: Creator role */}
            </SelectContent>
          </Select>
        </div>
      )}
      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={updateProfileMutation.isPending}>
        {updateProfileMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  );
};

export default ProfileForm;