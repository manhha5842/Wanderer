# Wanderer - Walk Into a Story 🚶‍♂️📖

Biến mỗi chuyến đi bộ của bạn thành một cuộc phiêu lưu kể chuyện tương tác được tạo bởi AI!

## 🌟 Tính năng chính

### 🗺️ Tạo Tour Đi Bộ Tùy Chỉnh

- Tự động tạo tuyến đường an toàn dựa trên vị trí hiện tại
- Tính toán thời gian và khoảng cách chính xác
- Chia checkpoints thông minh cho hành trình

### 📚 Kể Chuyện Âm Thanh Dựa Trên Vị Trí

- AI tạo câu chuyện độc quyền theo tuyến đường của bạn
- Mỗi địa điểm là một "chương truyện"
- Text-to-Speech chất lượng cao với giọng Việt

### 🎭 Thể Loại Đa Dạng

- **Phiêu lưu** 🗺️ - Khám phá và mạo hiểm
- **Bí ẩn** 🔍 - Giải đố và tìm hiểu
- **Tình cảm** 💕 - Câu chuyện tình yêu
- **Khoa học viễn tưởng** 🚀 - Tương lai và công nghệ
- **Thần thoại** 🧙‍♂️ - Phép thuật và huyền bí
- **Kinh dị** 👻 - Rùng rợn và bí ẩn
- **Hài hước** 😄 - Vui nhộn và thư giãn

### 🎯 Lựa Chọn Tương Tác

- Tại các ngã rẽ, câu chuyện phân nhánh theo hướng bạn đi
- Mỗi lựa chọn tạo ra diễn biến khác nhau
- Không cần nhìn màn hình - chỉ nghe và đi

### 📱 Tính Năng Kỹ Thuật

- **GPS Tracking** - Theo dõi vị trí chính xác
- **Background Audio** - Phát nhạc khi khóa màn hình
- **Checkpoint System** - Kích hoạt câu chuyện tự động
- **Audio Controls** - Tăng/giảm tốc độ, âm lượng

## 🚀 Tech Stack (Free to Test)

### Frontend

- **React Native** with Expo
- **TypeScript**
- **React Native Maps** (OpenStreetMap)

### Backend Services (Free Tiers)

- **OpenRouteService** - Route planning (2000 requests/day)
- **OSRM** - Alternative routing (unlimited)
- **Groq AI** - Story generation (14,400 requests/day)
- **Expo Speech** - Text-to-Speech

### APIs & Dependencies

```json
{
  "expo-location": "GPS và location tracking",
  "expo-av": "Audio playback và recording",
  "expo-speech": "Text-to-speech",
  "react-native-maps": "Bản đồ và navigation",
  "axios": "HTTP requests cho APIs"
}
```

## 📲 Cài Đặt & Chạy

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator hoặc Android device

### Quick Start

```bash
# Clone project
git clone <repository>
cd Wanderer

# Install dependencies
npm install

# Start development server
npm start

# Scan QR code bằng Expo Go app (iOS/Android)
# Hoặc press 'i' cho iOS simulator, 'a' cho Android emulator
```

### Cấu Hình API Keys (Optional)

```typescript
// services/storyService.ts
const GROQ_API_KEY = "your_groq_api_key"; // Free tại groq.com

// services/routeService.ts
const ORS_API_KEY = "your_ors_api_key"; // Free tại openrouteservice.org
```

## 🎮 Cách Sử Dụng

### 1. Onboarding

- Mở app → Cấp quyền Location
- App tự động detect vị trí hiện tại

### 2. Tạo Hành Trình

- Tap **"Tạo tuyến ngẫu nhiên"**
- App tự động tạo route 1-2km từ vị trí hiện tại
- Hiển thị thông tin: khoảng cách, thời gian, số checkpoints

### 3. Chọn Câu Chuyện

- Tap **"Chọn câu chuyện"**
- Chọn thể loại yêu thích (phiêu lưu, tình cảm, bí ẩn...)
- Chọn tâm trạng (thư giãn, kích thích, sáng tạo...)
- Chọn giọng kể chuyện
- AI tạo câu chuyện độc quyền trong ~30 giây

### 4. Bắt Đầu Hành Trình

- Tap **"Bắt đầu đi bộ"**
- Đeo tai nghe, bắt đầu đi theo route trên map
- Câu chuyện tự động phát khi bạn đến gần checkpoints
- Tại ngã rẽ, chọn hướng đi → câu chuyện phân nhánh

### 5. Kết Thúc

- Đến điểm cuối → câu chuyện kết thúc
- Xem thống kê: thời gian, quãng đường, checkpoints hoàn thành
- Có thể lưu lại hoặc tạo hành trình mới

## 🎯 Target Users

### Chính

- **Người đi bộ/tập thể dục** nhưng dễ chán
- **Fan podcast/audiobook** muốn trải nghiệm nhập vai
- **Du khách** muốn khám phá thành phố theo cách mới

### Phụ

- **Người học ngôn ngữ** (nghe tiếng Việt tự nhiên)
- **Gia đình** hoạt động ngoài trời cùng nhau
- **Người thích công nghệ** trải nghiệm AI trong đời sống

## 🔧 Development

### Project Structure

```
Wanderer/
├── app/                 # Expo Router screens
├── components/          # React components
│   ├── MapView.tsx     # React Native Maps integration
│   └── StorySetupScreen.tsx # Story configuration UI
├── services/           # Business logic & API calls
│   ├── locationService.ts   # GPS tracking
│   ├── routeService.ts      # OpenRouteService/OSRM
│   ├── storyService.ts      # AI story generation
│   └── audioService.ts      # Text-to-speech & playback
├── types/              # TypeScript definitions
└── constants/          # App configuration
```

### Key Components

#### LocationService

- GPS permission handling
- Real-time location tracking
- Checkpoint proximity detection
- Background location updates

#### StoryService

- Groq AI integration cho story generation
- Fallback templates khi API offline
- Interactive choices tại junctions
- Multi-language support

#### AudioService

- Expo Speech text-to-speech
- Audio playback controls
- Background audio support
- Speed/volume controls

#### RouteService

- OpenRouteService API integration
- OSRM fallback cho free usage
- Walking route optimization
- POI discovery

## 🌍 Free Tier Limits

| Service          | Free Limit          | Purpose               |
| ---------------- | ------------------- | --------------------- |
| Groq AI          | 14,400 requests/day | Story generation      |
| OpenRouteService | 2,000 requests/day  | Route planning        |
| OSRM             | Unlimited           | Backup routing        |
| Expo Services    | Unlimited           | Development & testing |

**→ Đủ cho 100+ users test mỗi ngày!**

## 🚧 Roadmap

### Phase 1 (Current) - MVP

- [x] Basic route creation
- [x] AI story generation
- [x] GPS tracking
- [x] Audio playback
- [x] Interactive choices

### Phase 2 - Enhancement

- [ ] User accounts & story history
- [ ] Custom route drawing
- [ ] Multiplayer stories
- [ ] Story sharing & rating
- [ ] Offline mode

### Phase 3 - Advanced

- [ ] AR integration
- [ ] Voice commands
- [ ] Smart city partnerships
- [ ] Tourism integration
- [ ] Monetization features

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

**Developer**: [Your Name]
**Email**: [your.email@domain.com]
**Project Link**: [https://github.com/username/wanderer](https://github.com/username/wanderer)

---

_"Không ai nhớ mình đã đi đâu, nhưng ai cũng nhớ một câu chuyện hay gắn với nơi đó."_ ✨
