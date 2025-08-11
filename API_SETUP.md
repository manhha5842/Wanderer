# 🔑 API Key Setup Guide

## Quan trọng: Setup API Keys trước khi chạy app

### Bước 1: Copy template file

```bash
cp config/apiKeys.template.ts config/apiKeys.ts
```

### Bước 2: Lấy API Keys

#### 🗺️ Google Maps API Key

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Enable APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Directions API
   - Geocoding API
4. Tạo API key trong "Credentials"
5. Restrict API key (recommended):
   - Application restrictions: Android apps / iOS apps
   - API restrictions: Chỉ chọn APIs cần thiết

#### 🤖 Gemini API Key (cho AI storytelling)

1. Vào [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API key"
3. Copy key

#### 🗺️ OpenRouteService API Key (backup routing)

1. Vào [OpenRouteService](https://openrouteservice.org/)
2. Đăng ký account
3. Tạo API key mới
4. Copy key

### Bước 3: Cập nhật config/apiKeys.ts

```typescript
export const API_KEYS = {
  GOOGLE_MAPS: [
    "your-google-maps-key-1",
    "your-google-maps-key-2", // Backup keys
  ],
  GEMINI: ["your-gemini-key-1", "your-gemini-key-2"],
  OPENROUTE_SERVICE: ["your-ors-key-1", "your-ors-key-2"],
};

export const API_CONFIG = {
  ENABLE_GOOGLE_MAPS: true,
  ENABLE_GEMINI: true,
  ENABLE_ORS: true,
  AUTO_SWITCH_KEYS: true,
  DEBUG_API_CALLS: false,
};
```

### Bước 4: Kiểm tra setup

```bash
# Install dependencies
npm install

# Start app
npm start
```

## 🔒 Security Notes

- ✅ File `config/apiKeys.ts` được ignore bởi git
- ✅ Không bao giờ commit API keys
- ✅ App có multiple key fallback system
- ✅ Auto key rotation khi hit limits

## 🛠️ Troubleshooting

### "No Google Maps API keys configured"

- Kiểm tra file `config/apiKeys.ts` tồn tại
- Kiểm tra API_KEYS.GOOGLE_MAPS có keys

### "Google Directions API error: REQUEST_DENIED"

- Kiểm tra API key hợp lệ
- Enable Directions API trong Google Cloud Console
- Kiểm tra API restrictions

### App không load map

- Kiểm tra Google Maps API key
- Enable Maps SDK for Android/iOS
- Restart Metro bundler

## 📊 Features

- ✅ Multiple API key rotation
- ✅ Automatic fallback khi key hết quota
- ✅ Debug logging
- ✅ Service health monitoring
- ✅ Git-safe configuration
