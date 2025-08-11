# 🚶‍♂️ Wanderer - Interactive Walking Story App

Ứng dụng khám phá thành phố với trải nghiệm storytelling AI tương tác và route finding thông minh.

## ✨ Features

- 🗺️ **Smart Route Finding**: Google Maps + OpenRouteService + Enhanced fallback
- 🤖 **AI Storytelling**: Groq API với multiple key rotation
- 📍 **Interactive Map**: Tap để chọn checkpoint và xem route real-time
- 🎯 **Location Tracking**: GPS tracking với progress calculation
- 🔄 **API Key Management**: Secure key rotation system
- 📱 **Cross Platform**: React Native + Expo

## 🏗️ Architecture

### Core Services

- **routeService**: Multi-provider routing (Google Maps → ORS → Fallback)
- **googleMapsService**: Google Directions API integration
- **geminiService**: AI story generation với Groq
- **locationService**: GPS tracking và progress monitoring
- **apiKeyManager**: Secure key management với auto-rotation

### Key Components

- **PrepareScreen**: Interactive map với route selection
- **WalkingScreen**: Real-time tracking với story narration
- **MapView**: react-native-maps với polyline rendering

## 🔑 API Setup (QUAN TRỌNG)

### Bước 1: Copy API Keys Template

```bash
cp config/apiKeys.template.ts config/apiKeys.ts
```

### Bước 2: Cấu hình API Keys

Chỉnh sửa `config/apiKeys.ts`:

```typescript
export const API_KEYS = {
  GOOGLE_MAPS: [
    "YOUR_GOOGLE_MAPS_KEY_1", // Replace with real key
    "YOUR_GOOGLE_MAPS_KEY_2", // Backup key (optional)
  ],
  GROQ: [
    "YOUR_GROQ_KEY_1", // Replace with real key
    "YOUR_GROQ_KEY_2", // Backup key (optional)
  ],
  OPENROUTE_SERVICE: [
    "YOUR_ORS_KEY_1", // Replace with real key
    "YOUR_ORS_KEY_2", // Backup key (optional)
  ],
};
```

### Cách lấy API Keys:

#### 🗺️ Google Maps API

1. [Google Cloud Console](https://console.cloud.google.com/) → Create Project
2. Enable APIs: Maps SDK, Directions API, Geocoding API
3. Create Credentials → API Key
4. Restrict key cho security

#### 🤖 Groq API

1. [Groq Console](https://console.groq.com/) → Sign up
2. Create API Key
3. Copy key

#### 🗺️ OpenRouteService

1. [OpenRouteService](https://openrouteservice.org/) → Sign up
2. Create API Key
3. Copy key

## 🚀 Installation & Run

```bash
# Install dependencies
npm install

# Copy API keys (QUAN TRỌNG!)
cp config/apiKeys.template.ts config/apiKeys.ts
# Sau đó edit config/apiKeys.ts với keys thật

# Start development server
npm start

# Run on device
npm run android  # hoặc
npm run ios
```

## 🛠️ Project Structure

```
src/
├── components/           # UI Components
│   ├── PrepareScreen.tsx    # Map-based route selection
│   ├── WalkingScreen.tsx    # Real-time tracking
│   └── MapView.tsx          # Interactive map component
├── services/             # Core Services
│   ├── routeService.ts      # Multi-provider routing
│   ├── googleMapsService.ts # Google Maps integration
│   ├── geminiService.ts     # AI storytelling
│   ├── locationService.ts   # GPS tracking
│   └── storyService.ts      # Story management
├── config/              # Configuration
│   ├── apiKeyManager.ts     # Secure key management
│   ├── apiKeys.template.ts  # Keys template
│   └── apiKeys.ts          # Real keys (gitignored)
└── types/               # TypeScript types
```

## 🔒 Security Features

- ✅ API keys stored in gitignored files
- ✅ Template-based configuration
- ✅ Automatic key rotation on limits
- ✅ Multiple backup keys per service
- ✅ No hardcoded credentials

## 🧭 User Flow

1. **Start Screen**: Chọn mode và settings
2. **Prepare Screen**:
   - Tap map để chọn checkpoint
   - Xem route được tính real-time
   - Configure story settings
3. **Walking Screen**:
   - Real-time GPS tracking
   - AI story narration
   - Progress visualization
4. **Summary Screen**: Review journey và story

## 🔧 Troubleshooting

### "No Google Maps API keys configured"

```bash
# Check if apiKeys.ts exists
ls config/apiKeys.ts

# Make sure GOOGLE_MAPS array has valid keys
```

### Route calculation errors

1. Check Google Maps API key có enable Directions API
2. Verify ORS key còn quota
3. App sẽ fallback sang enhanced algorithm nếu tất cả fail

### App crashes on map

1. Ensure react-native-maps được setup đúng
2. Check Google Maps key có enable Maps SDK
3. Restart Metro bundler

## 📊 API Key Management Features

- **Auto-rotation**: Switch keys khi hit limits
- **Health monitoring**: Track key status và quota
- **Fallback system**: Multiple providers per service
- **Debug logging**: Monitor API calls và key usage

## 🌟 Advanced Features

- **Smart Routing**: Combines Google Maps accuracy với fallback algorithms
- **Dynamic Storytelling**: AI adapts stories based on real locations
- **Progress Tracking**: Real-time distance/time calculations
- **Interactive Maps**: Touch-based route planning
- **Cross-platform**: Single codebase cho iOS và Android

---

Developed with ❤️ using React Native + Expo
