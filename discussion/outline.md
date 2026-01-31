# Stationly - Technical Specification

## Project Overview

**Project Name**: Stationly  
**Tagline**: From Platform to Pocket  
**Version**: 1.0.0  
**Last Updated**: January 31, 2026  
**Platform**: Mobile (iOS/Android) via React Native/Expo  
**Future Expansion**: Web platform capability

### Purpose
A mobile application that provides real-time train arrival predictions for London Underground, DLR, and Elizabeth Line services, with a delightful, user-friendly interface.

---

## User Stories

### Primary User Story
As a London commuter, I want to quickly check real-time train arrivals at my favorite station so I can plan my journey efficiently.

### Secondary User Stories
- As a user, I want to save multiple stations for quick access
- As a user, I want to designate one station as my primary/main station
- As a user, I want to see service disruptions and planned weekend engineering works
- As a user, I want an enjoyable, visually appealing experience while checking train times

---

## Technical Architecture

### Platform & Framework
- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Target Platforms**: iOS, Android (Web consideration for future)
- **Minimum SDK**: 
  - iOS: 13.0+
  - Android: API 21+ (Android 5.0)

### Architecture Decision: No Backend
- **Client-Side Only**: Direct API calls to TfL from React Native app
- **No Server Infrastructure**: Zero backend maintenance or costs
- **Rationale**: 
  - TfL API is public and free to use
  - No user accounts = no backend auth needed
  - Local storage sufficient for favorites
  - Simpler deployment and faster MVP

### Data Storage
- **Local Storage**: AsyncStorage / Expo SecureStore
- **No Database**: All user preferences stored locally on device
- **Data Persistence**: 
  - Favorite stations list
  - Main/primary station selection
  - User preferences (theme, notification settings)

### External APIs

#### TfL Unified API
- **Base URL**: `https://api.tfl.gov.uk`
- **Authentication**: API Key (Application ID and Key)
- **Rate Limiting**: 500 requests per minute (typical free tier)

**Required Endpoints**:

1. **Station Search/Lookup**
   - `GET /StopPoint/Search/{query}`
   - Purpose: Search for stations by name
   - Filters: Mode types (tube, dlr, elizabeth-line)

2. **Real-Time Arrivals**
   - `GET /StopPoint/{id}/Arrivals`
   - Purpose: Get real-time arrival predictions
   - Returns: Train destination, platform, arrival time, line info

3. **Line Status**
   - `GET /Line/Mode/{modes}/Status`
   - Modes: tube, dlr, elizabeth-line
   - Purpose: Current service disruptions and status

4. **Planned Works/Disruptions**
   - `GET /Line/{ids}/Disruption`
   - Purpose: Weekend engineering works and planned disruptions

5. **Station Details** (optional)
   - `GET /StopPoint/{id}`
   - Purpose: Station information and facilities

**Transport Modes Focus**:
- Underground (tube)
- DLR (Docklands Light Railway)
- Elizabeth Line (elizabeth-line)

---

## Core Features

### 1. Station Management

#### Favorite Stations
- Users can search and add multiple stations to favorites
- Maximum favorites: Unlimited (suggest UI grouping if >10)
- Quick access list on home screen
- Ability to remove stations from favorites

#### Main Station
- One station can be designated as "primary/main"
- Main station displayed prominently on home screen
- Quick toggle to switch main station
- Main station loads by default on app launch

### 2. Real-Time Arrivals Display

**Information Shown**:
- Line name and color coding
- Destination station
- Platform number
- Time until arrival (in minutes)
- "Due", "1 min", "2 mins", etc.
- Current time at top of screen

**Behavior**:
- Auto-refresh every 30 seconds
- Pull-to-refresh gesture
- Loading states for API calls
- Error handling for network issues
- Empty state when no upcoming trains

**Filtering/Sorting**:
- Group by line
- Sort by time (nearest first)
- Filter by direction/platform (optional)

### 3. Service Disruptions

**Types of Disruptions**:
- Current service status (Good Service, Minor Delays, Severe Delays, etc.)
- Real-time disruptions affecting selected station
- Planned engineering works (especially weekends)
- Reduced service notices

**Display**:
- Badge/indicator on affected lines
- Expandable disruption details
- Color-coded severity levels
- Timestamp of last update

### 4. Station Search
- Autocomplete search functionality
- Filter results to only Underground, DLR, and Elizabeth Line
- Recently searched stations
- Alphabetical or proximity sorting

---

## User Interface Design

### Design System - "Animal Crossing" Inspired

#### Color Palette (Pastel)
```
Primary Colors:
- Soft Mint: #B8E6D5
- Peach: #FFD4C9
- Lavender: #E0CFFC
- Butter Yellow: #FFF4C9
- Sky Blue: #C9E4FF

Background:
- Cream: #FFF9F0
- Light Beige: #F5F0E8

Text:
- Dark Brown: #5C4B37
- Medium Brown: #8B7355

Accents:
- Coral: #FF9B85
- Sage: #9DC183
```

