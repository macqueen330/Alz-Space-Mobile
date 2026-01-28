# Android Setup Guide

This document covers the Android-specific configuration required for Alz Space Mobile.

## Prerequisites

- Android Studio with SDK 33+ installed
- Java 17 or later
- Google Play Console account ($25 one-time fee for publishing)

## Configuration Steps

### 1. Package Name

The package name is configured in `app.json`:
```json
{
  "android": {
    "package": "com.alzspace.app"
  }
}
```

### 2. Permissions

The following permissions are configured in `app.json`:

| Permission | Android Manifest | Description |
|------------|-----------------|-------------|
| Microphone | `RECORD_AUDIO` | Voice input for chat |
| Vibration | `VIBRATE` | Notification feedback |
| Boot Completed | `RECEIVE_BOOT_COMPLETED` | Scheduled notifications |

### 3. Deep Linking (OAuth)

URL Scheme configured: `alzspace://`

TODO: Configure in AndroidManifest.xml:
```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="alzspace" android:host="auth-callback" />
</intent-filter>
```

### 4. Push Notifications (FCM)

TODO: Firebase Cloud Messaging Setup

#### Steps:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. Add Android app with package name `com.alzspace.app`
4. Download `google-services.json`
5. Place it in `android/app/` directory
6. Configure in Expo:
```json
{
  "android": {
    "googleServicesFile": "./android/app/google-services.json"
  }
}
```

### 5. Development Build

```bash
# Install dependencies
npm install

# Run on Android emulator
npm run android

# Run on physical device (USB debugging enabled)
npm run android -- --device
```

### 6. EAS Build (Production)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for Android
eas build --platform android

# Build APK for testing
eas build --platform android --profile preview
```

### 7. Release Signing

Create a keystore for release builds:
```bash
keytool -genkey -v -keystore alz-space-release.keystore \
  -alias alzspace -keyalg RSA -keysize 2048 -validity 10000
```

Store the keystore securely and configure in `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "credentialsSource": "local"
      }
    }
  }
}
```

### 8. Google Play Store Submission

Required assets:
- Feature graphic (1024x500)
- Screenshots for phone and tablet
- App icon (512x512)
- Short and full description
- Privacy policy URL
- Content rating questionnaire

## Troubleshooting

### Gradle Build Fails
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### SDK Version Issues
- Check `android/build.gradle` for correct SDK versions
- Ensure Android SDK is properly installed

### Push Notifications Not Working
- Verify FCM is correctly configured
- Check that `google-services.json` is in place
- Ensure notification channels are set up (Android 8+)

## TODO Items

The following Android-specific features need implementation:

1. [ ] Configure FCM for push notifications
2. [ ] Set up deep linking in AndroidManifest.xml
3. [ ] Add adaptive icon assets
4. [ ] Configure ProGuard rules for release builds
5. [ ] Test on various Android versions (8.0 - 14)
6. [ ] Implement Android-specific permission handling
7. [ ] Configure notification channels
