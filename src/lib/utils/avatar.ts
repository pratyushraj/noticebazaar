export const getInitials = (firstName: string | null, lastName: string | null) => {
  const firstInitial = firstName ? firstName.charAt(0) : '';
  const lastInitial = lastName ? lastName.charAt(0) : '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

export const generateAvatarUrl = (firstName: string | null, lastName: string | null) => {
  const seed = `${firstName || ''} ${lastName || ''}`.trim();
  if (!seed) return DEFAULT_AVATAR_URL;
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=8a3cff`;
};

export const DEFAULT_AVATAR_URL = 'https://api.dicebear.com/7.x/initials/svg?seed=default&backgroundColor=8a3cff';
