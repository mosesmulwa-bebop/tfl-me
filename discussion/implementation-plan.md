# tfl-me - Implementation Plan

**Project**: tfl-me  
**Start Date**: January 31, 2026  
**Status**: In Development  
**Architecture**: React Native (Expo) - No Backend

---

## 🎯 Implementation Overview

This document outlines the step-by-step implementation plan for building the tfl-me mobile app. We'll build in phases, ensuring each component works before moving to the next.

---

## 📋 Pre-Implementation Checklist

- [x] Technical spec completed
- [x] Architecture decision made (no backend)
- [x] TfL API keys obtained and added to `.env`
- [ ] Development environment ready
- [ ] Dependencies installed
- [ ] Project structure organized

---

## 🏗️ Phase 1: Foundation & Setup

### 1.1 Project Configuration
**Goal**: Set up TypeScript, linting, and basic project structure

**Tasks**:
- [ ] Review and update `tsconfig.json` for strict type checking
- [ ] Configure ESLint for consistent code style
- [ ] Set up `.env` file loading with Expo
- [ ] Add `.env` to `.gitignore` (if not already)
- [ ] Install core dependencies

**Files to Create/Modify**:
- `.env.example` (template for other developers)
- Update `.gitignore`

**Dependencies to Install**:
```bash
npm install axios date-fns
npm install @react-native-async-storage/async-storage
npm install zustand
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

**Estimated Time**: 30 minutes

---

### 1.2 Core Type Definitions
**Goal**: Define TypeScript interfaces for all data models

**Tasks**:
- [ ] Create `types/` directory
- [ ] Define Station interface
- [ ] Define Arrival interface
- [ ] Define Disruption interface
- [ ] Define LineStatus interface
- [ ] Create TfL API response types

**Files to Create**:
- `types/station.ts`
- `types/arrival.ts`
- `types/disruption.ts`
- `types/api.ts` (TfL API response shapes)

**Example Structure**:
```typescript
// types/station.ts
export interface Station {
  id: string;
  name: string;
  modes: string[];
  lines: string[];
  lat?: number;
  lon?: number;
}

export interface FavoriteStation extends Station {
  isFavorite: true;
  isMain: boolean;
  addedAt: Date;
}
```

**Estimated Time**: 45 minutes

---

### 1.3 Constants & Configuration
**Goal**: Set up app-wide constants, colors, and configuration

**Tasks**:
- [ ] Create line colors mapping (Underground lines)
- [ ] Define transport modes constants
- [ ] Set up API endpoints constants
- [ ] Create status severity mappings
- [ ] Define pastel color palette

**Files to Create**:
- `constants/tfl.ts` (TfL-specific constants)
- `constants/colors.ts` (Animal Crossing palette)
- `constants/config.ts` (API config)

**Example**:
```typescript
// constants/colors.ts
export const Colors = {
  primary: {
    mint: '#B8E6D5',
    peach: '#FFD4C9',
    lavender: '#E0CFFC',
    butterYellow: '#FFF4C9',
    skyBlue: '#C9E4FF',
  },
  background: {
    cream: '#FFF9F0',
    lightBeige: '#F5F0E8',
  },
  text: {
    darkBrown: '#5C4B37',
    mediumBrown: '#8B7355',
  },
};

// constants/tfl.ts
export const LINE_COLORS = {
  'bakerloo': '#B36305',
  'central': '#E32017',
  'circle': '#FFD300',
  'district': '#00782A',
  'elizabeth': '#9364CD',
  'dlr': '#00A4A7',
  // ... more lines
};

export const TRANSPORT_MODES = ['tube', 'dlr', 'elizabeth-line'];
```

**Estimated Time**: 30 minutes

---

## 🔌 Phase 2: TfL API Integration

### 2.1 API Client Setup
**Goal**: Create axios-based TfL API client with error handling

**Tasks**:
- [ ] Create base API client with axios
- [ ] Add authentication (API keys from env)
- [ ] Implement request interceptors
- [ ] Implement response interceptors
- [ ] Add error handling and retry logic
- [ ] Add timeout configuration

**Files to Create**:
- `services/api/client.ts`
- `services/api/types.ts`

**Example Structure**:
```typescript
// services/api/client.ts
import axios, { AxiosInstance } from 'axios';

const TFL_API_BASE = 'https://api.tfl.gov.uk';

