# iOS (App Store) Publishing Guide

**Last Updated:** December 2024

## Prerequisites

- macOS with Xcode installed
- Apple Developer account ($99/year)
- App Store Connect access
- Certificates and provisioning profiles

## Step 1: Build Web App

```bash
# Build production bundle
pnpm run build

# Verify build
ls -la dist/
```

## Step 2: Set Up Capacitor (If Using)

```bash
# Install Capacitor CLI
pnpm add -D @capacitor/cli @capacitor/core @capacitor/ios

# Initialize Capacitor (if not already done)
npx cap init

# Add iOS platform
npx cap add ios

# Sync web assets
npx cap sync ios
```

## Step 3: Configure iOS App

### Update `ios/App/App/Info.plist`

```xml
<key>CFBundleDisplayName</key>
<string>NoticeBazaar</string>
<key>CFBundleIdentifier</key>
<string>com.noticebazaar.app</string>
<key>CFBundleVersion</key>
<string>1</string>
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
```

### Update `ios/App/App.xcodeproj`

- Set Team (your Apple Developer team)
- Set Bundle Identifier
- Set Deployment Target (iOS 13.0+)

## Step 4: Prepare for Archive

### In Xcode

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select "Any iOS Device" as target
3. Product → Scheme → Edit Scheme
4. Set Build Configuration to "Release"
5. Product → Clean Build Folder (Cmd+Shift+K)

## Step 5: Create Archive

1. Product → Archive
2. Wait for archive to complete
3. Organizer window opens automatically

## Step 6: Upload to App Store Connect

### Option A: Xcode Organizer

1. In Organizer, select archive
2. Click "Distribute App"
3. Select "App Store Connect"
4. Click "Next"
5. Select "Upload"
6. Click "Next"
7. Select distribution options
8. Click "Upload"

### Option B: Transporter App

1. Export archive as IPA
2. Open Transporter app
3. Drag IPA to Transporter
4. Click "Deliver"

## Step 7: Prepare Store Assets

### Required Assets

1. **App Icon**
   - Size: 1024x1024 px
   - Format: PNG or JPG (no transparency)
   - File: `release/store-assets/app-icon-1024.png`

2. **Screenshots** (6.5" Display - iPhone 14 Pro Max)
   - Size: 1284x2778 px
   - Minimum: 3 screenshots
   - Maximum: 10 screenshots
   - Files:
     - `release/store-assets/screenshot-6.5-1-1284x2778.png`
     - `release/store-assets/screenshot-6.5-2-1284x2778.png`
     - `release/store-assets/screenshot-6.5-3-1284x2778.png`

3. **Screenshots** (5.5" Display - iPhone 8 Plus)
   - Size: 1242x2208 px
   - Minimum: 3 screenshots
   - Maximum: 10 screenshots
   - Files:
     - `release/store-assets/screenshot-5.5-1-1242x2208.png`
     - `release/store-assets/screenshot-5.5-2-1242x2208.png`
     - `release/store-assets/screenshot-5.5-3-1242x2208.png`

4. **App Preview Video** (Optional)
   - Duration: 15-30 seconds
   - Format: MOV or MP4
   - Sizes: Match screenshot sizes

## Step 8: Create App Store Listing

### App Information

1. Go to App Store Connect
2. Create new app
3. Fill in:
   - **App Name:** NoticeBazaar
   - **Primary Language:** English
   - **Bundle ID:** com.noticebazaar.app
   - **SKU:** noticebazaar-001

### App Store Listing Details

- **Subtitle:** (30 characters max)
- **Description:** (4000 characters max)
- **Keywords:** (100 characters max, comma-separated)
- **Support URL:** https://noticebazaar.com/support
- **Marketing URL:** (optional)
- **Privacy Policy URL:** https://noticebazaar.com/privacy-policy
- **Category:** Business / Finance
- **Content Rights:** You own all content

## Step 9: Upload Screenshots

1. Go to App Store Connect → Your App → App Store
2. Select "6.5" Display" size
3. Upload 3-10 screenshots
4. Repeat for "5.5" Display" size
5. Add app preview video (optional)

## Step 10: Set Pricing & Availability

1. Go to Pricing and Availability
2. Set price (Free or Paid)
3. Select countries/regions
4. Set availability date

## Step 11: Submit for Review

### Complete Required Sections

- [x] App Information
- [x] Pricing and Availability
- [x] App Privacy (Privacy Policy URL)
- [x] Version Information
- [x] App Store screenshots
- [x] App Review Information
- [x] Version Release

### App Review Information

- **Contact Information:** Your contact details
- **Demo Account:** (if required)
- **Notes:** Any special instructions

### Submit

1. Click "Submit for Review"
2. Answer export compliance questions
3. Confirm submission
4. Wait for review (1-3 days typically)

## Assets Checklist

- [ ] App icon (1024x1024 PNG)
- [ ] 6.5" screenshots (3-10, 1284x2778)
- [ ] 5.5" screenshots (3-10, 1242x2208)
- [ ] App preview video (optional)
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] App description
- [ ] Keywords

## Common Issues

### Issue: Archive fails
**Solution:** Check code signing, certificates, provisioning profiles

### Issue: Upload fails
**Solution:** Check network, try Transporter app

### Issue: Screenshot rejected
**Solution:** Ensure correct sizes, no UI elements outside safe area

### Issue: App rejected
**Solution:** Review App Store Review Guidelines, fix issues, resubmit

## Resources

- [App Store Connect](https://appstoreconnect.apple.com)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

---

**Next:** Final Demo Package

