# Wanderer Configuration Guide

## Quick Setup cho Testing (5-10 người)

### 1. Clone & Install

```bash
git clone <repository>
cd Wanderer
npm install
npm start
```

### 2. API Keys (Optional nhưng recommended)

#### Groq AI (Free: 14,400 requests/day)

1. Đăng ký tại: https://console.groq.com/
2. Tạo API key
3. Copy vào `config/apiKeys.ts`:

```typescript
GROQ: ["your_groq_api_key_here"];
```

#### OpenRouteService (Free: 2,000 requests/day)

1. Đăng ký tại: https://openrouteservice.org/dev/#/signup
2. Tạo API key
3. Copy vào `config/apiKeys.ts`:

```typescript
OPENROUTE_SERVICE: ["your_ors_api_key_here"];
```

### 3. Test trên điện thoại

1. Cài **Expo Go** app (iOS/Android)
2. Scan QR code từ terminal
3. Cấp quyền Location khi app yêu cầu
4. Test tạo route + story generation

## Fallback Options (Không cần API keys)

Nếu không muốn setup API keys, app vẫn hoạt động với:

- **OSRM** cho routing (unlimited, free)
- **Fallback story templates** cho story generation
- **Expo Speech** cho text-to-speech

## Testing Checklist

### Core Features ✅

- [ ] Location permission granted
- [ ] Map hiển thị vị trí user
- [ ] Tạo route ngẫu nhiên thành công
- [ ] Story setup screen hiển thị các options
- [ ] Story generation (AI hoặc fallback)
- [ ] GPS tracking khi đi bộ
- [ ] Audio playback (text-to-speech)
- [ ] Checkpoint detection
- [ ] Story choices tại junctions

### Performance ✅

- [ ] App start < 5s
- [ ] Route generation < 10s
- [ ] Story generation < 30s
- [ ] GPS update mỗi 3-5s
- [ ] Audio playback smooth
- [ ] Background audio khi lock screen

### UX ✅

- [ ] Onboarding flow rõ ràng
- [ ] Error messages hữu ích
- [ ] Loading states hiển thị
- [ ] Map navigation intuitive
- [ ] Audio controls accessible

## Troubleshooting

### Location Issues

```bash
# iOS Simulator
Device > Location > Apple (Cupertino)

# Android Emulator
Settings > Location > Turn On
Extended Controls > Location > Set coordinates
```

### Audio Issues

```bash
# iOS
Settings > Privacy > Microphone > Expo Go (Allow)

# Android
Settings > Apps > Expo Go > Permissions > Microphone (Allow)
```

### API Errors

```bash
# Check network connection
# Verify API keys format
# Check API quotas/limits
# Use fallback services
```

## Usage Scenarios cho Testing

### Scenario 1: Full Experience

1. Mở app → Cấp permissions
2. Tạo route ngẫu nhiên
3. Chọn genre "Phiêu lưu", mood "Kích thích"
4. Generate AI story
5. Bắt đầu đi bộ với audio
6. Test checkpoint detection (di chuyển 20-30m)

### Scenario 2: Quick Test

1. Mở app → Cấp permissions
2. Tạo route ngẫu nhiên
3. Skip story setup → Đi bộ không có truyện
4. Test GPS tracking basic

### Scenario 3: Indoor Testing

1. Mở app → Cấp permissions
2. Fake location bằng simulator
3. Test tất cả UI flows
4. Test story generation offline

## Resource Usage

### Network:

- Route generation: ~50KB per request
- Story generation: ~100KB per request
- Maps tiles: ~1MB per area
- **Total**: ~2-5MB per session

### Battery:

- GPS tracking: ~10-20% per hour
- Audio playback: ~5% per hour
- **Total**: ~15-25% per hour

### Storage:

- App size: ~50MB
- Temporary audio: ~1-5MB per story
- **Total**: ~55MB

## Demo Script

### 30s Pitch

> "Wanderer biến đi bộ thành game RPG ngoài đời thực. Bạn chọn đường đi, AI tạo câu chuyện riêng. Mỗi ngã rẽ là một lựa chọn trong truyện. Vừa tập thể dục, vừa giải trí!"

### 2min Demo

1. **Mở app** - "Đây là Wanderer, app đi bộ kể chuyện"
2. **Location** - "App detect vị trí để tạo route phù hợp"
3. **Create route** - "Tự động tạo tuyến 1-2km quanh đây"
4. **Story setup** - "Chọn thể loại: tình cảm, phiêu lưu, bí ẩn..."
5. **AI generation** - "AI tạo câu chuyện riêng cho route này"
6. **Walking mode** - "Bắt đầu đi, câu chuyện phát tự động"
7. **Choices** - "Tại ngã rẽ, chọn hướng → truyện phân nhánh"

## Next Steps

### Immediate (1-2 tuần)

- [ ] Fix bugs từ user feedback
- [ ] Optimize performance
- [ ] Add more story templates
- [ ] Improve audio quality

### Short-term (1 tháng)

- [ ] User accounts & history
- [ ] Story sharing features
- [ ] Multiple languages
- [ ] Offline mode

### Long-term (3-6 tháng)

- [ ] Multiplayer stories
- [ ] AR integration
- [ ] Tourism partnerships
- [ ] Monetization strategy