#### Typography
- **Headings**: Rounded, friendly font (e.g., Nunito, Quicksand)
- **Body**: Clean, readable (e.g., Inter, Poppins)
- **Size Scale**: 12px, 14px, 16px, 20px, 24px, 32px

#### UI Elements
- **Border Radius**: 16px-24px for cards, 12px for buttons
- **Shadows**: Soft, subtle shadows for depth
- **Icons**: Rounded, friendly style (e.g., Feather Icons, Ionicons)
- **Illustrations**: Optional decorative elements (flowers, leaves, clouds)
- **Spacing**: Generous padding and margins (8px grid system)

#### Components Style
- Cards with rounded corners and soft shadows
- Pill-shaped buttons
- Smooth transitions and animations
- Subtle hover/press states
- Progress indicators with pastel colors
- Toast notifications with friendly messages

### Screen Structure

#### 1. Home Screen
- Main station card (prominent, larger)
- Real-time arrivals for main station
- Quick access to favorite stations list
- Service status banner (if disruptions exist)
- Pull-to-refresh functionality

#### 2. Favorites Screen
- List of saved stations with cards
- Ability to set/change main station
- Swipe-to-delete or edit mode
- Add new favorite button
- Empty state illustration

#### 3. Station Search Screen
- Search bar at top
- Filtered results (Underground, DLR, Elizabeth only)
- Tap to view station or add to favorites
- Recent searches

#### 4. Station Detail Screen
- Station name header
- Real-time arrivals grouped by line
- Service status section
- Add/remove from favorites button
- Line color indicators

#### 5. Disruptions Screen
- List of current disruptions by line
- Planned engineering works section
- Filter by date (today, this weekend, upcoming)
- Color-coded severity

---

## Technical Implementation Details

### State Management
- **Recommended**: React Context API or Zustand
- **State to Manage**:
  - Favorite stations list
  - Main station selection
  - API data (arrivals, disruptions)
  - UI state (loading, errors)

### Data Models

```typescript
interface Station {
  id: string;              // TfL StopPoint ID
  name: string;            // Station name
  modes: string[];         // ['tube', 'dlr', 'elizabeth-line']
  lines: string[];         // Line names serving this station
  isFavorite: boolean;
  isMain: boolean;
  addedAt: Date;
}

interface Arrival {
  id: string;
  lineName: string;
  lineId: string;
  direction: string;
  destinationName: string;
  platformName: string;
  timeToStation: number;   // seconds
  expectedArrival: Date;
  currentLocation: string;
}

interface Disruption {
  id: string;
  lineId: string;
  lineName: string;
  category: 'RealTime' | 'PlannedWork';
  severity: string;        // 'Good Service', 'Minor Delays', etc.
  description: string;
  closureText?: string;
  created: Date;
  lastUpdate: Date;
  affectedStops?: string[];
}

interface LineStatus {
  lineId: string;
  lineName: string;
  statusSeverity: number;  // 10 = Good Service, lower = worse
  statusSeverityDescription: string;
  reason?: string;
  disruption?: Disruption;
}
```

### API Integration

#### API Client Setup
```typescript
// services/tflApi.ts
// Direct integration with TfL API - no backend proxy
- Configure base URL: https://api.tfl.gov.uk
- Store API keys in Expo environment variables
- Implement request/response interceptors using axios
- Error handling and retry logic with exponential backoff
- Response caching (for station metadata only)
```

#### Environment Variables
```env
# .env
EXPO_PUBLIC_TFL_APP_ID=your_app_id
EXPO_PUBLIC_TFL_API_KEY=your_api_key
```

#### Example Implementation
```typescript
// services/tflApi.ts
import axios from 'axios';

const TFL_API_BASE = 'https://api.tfl.gov.uk';
const APP_ID = process.env.EXPO_PUBLIC_TFL_APP_ID;
const API_KEY = process.env.EXPO_PUBLIC_TFL_API_KEY;

const tflClient = axios.create({
  baseURL: TFL_API_BASE,
  timeout: 10000,
  params: {
    app_id: APP_ID,
    app_key: API_KEY,
  },
});

export const getStationArrivals = async (stationId: string) => {
  const { data } = await tflClient.get(`/StopPoint/${stationId}/Arrivals`);
  return data;
};
```

#### Caching Strategy
- **Station metadata**: Cache for 24 hours
- **Arrivals**: No cache, always fresh
- **Line status**: Cache for 2 minutes
- **Disruptions**: Cache for 5 minutes

### Error Handling
- Network errors: Retry with exponential backoff
- API errors: Display user-friendly messages
- Timeout handling: 10 second timeout
- Offline detection: Show offline banner

### Performance Considerations
- Lazy loading for station lists
- Debounced search input (300ms)
- Optimized re-renders with React.memo
- Image optimization for icons/illustrations

---

## Navigation Structure

```
Tab Navigation (Bottom Tabs):
├── Home (Main station arrivals)
├── Favorites (Station list)
└── Disruptions (Service status)

Stack Navigation:
├── Station Detail
└── Station Search (Modal)
```

---

## Development Phases

