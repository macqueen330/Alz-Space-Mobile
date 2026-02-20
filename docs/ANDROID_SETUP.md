# Android Setup Guide

This document covers the Android-specific configuration required for Alz Space Mobile.

## Prerequisites

- Android Studio with SDK 33+ installed
- Java 17 or later
- Expo account (free at https://expo.dev)
- Google Play Console account ($25 one-time fee for publishing - optional for testing)

## Configuration Status

| Feature | Status | Notes |
|---------|--------|-------|
| Package Name | ✅ Configured | `com.alzspace.app` |
| Permissions | ✅ Configured | RECORD_AUDIO, VIBRATE, RECEIVE_BOOT_COMPLETED |
| Deep Linking | ✅ Configured | `alzspace://auth-callback` |
| Version Code | ✅ Configured | versionCode: 1 |
| Notification Channels | ✅ Configured | default, task-reminders |
| Permission Handling | ✅ Implemented | Runtime permission for microphone |
| FCM Setup | ⏳ Pending | Requires Firebase project |
| EAS Project | ⏳ Pending | Requires `eas init` |

## Quick Start - Build APK

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

Follow the prompts to create an account or log in.

### Step 3: Initialize EAS Project

```bash
eas init
```

This will automatically:
- Create a project on Expo servers
- Generate a unique `projectId`
- Update your `app.json` with the projectId

### Step 4: Build APK for Testing

```bash
eas build --platform android --profile preview
```

This builds an APK in the cloud. When complete, you'll get a download link.

### Alternative: Local Build

If you have Android Studio installed:

```bash
# Generate native Android project
npx expo prebuild --platform android

# Build APK
cd android && ./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/
```

## Detailed Configuration

### 1. Package Name

Configured in `app.json`:
```json
{
  "android": {
    "package": "com.alzspace.app",
    "versionCode": 1
  }
}
```

### 2. Permissions

| Permission | Android Manifest | Description |
|------------|-----------------|-------------|
| Microphone | `RECORD_AUDIO` | Voice input for chat |
| Vibration | `VIBRATE` | Notification feedback |
| Boot Completed | `RECEIVE_BOOT_COMPLETED` | Scheduled notifications |

### 3. Deep Linking (OAuth)

Configured in `app.json` with `intentFilters`:
```json
{
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "autoVerify": true,
        "data": [{ "scheme": "alzspace", "host": "auth-callback" }],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  }
}
```

This enables OAuth callback handling for Google sign-in.

### 4. Push Notifications (FCM)

For production push notifications, you need Firebase Cloud Messaging:

#### Steps:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or select existing)
3. Click "Add app" → Android
4. Enter package name: `com.alzspace.app`
5. Download `google-services.json`
6. Place it in project root directory
7. Update `app.json`:

```json
{
  "android": {
    "googleServicesFile": "./google-services.json"
  }
}
```

**Note:** Local notifications work without FCM. FCM is only required for remote push notifications.

### 5. Development Build

```bash
# Install dependencies
npm install

# Run on Android emulator
npm run android

# Run on physical device (USB debugging enabled)
npm run android -- --device
```

### 6. EAS Build Profiles

The `eas.json` file contains three build profiles:

| Profile | Purpose | Output |
|---------|---------|--------|
| `development` | Development with hot reload | Development client |
| `preview` | Testing/QA | APK file |
| `production` | Play Store release | AAB (App Bundle) |

Build commands:
```bash
# Development build
eas build --platform android --profile development

# Preview APK
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production
```

### 7. Release Signing

For local production builds, create a keystore:

```bash
keytool -genkey -v -keystore alz-space-release.keystore \
  -alias alzspace -keyalg RSA -keysize 2048 -validity 10000
```

**Important:** Store the keystore securely. You'll need it for all future updates.

For EAS builds, credentials are managed automatically unless you configure local credentials.

### 8. Google Play Store Submission

Required assets:
- Feature graphic (1024x500)
- Screenshots for phone and tablet
- App icon (512x512) - already configured
- Short description (80 chars max)
- Full description (4000 chars max)
- Privacy policy URL
- Content rating questionnaire

## Troubleshooting

### EAS Build Fails

```bash
# Clear cache and retry
eas build --platform android --profile preview --clear-cache
```

### Gradle Build Fails (Local)

```bash
cd android
./gradlew clean
cd ..
npm run android
```

### SDK Version Issues

- Ensure Android SDK 33+ is installed
- Check that JAVA_HOME points to Java 17+

### Push Notifications Not Working

1. Verify FCM is correctly configured
2. Check that `google-services.json` is in place
3. Ensure EAS projectId is set in `app.json`
4. Check notification permissions are granted

### Voice Recognition Not Working

1. Check microphone permission is granted
2. Verify device has speech recognition capability
3. Check internet connection (Google Speech services)

## Completed Items

- [x] Configure package name and version
- [x] Set up deep linking for OAuth
- [x] Implement runtime permission handling for microphone
- [x] Configure notification channels
- [x] Add adaptive icon configuration
- [x] Set up EAS build profiles

## Remaining Items

- [ ] Create EAS project (`eas init`)
- [ ] Set up Firebase/FCM for remote notifications
- [ ] Test on various Android versions (8.0 - 14)
- [ ] Create Play Store listing assets
