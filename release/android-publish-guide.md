# Android (Play Store) Publishing Guide

**Last Updated:** December 2024

## Prerequisites

- Android Studio installed
- Java JDK 11+ installed
- Google Play Developer account ($25 one-time fee)
- Keystore for signing

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
pnpm add -D @capacitor/cli @capacitor/core @capacitor/android

# Initialize Capacitor (if not already done)
npx cap init

# Add Android platform
npx cap add android

# Sync web assets
npx cap sync android
```

## Step 3: Configure Android App

### Update `android/app/build.gradle`

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.noticebazaar.app"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

### Update `android/app/src/main/AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:label="NoticeBazaar"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/AppTheme">
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:launchMode="singleTask"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

## Step 4: Generate Signed APK / AAB

### Option A: Android Studio (Recommended)

1. Open `android/` folder in Android Studio
2. Build → Generate Signed Bundle / APK
3. Select "Android App Bundle" (required for Play Store)
4. Choose or create keystore
5. Enter keystore password
6. Select release build variant
7. Click "Finish"

**Output:** `android/app/release/app-release.aab`

### Option B: Command Line

```bash
# Generate keystore (first time only)
keytool -genkey -v -keystore noticebazaar-release.keystore \
  -alias noticebazaar -keyalg RSA -keysize 2048 -validity 10000

# Build release AAB
cd android
./gradlew bundleRelease

# Output: app/build/outputs/bundle/release/app-release.aab
```

## Step 5: Prepare Store Assets

### Required Assets

1. **App Icon**
   - Size: 512x512 px
   - Format: PNG (no transparency)
   - File: `release/store-assets/app-icon-512.png`

2. **Feature Graphic**
   - Size: 1024x500 px
   - Format: PNG or JPG
   - File: `release/store-assets/feature-graphic-1024x500.png`

3. **Screenshots** (Phone)
   - Minimum: 2 screenshots
   - Maximum: 8 screenshots
   - Sizes:
     - 16:9 or 9:16 aspect ratio
     - Minimum: 320px (shortest side)
     - Maximum: 3840px (longest side)
   - Files:
     - `release/store-assets/screenshot-phone-1-1080x1920.png`
     - `release/store-assets/screenshot-phone-2-1080x1920.png`

4. **Screenshots** (Tablet - Optional)
   - Minimum: 1 screenshot
   - Maximum: 8 screenshots
   - Sizes: 7" or 10" tablet
   - Files:
     - `release/store-assets/screenshot-tablet-1-1200x1920.png`

## Step 6: Create Play Store Listing

### App Information

- **App Name:** NoticeBazaar
- **Short Description:** (80 characters max)
- **Full Description:** (4000 characters max)
- **App Category:** Business / Finance
- **Content Rating:** Everyone
- **Privacy Policy URL:** https://noticebazaar.com/privacy-policy

### Store Listing Details

1. Go to Google Play Console
2. Create new app
3. Fill in app details
4. Upload screenshots
5. Upload feature graphic
6. Set pricing (Free or Paid)
7. Set content rating

## Step 7: Upload AAB

1. Go to Play Console → Release → Production
2. Create new release
3. Upload `app-release.aab`
4. Add release notes
5. Review and roll out

## Step 8: Submit for Review

1. Complete all required sections:
   - [x] Store listing
   - [x] App content
   - [x] Pricing & distribution
   - [x] Content rating
   - [x] Privacy policy
   - [x] Target audience

2. Submit for review
3. Wait for approval (1-3 days typically)

## Assets Checklist

- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG/JPG)
- [ ] Phone screenshots (2-8, 16:9 or 9:16)
- [ ] Tablet screenshots (1-8, optional)
- [ ] Privacy policy URL
- [ ] App description
- [ ] Screenshots with text overlays (optional)

## Common Issues

### Issue: AAB too large
**Solution:** Enable ProGuard/R8, use App Bundle

### Issue: Missing permissions
**Solution:** Add to AndroidManifest.xml

### Issue: Version code conflict
**Solution:** Increment versionCode in build.gradle

## Resources

- [Google Play Console](https://play.google.com/console)
- [App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [Asset Guidelines](https://support.google.com/googleplay/android-developer/answer/9866151)

---

**Next:** iOS Publishing Guide