export const createTflClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: TFL_API_BASE,
    timeout: 10000,
    params: {
      app_id: process.env.EXPO_PUBLIC_TFL_APP_ID,
      app_key: process.env.EXPO_PUBLIC_TFL_API_KEY,
    },
  });

  // Add interceptors for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle errors
      return Promise.reject(error);
    }
  );

  return client;
};
```

**Estimated Time**: 1 hour

---

### 2.2 Station Search Service
**Goal**: Implement station search and lookup functionality

**Tasks**:
- [ ] Create station search function
- [ ] Add mode filtering (tube, dlr, elizabeth-line only)
- [ ] Implement station details fetcher
- [ ] Add response parsing/transformation
- [ ] Handle empty results

**Files to Create**:
- `services/api/stations.ts`

**Functions to Implement**:
```typescript
export const searchStations = async (query: string): Promise<Station[]>
export const getStationById = async (id: string): Promise<Station>
export const getStationsByMode = async (modes: string[]): Promise<Station[]>
```

**Estimated Time**: 1.5 hours

---

### 2.3 Arrivals Service
**Goal**: Fetch and parse real-time arrival data

**Tasks**:
- [ ] Create arrivals fetcher function
- [ ] Parse TfL arrival responses
- [ ] Transform to app data model
- [ ] Sort by arrival time
- [ ] Group by line/platform
- [ ] Calculate time until arrival

**Files to Create**:
- `services/api/arrivals.ts`

**Functions to Implement**:
```typescript
export const getStationArrivals = async (stationId: string): Promise<Arrival[]>
export const getLineArrivals = async (lineId: string): Promise<Arrival[]>
```

**Estimated Time**: 1.5 hours

---

### 2.4 Disruptions Service
**Goal**: Fetch line status and disruption information

**Tasks**:
- [ ] Create line status fetcher
- [ ] Create disruptions fetcher
- [ ] Parse and transform responses
- [ ] Filter by severity
- [ ] Separate current vs planned disruptions

**Files to Create**:
- `services/api/disruptions.ts`

**Functions to Implement**:
```typescript
export const getLineStatus = async (): Promise<LineStatus[]>
export const getLineDisruptions = async (lineId: string): Promise<Disruption[]>
export const getPlannedWorks = async (): Promise<Disruption[]>
```

**Estimated Time**: 1.5 hours

---

### 2.5 API Service Tests
**Goal**: Test all API endpoints manually

**Tasks**:
- [ ] Test station search
- [ ] Test arrivals fetch
- [ ] Test line status
- [ ] Test error handling
- [ ] Verify data transformations

**Method**: Create a temporary test screen or use console logs

**Estimated Time**: 1 hour

---

## 💾 Phase 3: Local Storage & State Management

### 3.1 Storage Service
**Goal**: Implement AsyncStorage wrapper for favorites

**Tasks**:
- [ ] Create storage utility functions
- [ ] Implement save favorites
- [ ] Implement load favorites
- [ ] Implement update main station
- [ ] Add error handling
- [ ] Add data migration logic (for future updates)

**Files to Create**:
- `services/storage/favorites.ts`
- `services/storage/types.ts`

**Functions to Implement**:
```typescript
export const saveFavorites = async (stations: FavoriteStation[]): Promise<void>
export const loadFavorites = async (): Promise<FavoriteStation[]>
export const addFavorite = async (station: Station): Promise<void>
export const removeFavorite = async (stationId: string): Promise<void>
export const setMainStation = async (stationId: string): Promise<void>
```

**Estimated Time**: 1.5 hours

---

### 3.2 State Management Setup
**Goal**: Set up Zustand stores for app state

**Tasks**:
- [ ] Create favorites store
- [ ] Create arrivals store
- [ ] Create disruptions store
- [ ] Create UI state store (loading, errors)
- [ ] Add persistence middleware

**Files to Create**:
- `store/favoritesStore.ts`
- `store/arrivalsStore.ts`
- `store/disruptionsStore.ts`
- `store/uiStore.ts`

**Example Structure**:
```typescript
// store/favoritesStore.ts
import { create } from 'zustand';
import { FavoriteStation } from '@/types/station';

interface FavoritesStore {
  favorites: FavoriteStation[];
  mainStationId: string | null;
  loadFavorites: () => Promise<void>;
  addFavorite: (station: Station) => Promise<void>;
  removeFavorite: (stationId: string) => Promise<void>;
  setMainStation: (stationId: string) => Promise<void>;
}

