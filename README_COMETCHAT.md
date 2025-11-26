# CometChat Integration Guide

This project now includes CometChat SDK integration for enhanced real-time messaging capabilities, with automatic fallback to Supabase if CometChat is not configured.

## Setup Instructions

### 1. Get CometChat Credentials

1. Sign up for a free account at [CometChat](https://app.cometchat.com)
2. Create a new app in your CometChat dashboard
3. Note down your:
   - **App ID**
   - **Region** (e.g., `us`, `eu`, `in`)
   - **Auth Key** (for development/testing)

### 2. Configure Environment Variables

Create a `.env` file in the root directory (or add to your existing `.env`):

```env
VITE_COMETCHAT_APP_ID=your_app_id_here
VITE_COMETCHAT_REGION=us
VITE_COMETCHAT_AUTH_KEY=your_auth_key_here
```

### 3. Features Enabled

When CometChat is configured, the Messages page automatically uses:

- ✅ **Real-time messaging** - Instant message delivery
- ✅ **Typing indicators** - See when advisors are typing
- ✅ **Read receipts** - Track message read status
- ✅ **Presence status** - See when users are online
- ✅ **Automatic fallback** - Falls back to Supabase if CometChat is not configured

### 4. How It Works

The integration uses a hybrid approach:

1. **Primary**: CometChat SDK for real-time messaging (if configured)
2. **Fallback**: Supabase real-time channels (if CometChat not configured)

The system automatically detects if CometChat is configured and switches between the two seamlessly.

### 5. Testing

1. Configure CometChat credentials in `.env`
2. Restart your dev server
3. Open the Messages page
4. Messages will use CometChat for real-time delivery
5. Typing indicators will work automatically

### 6. Production Setup

For production, you should:

1. Generate auth tokens from your backend (more secure)
2. Update `src/lib/cometchat/useCometChat.ts` to fetch tokens from your API
3. Remove the AUTH_KEY from environment variables
4. Implement proper user creation in CometChat when users sign up

## Troubleshooting

- **CometChat not working?** Check browser console for initialization errors
- **Messages not appearing?** Verify your App ID and Region are correct
- **Typing indicators not showing?** Ensure CometChat is initialized and users are logged in

## Resources

- [CometChat Documentation](https://www.cometchat.com/docs)
- [CometChat React SDK](https://www.cometchat.com/docs/react-chat-ui-kit/overview)
- [Tutorial: Building Chat App with CometChat](https://www.cometchat.com/tutorials/ai-chat-app-development)

