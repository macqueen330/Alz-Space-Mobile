# iOS Setup Guide

This document covers the iOS-specific configuration required for Alz Space Mobile.

## Prerequisites

- macOS with Xcode 15+ installed
- Apple Developer Account ($99/year for App Store publishing)
- CocoaPods installed (`sudo gem install cocoapods`)

## Configuration Steps

### 1. Bundle Identifier

The bundle ID is configured in `app.json`:
```json
{
  "ios": {
    "bundleIdentifier": "com.alzspace.app"
  }
}
```

### 2. Permissions

The following permissions are configured in `app.json` under `ios.infoPlist`:

| Permission | Key | Description |
|------------|-----|-------------|
| Microphone | `NSMicrophoneUsageDescription` | Voice input for chat |
| Speech Recognition | `NSSpeechRecognitionUsageDescription` | Speech-to-text |
| Push Notifications | `UIBackgroundModes: ["remote-notification"]` | Task reminders |

### 3. Deep Linking (OAuth)

URL Scheme configured: `alzspace://`

#### Supabase Dashboard Configuration
Add these redirect URLs in your Supabase project settings:
- `alzspace://auth-callback`

### 4. Push Notifications (APNs)

#### Steps:
1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to Certificates, Identifiers & Profiles
3. Create an APNs Key:
   - Keys → Create a Key
   - Enable "Apple Push Notifications service (APNs)"
   - Download the `.p8` file
4. Note the Key ID and Team ID
5. Upload the key to your push notification service (e.g., Expo Push, Firebase)

### 5. Development Build

```bash
# Install dependencies
npm install

# Install iOS pods
cd ios && pod install && cd ..

# Run on iOS simulator
npm run ios

# Run on physical device
npm run ios -- --device
```

### 6. EAS Build (Production)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios
```

### 7. TestFlight Distribution

1. Build with `eas build --platform ios --profile production`
2. Upload to App Store Connect
3. Configure TestFlight in App Store Connect
4. Add beta testers

### 8. App Store Submission

Required assets:
- App icons (1024x1024)
- Screenshots for all device sizes
- App description and keywords
- Privacy policy URL
- Support URL

## Troubleshooting

### Pod Install Fails
```bash
cd ios
pod repo update
pod install --repo-update
```

### Signing Issues
- Ensure your Apple Developer account is connected in Xcode
- Select the correct team in Signing & Capabilities

### Push Notifications Not Working
- Verify APNs key is correctly configured
- Check device token registration
- Ensure push notifications capability is enabled
