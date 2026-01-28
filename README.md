# Alz Space Mobile

A React Native mobile application for Alzheimer's patient care management, supporting iOS and Android.

## Features

- Patient profile management
- Task scheduling and tracking
- AI-powered chat assistant with voice support
- Family member management with invitation system
- Community features
- Push notifications for task reminders

## Prerequisites

- Node.js 18+
- Expo CLI
- iOS: Xcode (for iOS development)
- Android: Android Studio (for Android development)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Fill in your environment variables in `.env`

4. Start the development server:
   ```bash
   npm start
   ```

5. Run on iOS:
   ```bash
   npm run ios
   ```

6. Run on Android:
   ```bash
   npm run android
   ```

## Project Structure

```
src/
├── app/              # Main app entry
├── components/       # Reusable UI components
├── screens/          # Screen components
├── services/         # API services (Supabase, Gemini)
├── platform/         # Platform-specific implementations
├── navigation/       # React Navigation setup
├── hooks/            # Custom React hooks
├── types/            # TypeScript types
├── constants/        # App constants (colors, layout)
├── utils/            # Utility functions
└── assets/           # Images, fonts
```

## Platform-Specific Code

This project uses the file suffix approach for platform-specific code:
- `*.ios.ts` - iOS implementation
- `*.android.ts` - Android implementation

## Configuration

### iOS
- Bundle ID: `com.alzspace.app`
- Requires Apple Developer Account for App Store

### Android
- Package: `com.alzspace.app`
- Requires Google Play Console for Play Store

## License

Private - All rights reserved
