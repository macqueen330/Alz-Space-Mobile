# Alz Space Mobile

A cross-platform mobile application for Alzheimer's patient care coordination, built with React Native and Expo. Designed for caregivers, family members, and patients to collaboratively manage daily routines, cognitive activities, and health monitoring.

## Key Features

- **Patient Management** -- Create and manage patient profiles with health metadata, switch between multiple patients
- **Task Scheduling** -- Build daily activity plans with manual or AI-automated task generation, calendar timeline view, and completion tracking
- **AI Chat Assistant** -- Conversational nurse powered by Google Gemini, with text-to-speech output for patient interaction
- **Asset Library** -- Organize cognitive games, quizzes, audio, video, and family media for use in tasks
- **Community** -- Share stories, tips, and questions with other caregivers; browse and interact with posts
- **Statistics Dashboard** -- Track completion rates, weekly progress, and task distribution analytics
- **Patient AI Persona** -- Configure the AI assistant's voice, personality, topics, and FAQs per patient
- **Family Collaboration** -- Invite family members via UID lookup, manage roles and permissions
- **Push Notifications** -- Task reminders and schedule alerts (iOS and Android)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.76 + Expo SDK 52 |
| Language | TypeScript 5.3 |
| Navigation | React Navigation 6 (Stack + Bottom Tabs) |
| Backend | Supabase (Auth, Database, Realtime) |
| AI | Google Gemini API |
| Icons | Lucide React Native |
| Styling | StyleSheet + expo-linear-gradient |
| Voice | expo-speech (TTS) |

## Prerequisites

- Node.js >= 18
- npm or yarn
- Expo CLI (`npx expo`)
- For iOS builds: macOS with Xcode 15+
- For Android builds: Android Studio with SDK 34+

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in your Supabase and Gemini API credentials

# 3. Start the development server
npm start

# 4. Run on a platform
npm run ios       # iOS simulator
npm run android   # Android emulator
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public API key |
| `GEMINI_API_KEY` | Google Gemini API key for the AI chat |

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/           #   BrandLogo, Button, Card, Header, ScreenWrapper
│   ├── home/             #   CalendarWidget, HomeTaskItem, PatientCard
│   ├── chat/             #   MessageBubble
│   ├── tasks/            #   TaskCard
│   └── navigation/       #   TabBar (custom bottom nav with FAB)
│
├── screens/              # Full-screen views
│   ├── auth/             #   Splash, role selection, login/signup
│   ├── home/             #   Patient dashboard with timeline
│   ├── tasks/            #   Task dashboard, list, and creation
│   ├── chat/             #   AI nurse conversation
│   ├── community/        #   Post feed with filters
│   ├── profile/          #   User profile and family management
│   ├── settings/         #   Patient AI persona configuration
│   ├── statistics/       #   Analytics and progress charts
│   └── assets/           #   Media library management
│
├── services/             # Backend integration layer
│   ├── supabaseClient    #   Supabase client singleton
│   ├── authService       #   Authentication (email, OAuth)
│   ├── taskService       #   Task CRUD operations
│   ├── chatService       #   Chat history persistence
│   ├── geminiService     #   Gemini AI integration
│   ├── assetService      #   Asset management
│   ├── familyService     #   Family member operations
│   ├── statisticsService #   Analytics computation
│   └── postService       #   Community post operations
│
├── hooks/                # Custom React hooks
│   ├── useAuth           #   Authentication state
│   ├── useChat           #   Chat message management
│   ├── useTasks          #   Task data fetching
│   ├── useFamilyMembers  #   Family member data
│   └── useVoice          #   Voice input handling
│
├── platform/             # Platform-specific implementations
│   ├── auth/             #   Deep link handlers (iOS/Android)
│   ├── voice/            #   Speech recognition service
│   ├── speech/           #   Text-to-speech (iOS/Android)
│   ├── notifications/    #   Push notifications (iOS/Android)
│   └── storage/          #   Secure storage (iOS/Android)
│
├── navigation/           # Navigation configuration
│   ├── AppNavigator      #   Root auth/main switch
│   ├── AuthNavigator     #   Login flow stack
│   └── MainTabNavigator  #   Authenticated tab layout
│
├── constants/            # Design tokens
│   ├── colors            #   Color palette
│   ├── layout            #   Spacing, radii, font sizes
│   └── theme             #   Theme configuration
│
├── types/                # TypeScript type definitions
│   ├── index             #   App-wide types and enums
│   └── database.types    #   Supabase schema types
│
├── utils/                # Utility functions
│   ├── formatDate        #   Date formatting helpers
│   └── validation        #   Input validation
│
└── assets/               # Static assets
    ├── images/           #   App icons, splash screen
    └── fonts/            #   Custom fonts
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint on all TS/TSX files |
| `npm run clean` | Clear Metro cache and restart |

## Platform-Specific Code

Platform-specific implementations use the React Native file suffix convention:
- `*.ios.ts` -- iOS-specific implementation
- `*.android.ts` -- Android-specific implementation
- `index.ts` -- Unified export with platform resolution

## Build & Deploy

This project uses [EAS Build](https://docs.expo.dev/build/introduction/) for native builds:

```bash
# Development build
npx eas build --profile development --platform ios

# Preview build (internal distribution)
npx eas build --profile preview --platform android

# Production build
npx eas build --profile production --platform all
```

See [`docs/IOS_SETUP.md`](docs/IOS_SETUP.md) and [`docs/ANDROID_SETUP.md`](docs/ANDROID_SETUP.md) for platform-specific build configuration.

## Architecture Decisions

- **Service layer boundary** -- Screens access data through hooks and services, not direct Supabase calls
- **Platform abstraction** -- All native APIs wrapped behind platform-agnostic interfaces in `src/platform/`
- **Component extraction** -- Screens are kept lean; reusable UI logic lives in `src/components/`
- **Type safety** -- `catch (err: unknown)` enforced project-wide; no `any` in catch blocks

## License

This project is source-available for viewing and reference only. See [LICENSE](LICENSE) for details. No permission is granted to use, copy, modify, or distribute this software without prior written consent.
