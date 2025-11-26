// CometChat Configuration
// Get your App ID and Region from https://app.cometchat.com

export const COMETCHAT_CONFIG = {
  APP_ID: import.meta.env.VITE_COMETCHAT_APP_ID || '',
  REGION: import.meta.env.VITE_COMETCHAT_REGION || 'us',
  AUTH_KEY: import.meta.env.VITE_COMETCHAT_AUTH_KEY || '',
};

// Initialize CometChat (call this once in your app)
export const initializeCometChat = async () => {
  const { CometChat } = await import('@cometchat-pro/chat');
  
  const appID = COMETCHAT_CONFIG.APP_ID;
  const region = COMETCHAT_CONFIG.REGION;

  if (!appID) {
    console.warn('CometChat APP_ID not configured. Real-time messaging will use Supabase fallback.');
    return false;
  }

  try {
    const appSetting = new CometChat.AppSettingsBuilder()
      .subscribePresenceForAllUsers()
      .setRegion(region)
      .build();

    await CometChat.init(appID, appSetting);
    console.log('CometChat initialized successfully');
    return true;
  } catch (error) {
    console.error('CometChat initialization failed:', error);
    return false;
  }
};

