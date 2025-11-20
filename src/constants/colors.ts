// Pink & Cute Color Theme for Creator Dashboard
export const PINK_THEME = {
  primary: {
    gradient: 'from-[#E879F9] via-[#F472B6] to-[#FB7185]',
    gradientSoft: 'from-[#F8BBD9] via-[#FF9EC5] to-[#FF7BB3]',
    solid: '#FF6B9D',
    light: '#FF8FAB',
    lighter: '#FFB3C1',
  },
  background: {
    dark: 'from-[#1A0F1F] via-[#2D1B2E] to-[#3D2A3F]',
    card: '#2A1F2E',
    cardHover: '#3D2A3F',
    border: '#4A3A4F',
    borderLight: '#5A4A5F',
  },
  accents: {
    pink: '#FF6B9D',
    softPink: '#FF8FAB',
    lightPink: '#FFB3C1',
    purple: '#E879F9',
    purpleLight: '#F0A5FF',
  },
  status: {
    success: '#A8E6CF',
    successDark: '#7DD3A8',
    warning: '#FFD89B',
    warningDark: '#FFB84D',
    info: '#B4D4FF',
    infoDark: '#7BAFFF',
    error: '#FFB3BA',
    errorDark: '#FF6B9D',
  },
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    accent: '#FF6B9D',
  },
} as const;

// Helper function to get gradient classes
export const getPinkGradient = (variant: 'primary' | 'soft' = 'primary') => {
  return variant === 'primary' 
    ? 'bg-gradient-to-r from-[#E879F9] via-[#F472B6] to-[#FB7185]'
    : 'bg-gradient-to-r from-[#F8BBD9] via-[#FF9EC5] to-[#FF7BB3]';
};

// Helper function to get card classes
export const getPinkCard = (hover = false) => {
  return hover
    ? 'bg-[#2A1F2E] border-[#4A3A4F] hover:bg-[#3D2A3F] hover:border-[#5A4A5F]'
    : 'bg-[#2A1F2E] border-[#4A3A4F]';
};