export const useFavoritesStore = create<FavoritesStore>((set) => ({
  favorites: [],
  mainStationId: null,
  loadFavorites: async () => {
    // Implementation
  },
  // ... other actions
}));
```

**Estimated Time**: 2 hours

---

## 🎨 Phase 4: UI Components Library

### 4.1 Base Components
**Goal**: Create reusable styled components with Animal Crossing theme

**Tasks**:
- [ ] Create Card component
- [ ] Create Button component
- [ ] Create Text components (heading, body, caption)
- [ ] Create Loading spinner
- [ ] Create Empty state component
- [ ] Create Error message component

**Files to Create**:
- `components/ui/Card.tsx`
- `components/ui/Button.tsx`
- `components/ui/Typography.tsx`
- `components/ui/Loading.tsx`
- `components/ui/EmptyState.tsx`

**Styling**: Use pastel colors, rounded corners (16-24px), soft shadows

**Estimated Time**: 2 hours

---

### 4.2 Station Components
**Goal**: Components for displaying station information

**Tasks**:
- [ ] Create StationCard component
- [ ] Create StationListItem component
- [ ] Create StationBadge component (for main station)
- [ ] Add swipe actions for favorites

**Files to Create**:
- `components/station/StationCard.tsx`
- `components/station/StationListItem.tsx`
- `components/station/StationBadge.tsx`

**Estimated Time**: 2 hours

---

### 4.3 Arrival Components
**Goal**: Components for displaying train arrivals

**Tasks**:
- [ ] Create ArrivalCard component
- [ ] Create ArrivalListItem component
- [ ] Create ArrivalTime component (formatted)
- [ ] Create LineBadge component (with colors)
- [ ] Create PlatformBadge component

**Files to Create**:
- `components/arrival/ArrivalCard.tsx`
- `components/arrival/ArrivalListItem.tsx`
- `components/arrival/ArrivalTime.tsx`
- `components/arrival/LineBadge.tsx`

**Features**:
- Color-coded by line
- Time formatting ("Due", "1 min", "2 mins")
- Platform information
- Destination display

**Estimated Time**: 2 hours

---

### 4.4 Disruption Components
**Goal**: Components for displaying service disruptions

**Tasks**:
- [ ] Create DisruptionBanner component
- [ ] Create DisruptionCard component
- [ ] Create StatusBadge component
- [ ] Create severity color coding

**Files to Create**:
- `components/disruption/DisruptionBanner.tsx`
- `components/disruption/DisruptionCard.tsx`
- `components/disruption/StatusBadge.tsx`

**Estimated Time**: 1.5 hours

---

### 4.5 Search Components
**Goal**: Station search interface components

**Tasks**:
- [ ] Create SearchBar component
- [ ] Create SearchResults component
- [ ] Create RecentSearches component
- [ ] Add debouncing to search input

**Files to Create**:
- `components/search/SearchBar.tsx`
- `components/search/SearchResults.tsx`
- `components/search/RecentSearches.tsx`

**Estimated Time**: 1.5 hours

---

## 📱 Phase 5: Screens & Navigation

### 5.1 Navigation Setup
**Goal**: Set up React Navigation with bottom tabs

**Tasks**:
- [ ] Configure tab navigator
- [ ] Configure stack navigator
- [ ] Set up navigation types
- [ ] Create custom tab bar (Animal Crossing style)
- [ ] Add navigation icons

**Files to Create/Modify**:
- `navigation/types.ts`
- `navigation/TabNavigator.tsx`
- `navigation/StackNavigator.tsx`
- Update `app/_layout.tsx`

**Tabs**:
1. Home (main station)
2. Favorites (station list)
3. Disruptions (service status)

**Estimated Time**: 2 hours

---

### 5.2 Home Screen
**Goal**: Display main station with real-time arrivals

**Tasks**:
- [ ] Create Home screen layout
- [ ] Display main station card
- [ ] Show real-time arrivals
- [ ] Implement pull-to-refresh
- [ ] Add auto-refresh (30 seconds)
- [ ] Show loading states
- [ ] Handle empty state (no main station)

**Files to Create**:
- Update `app/(tabs)/index.tsx`

**Features**:
- Large main station card at top
- Grouped arrivals by line
- Quick actions (change main station)
- Service status banner if disruptions

**Estimated Time**: 3 hours

---

### 5.3 Favorites Screen
**Goal**: List and manage favorite stations

**Tasks**:
- [ ] Create Favorites screen layout
- [ ] Display favorite stations list
- [ ] Add "set as main" functionality
- [ ] Implement swipe-to-delete
- [ ] Add empty state illustration
- [ ] Create "Add Station" button
- [ ] Show station badges

**Files to Create**:
- Update `app/(tabs)/explore.tsx` or create new favorites screen

**Features**:
- Star icon for main station
- Tap to view station details
- Long press or swipe to delete
- Reorder favorites (optional)

**Estimated Time**: 2.5 hours

---

### 5.4 Disruptions Screen
**Goal**: Display line status and disruptions

**Tasks**:
- [ ] Create Disruptions screen layout
- [ ] Display current line status
- [ ] Show active disruptions
- [ ] Show planned works section
- [ ] Filter by severity
- [ ] Add refresh functionality
- [ ] Group by line

**Files to Create**:
- Create new `app/(tabs)/disruptions.tsx`

**Features**:
- Traffic light status indicators
- Expandable disruption details
- Weekend works section
- Last updated timestamp

**Estimated Time**: 2.5 hours

---

### 5.5 Station Detail Screen
**Goal**: Full station view with arrivals

**Tasks**:
- [ ] Create Station Detail screen
- [ ] Display station name and info
- [ ] Show all arrivals for station
- [ ] Add to favorites button
- [ ] Show station lines
- [ ] Implement refresh

**Files to Create**:
- `app/stationDetail.tsx` (modal or stack screen)

**Features**:
- Header with station name
- Favorite toggle button
- Grouped arrivals by line
- Real-time updates

**Estimated Time**: 2 hours

---

### 5.6 Station Search Screen
**Goal**: Search and discover stations

**Tasks**:
- [ ] Create Search screen (modal)
- [ ] Implement search functionality
- [ ] Display search results
- [ ] Show recent searches
- [ ] Filter by transport mode
- [ ] Handle no results state

**Files to Create**:
- Update `app/modal.tsx` or create new search modal

**Features**:
- Search bar with clear button
- Live search results
- Tap to view or add to favorites
- Transport mode icons

**Estimated Time**: 2.5 hours

---

## ✨ Phase 6: Polish & User Experience

### 6.1 Animations & Transitions
**Goal**: Add smooth animations for delightful UX

**Tasks**:
- [ ] Add screen transitions
- [ ] Animate card appearances
- [ ] Add pull-to-refresh animation
- [ ] Loading state animations
- [ ] Button press animations
- [ ] Implement haptic feedback

**Libraries**:
- `react-native-reanimated`
- `expo-haptics`

**Estimated Time**: 2 hours

---

### 6.2 Error Handling & Edge Cases
**Goal**: Handle all error scenarios gracefully

**Tasks**:
- [ ] Network error handling
- [ ] API error messages
- [ ] Offline detection
- [ ] Timeout handling
- [ ] Empty state designs
- [ ] Retry mechanisms

**Error States to Handle**:
- No internet connection
- API rate limiting
- Invalid station ID
- No arrivals available
- Server errors

**Estimated Time**: 2 hours

---

### 6.3 Accessibility
**Goal**: Make app accessible to all users

**Tasks**:
- [ ] Add screen reader labels
- [ ] Ensure color contrast (WCAG AA)
- [ ] Test with VoiceOver/TalkBack
- [ ] Add keyboard navigation (web)
- [ ] Scalable text sizes
- [ ] Touch target sizes (min 44pt)

**Estimated Time**: 1.5 hours

---

### 6.4 App Icon & Splash Screen
**Goal**: Create branded app assets

**Tasks**:
- [ ] Design app icon (Animal Crossing style)
- [ ] Create splash screen
- [ ] Configure app.json
- [ ] Generate all icon sizes
- [ ] Test on devices

**Tools**: Figma or Canva for design

**Estimated Time**: 1.5 hours

---

### 6.5 Performance Optimization
**Goal**: Ensure smooth app performance

**Tasks**:
- [ ] Optimize re-renders with React.memo
- [ ] Implement lazy loading
- [ ] Add list virtualization for long lists
- [ ] Optimize images
- [ ] Profile with React DevTools
- [ ] Test on lower-end devices

**Estimated Time**: 2 hours

---

## 🧪 Phase 7: Testing & QA

### 7.1 Manual Testing Checklist
**Tasks**:
- [ ] Test all user flows
- [ ] Test on iOS device/simulator
- [ ] Test on Android device/emulator
- [ ] Test offline behavior
- [ ] Test with slow network
- [ ] Test edge cases (no favorites, etc.)
- [ ] Test different screen sizes

**Estimated Time**: 3 hours

---

### 7.2 Bug Fixes
**Goal**: Fix all identified issues

**Tasks**:
- [ ] Track bugs in GitHub Issues
- [ ] Prioritize critical bugs
- [ ] Fix and re-test
- [ ] Document known issues

**Estimated Time**: Variable (3-5 hours)

---

## 🚀 Phase 8: Deployment

### 8.1 Pre-Deployment
**Tasks**:
- [ ] Update app.json with correct metadata
- [ ] Set app version (1.0.0)
- [ ] Configure app permissions
- [ ] Test production build locally
- [ ] Prepare privacy policy
- [ ] Prepare app store descriptions

**Estimated Time**: 2 hours

---

### 8.2 Build & Deploy
**Tasks**:
- [ ] Set up EAS Build account
- [ ] Configure eas.json
- [ ] Create production build (iOS)
- [ ] Create production build (Android)
- [ ] Test builds on devices
- [ ] Submit to App Store
- [ ] Submit to Google Play

**Commands**:
```bash
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios
eas submit --platform android
```

**Estimated Time**: 3 hours + review time

---

## 📊 Total Time Estimate

| Phase | Estimated Time |
|-------|----------------|
| 1. Foundation & Setup | 1.75 hours |
| 2. API Integration | 6.5 hours |
| 3. Storage & State | 3.5 hours |
| 4. UI Components | 9 hours |
| 5. Screens & Navigation | 14.5 hours |
| 6. Polish & UX | 9 hours |
| 7. Testing & QA | 6-8 hours |
| 8. Deployment | 5 hours |
| **TOTAL** | **55-57 hours** |

**Timeline**: ~2-3 weeks (working ~20 hours/week)

---

## 🎯 Development Milestones

### Milestone 1: API Integration Complete
- ✅ All API services working
- ✅ Data models defined
- ✅ Can fetch stations, arrivals, disruptions

### Milestone 2: Core UI Complete
- ✅ All screens implemented
- ✅ Navigation working
- ✅ Basic functionality working

### Milestone 3: MVP Complete
- ✅ Can search and save stations
- ✅ Can view real-time arrivals
- ✅ Can see disruptions
- ✅ Favorites persist

### Milestone 4: Polish Complete
- ✅ Animations smooth
- ✅ Error handling robust
- ✅ App icon and branding
- ✅ All bugs fixed

### Milestone 5: Deployed
- ✅ App live on stores
- ✅ Users can download

---

## 🔄 Daily Development Flow

1. **Morning**: Review implementation plan, pick tasks for the day
2. **Development**: Build features, test as you go
3. **Testing**: Manual testing after each feature
4. **Commit**: Commit working code with clear messages
5. **Review**: Check off completed tasks in this document

---

## 📝 Notes & Decisions Log

### Design Decisions
- Using Zustand over Redux for simpler state management
- No backend proxy for MVP, direct TfL API calls
- AsyncStorage over Expo SecureStore (favorites aren't sensitive)
- Bottom tabs over drawer navigation (easier thumb reach)

### Technical Decisions
- TypeScript strict mode enabled
- Axios over fetch (better error handling, interceptors)
- date-fns over moment.js (smaller bundle size)
- React Navigation v6 (latest stable)

### Future Enhancements to Consider
- Push notifications for disruptions
- Widget support
- Apple Watch / Android Wear
- Journey planning
- Nearby stations with GPS
- Multi-language support

---

## 🆘 Resources & Links

- **TfL API Docs**: https://api.tfl.gov.uk/
- **TfL API Portal**: https://api-portal.tfl.gov.uk/
- **Expo Docs**: https://docs.expo.dev/
- **React Navigation**: https://reactnavigation.org/
- **Zustand**: https://github.com/pmndrs/zustand
- **Animal Crossing Colors**: [Reference palette we defined]

---

## ✅ Ready to Build!

Start with **Phase 1: Foundation & Setup** and work through systematically. Check off tasks as you complete them, and don't hesitate to adjust the plan as needed.

**Current Phase**: Phase 1 - Foundation & Setup  
**Next Task**: Review and update `tsconfig.json`

Let's build something delightful! 🌸✨
