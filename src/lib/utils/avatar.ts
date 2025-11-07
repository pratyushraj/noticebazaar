export const getInitials = (firstName: string | null, lastName: string | null) => {
  const firstInitial = firstName ? firstName.charAt(0) : '';
  const lastInitial = lastName ? lastName.charAt(0) : '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

export const generateAvatarUrl = (firstName: string | null, lastName: string | null) => {
  const seed = `${firstName || ''} ${lastName || ''}`.trim().replace(/\s+/g, '+');
  if (!seed) return DEFAULT_AVATAR_URL;
  // Use a consistent, professional color scheme for generated avatars
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=3b82f6&backgroundType=solid&fontFamily=sans`;
};

export const DEFAULT_AVATAR_URL = 'https://api.dicebear.com/7.x/initials/svg?seed=default';