### Phase 1: MVP (Minimum Viable Product)
- [ ] Project setup and configuration
- [ ] TfL API integration
- [ ] Station search functionality
- [ ] Real-time arrivals display
- [ ] Favorite stations (local storage)
- [ ] Main station selection
- [ ] Basic UI with pastel theme

### Phase 2: Enhanced Features
- [ ] Service disruptions display
- [ ] Weekend engineering works
- [ ] Pull-to-refresh
- [ ] Auto-refresh arrivals
- [ ] Error handling improvements
- [ ] Loading states and animations

### Phase 3: Polish & UX
- [ ] Refined Animal Crossing aesthetic
- [ ] Illustrations and decorative elements
- [ ] Smooth transitions
- [ ] Haptic feedback
- [ ] Accessibility improvements
- [ ] App icon and splash screen

### Phase 4: Future Enhancements
- [ ] Web platform support
- [ ] Push notifications for disruptions
- [ ] Widget support (iOS/Android)
- [ ] Journey planning
- [ ] Nearby stations (location-based)

---

## Dependencies

### Core Dependencies
```json
{
  "expo": "~50.x.x",
  "react": "18.x.x",
  "react-native": "0.73.x",
  "typescript": "^5.x.x"
}
```

### Navigation
```json
{
  "@react-navigation/native": "^6.x.x",
  "@react-navigation/bottom-tabs": "^6.x.x",
  "@react-navigation/native-stack": "^6.x.x"
}
```

### Storage & State
```json
{
  "@react-native-async-storage/async-storage": "^1.x.x",
  "zustand": "^4.x.x" // or React Context
}
```

### API & Data
```json
{
  "axios": "^1.x.x",
  "date-fns": "^3.x.x" // for time formatting
}
```

### UI Components
```json
{
  "react-native-reanimated": "^3.x.x",
  "react-native-gesture-handler": "^2.x.x",
  "expo-linear-gradient": "~13.x.x",
  "expo-haptics": "~13.x.x"
}
```

---

## Testing Strategy

### Unit Tests
- Utility functions (time formatting, data parsing)
- API response transformation
- State management logic

### Integration Tests
- API integration
- Storage operations
- Navigation flows

### Manual Testing Checklist
- [ ] Add/remove favorite stations
- [ ] Set main station
- [ ] Real-time arrival updates
- [ ] Service disruption display
- [ ] Offline behavior
- [ ] Pull-to-refresh
- [ ] Search functionality
- [ ] Cross-platform testing (iOS/Android)

---

## Security & Privacy

### API Key Management
- Store TfL API keys in `.env` file (not committed to git)
- Use `EXPO_PUBLIC_` prefix for client-accessible variables
- Register for free TfL API key at: https://api-portal.tfl.gov.uk/
- Keys are visible in compiled app (acceptable for public API)
- Rate limiting: 500 requests/minute per key

### Data Privacy
- No backend = no server-side data collection
- All data stored locally on device only
- No user accounts or personal information
- No analytics tracking in MVP
- Transparent about TfL API usage in terms/privacy policy

### Network Security
- HTTPS only for API requests
- Certificate pinning (optional, for added security)

---

## Performance Targets

- **App Launch**: < 2 seconds to interactive
- **API Response**: < 1 second for arrivals
- **Search Response**: < 300ms after typing stops
- **Refresh Rate**: Every 30 seconds for arrivals
- **Bundle Size**: < 50MB total app size

---

## Accessibility

- Screen reader support (VoiceOver/TalkBack)
- Sufficient color contrast (WCAG AA)
- Scalable text sizes
- Touch targets minimum 44x44pt
- Haptic feedback for interactions

---

## Deployment

### Development
- Expo Go for testing
- EAS Build for development builds

### Production
- App Store (iOS)
- Google Play Store (Android)
- EAS Build for production builds
- OTA updates via Expo Updates

---

## Success Metrics

### User Engagement
- Daily active users
- Average session duration
- Number of stations saved per user

### Technical Metrics
- API error rate < 1%
- App crash rate < 0.5%
- Average API response time < 1s

### User Satisfaction
- App store ratings target: 4.5+/5.0
- User feedback monitoring

---

## Known Limitations

1. **No Offline Mode**: Requires internet connection for real-time data
2. **API Dependency**: Service availability depends on TfL API uptime
3. **Limited Transport Modes**: Only Underground, DLR, Elizabeth Line
4. **No User Sync**: Favorites don't sync between devices
5. **Rate Limiting**: TfL API has request limits

---

## Future Considerations

- Push notifications for saved stations
- Apple Watch / Android Wear companion app
- Home screen widgets
- Siri Shortcuts / Google Assistant integration
- Journey planning between stations
- Nearby stations using GPS
- Station maps and facility information
- Web version for broader accessibility
- Multi-language support

---

## References

- [TfL Unified API Documentation](https://api.tfl.gov.uk/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)

---

## Contact & Maintenance

**Repository**: mosesmulwa-bebop/tfl-me  
**Branch**: main  
**Project Status**: In Development  
**Next Review Date**: TBD