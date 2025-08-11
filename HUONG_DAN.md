# 🚀 Hướng Dẫn Cài Đặt và Chạy Project Wanderer

Chào mừng bạn đến với Wanderer! Dưới đây là các bước chi tiết để cài đặt và chạy project trên máy của bạn.

---

### **1. Cài Đặt Môi Trường (Nếu chưa có)**

Trước tiên, bạn cần chuẩn bị môi trường phát triển.

- **Node.js**: Cài đặt Node.js phiên bản 18 trở lên. Tải về tại [nodejs.org](https://nodejs.org/).
- **Expo Go**: Tải ứng dụng **Expo Go** trên điện thoại của bạn từ App Store (iOS) hoặc Google Play (Android). Ứng dụng này dùng để chạy project trên thiết bị thật.

---

### **2. Cài Đặt Project**

Mở terminal (hoặc PowerShell) trong thư mục gốc của project (`m:\Project\Wanderer`) và chạy lệnh sau để cài đặt các thư viện cần thiết:

```bash
npm install
```

Lệnh này sẽ tải về tất cả các gói phụ thuộc được định nghĩa trong file `package.json`.

---

### **3. Cấu Hình API Keys (Bước Quan Trọng Nhất)**

Ứng dụng cần các API key để hoạt động đúng các tính năng cốt lõi như bản đồ và AI.

**a. Tạo file `apiKeys.ts`**

Trong thư mục `config`, bạn sẽ thấy một file mẫu tên là `apiKeys.template.ts`. Hãy tạo một bản sao của file này và đổi tên thành `apiKeys.ts`.

Bạn có thể dùng lệnh sau trong terminal tại thư mục gốc:

```bash
# Đối với Windows (Command Prompt hoặc PowerShell)
copy config\apiKeys.template.ts config\apiKeys.ts

# Đối với macOS hoặc Linux
cp config/apiKeys.template.ts config/apiKeys.ts
```

**b. Lấy và điền API Keys**

Mở file `config/apiKeys.ts` vừa tạo và điền các API key của bạn vào.

- **Google Maps API Key**:

  1.  Truy cập [Google Cloud Console](https://console.cloud.google.com/).
  2.  Tạo một project mới.
  3.  Bật các API: `Maps SDK for Android`, `Maps SDK for iOS`, và `Directions API`.
  4.  Tạo một API Key trong mục "Credentials".

- **Gemini API Key**:

  1.  Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey).
  2.  Nhấp vào "Create API key".

- **OpenRouteService API Key**:
  1.  Truy cập [OpenRouteService](https://openrouteservice.org/).
  2.  Đăng ký tài khoản và tạo một API key miễn phí.

Sau khi có đủ các key, hãy điền vào file `config/apiKeys.ts`:

```typescript
// File: config/apiKeys.ts

export const API_KEYS = {
  GOOGLE_MAPS: [
    "DÁN_KEY_GOOGLE_MAPS_CỦA_BẠN_VÀO_ĐÂY",
    // Bạn có thể thêm nhiều key dự phòng ở đây
  ],
  GEMINI: ["DÁN_KEY_GEMINI_CỦA_BẠN_VÀO_ĐÂY"],
  OPENROUTE_SERVICE: ["DÁN_KEY_OPENROUTE_SERVICE_CỦA_BẠN_VÀO_ĐÂY"],
};

// ... (phần còn lại của file giữ nguyên)
```

> **Lưu ý quan trọng**: File `apiKeys.ts` đã được thêm vào `.gitignore` nên sẽ không bị đẩy lên GitHub, giúp bảo mật key của bạn.

---

### **4. Khởi Động Ứng Dụng**

Sau khi hoàn tất các bước trên, bạn đã sẵn sàng để chạy project. Tại thư mục gốc, chạy lệnh:

```bash
npm start
```

Terminal sẽ khởi động Metro Bundler và hiển thị một **mã QR**.

---

### **5. Chạy Trên Điện Thoại**

1.  Mở ứng dụng **Expo Go** trên điện thoại.
2.  Chọn chức năng "Scan QR Code".
3.  Quét mã QR đang hiển thị trên terminal của bạn.
4.  Expo Go sẽ bắt đầu tải gói JavaScript của ứng dụng và chạy nó trên điện thoại của bạn.

Chúc bạn thành công! Nếu gặp bất kỳ vấn đề gì, hãy kiểm tra lại bước cấu hình API key vì đây là lỗi phổ biến nhất.
