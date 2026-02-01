# KingDate - Premium Dating App

## Overview

KingDate (킹데이트) is an exclusive premium dating platform designed for Korean users. The app connects verified users through premium memberships and authentic profiles. All UI text is in Korean (한국어), featuring a refined glassmorphism aesthetic with minimalist design principles.

**Key Features:**
- Gender-specific onboarding flows (males require King subscription, females require phone verification)
- Premium "King" (킹) membership for male users (₩250,000/month) to message others
- Manual bank transfer payment flow (KB국민은행 30380204388027 예금주: 조혜빈)
- Real-time messaging between verified users
- User discovery with profile cards showing opposite-gender users only
- Glassmorphism UI with smooth animations and micro-interactions
- Black and gold accent color theme (primary: #1A1A1A)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v7 with native stack and bottom tabs
- **State Management**: React Context (AuthContext) + TanStack React Query
- **Animations**: React Native Reanimated for micro-interactions and smooth transitions
- **Styling**: StyleSheet with theme constants, supporting dark/light modes
- **UI Components**: Custom component library with ThemedText, ThemedView, Button, Card, Input, etc.

### Navigation Structure
```
RootStackNavigator
├── AuthStackNavigator (unauthenticated)
│   ├── Welcome
│   ├── GenderSelection
│   ├── ProfileSetup
│   ├── PhoneVerification (females)
│   └── Subscription (males)
├── MainTabNavigator (authenticated)
│   ├── DiscoverTab (browse users)
│   ├── MessagesTab (conversations)
│   ├── MembershipTab (males only)
│   └── ProfileTab
└── Modal Screens
    ├── UserProfile
    ├── Chat
    └── EditProfile
```

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints prefixed with `/api`
- **Server Entry**: `server/index.ts` with CORS handling for Replit domains

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Client Storage**: AsyncStorage for local persistence (conversations, messages, user profiles)
- **Current State**: Uses in-memory storage (`MemStorage`) with PostgreSQL schema ready for production

### Path Aliases
- `@/` → `./client/`
- `@shared/` → `./shared/`

### Build Configuration
- **Development**: Concurrent Expo + Express servers
- **Production**: Expo static build + esbuild for server bundling
- **Migrations**: Drizzle Kit for database schema management

## External Dependencies

### Third-Party Services
- **Expo Services**: Splash screen, image picker, haptics, secure store, web browser
- **Database**: PostgreSQL (via `pg` driver and Drizzle ORM)

### Key NPM Packages
- `expo-blur`, `expo-linear-gradient`, `expo-glass-effect` - Glassmorphism effects
- `react-native-reanimated` - Animations
- `react-native-keyboard-controller` - Keyboard handling
- `@tanstack/react-query` - Server state management
- `drizzle-orm`, `drizzle-zod` - Database ORM and validation

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `EXPO_PUBLIC_DOMAIN` - API server domain for client requests
- `REPLIT_DEV_DOMAIN` - Development domain (auto-set by Replit)