# 🔒 MiniZ Flash - ESP Web Flasher với Bảo mật Cloudflare

🔥 Web-based firmware flasher cho ESP32/ESP8266 với hệ thống license key và bảo mật Cloudflare Turnstile.

## 🌐 Demo

👉 **[Truy cập Web Flasher](https://giongaysau-stack.github.io/minizflash/)**

## ✨ Tính năng

- 🛡️ **Xác thực Cloudflare Turnstile** - Bảo vệ chống bot và spam
- 🔑 **License Key Management** - Hệ thống key binding theo MAC address
- ⚡ **ESP32/ESP8266 Web Flasher** - Nạp firmware trực tiếp từ trình duyệt
- 🔐 **End-to-End Security** - Mã hóa và bảo vệ firmware
- 📱 **Responsive Design** - Hoạt động trên mọi thiết bị
- 📊 **Progress Tracking** - Theo dõi tiến trình real-time

## 🚀 Quick Start

1. Mở trang web trên Chrome/Edge/Opera
2. Hoàn thành xác thực Cloudflare
3. Kết nối ESP32/ESP8266 vào máy tính
4. Click "Kết nối thiết bị"
5. Chọn firmware, nhập license key (nếu cần)
6. Bấm nạp và chờ hoàn thành

## 📦 Firmware có sẵn

| Firmware | Mô tả | License |
|----------|-------|---------|
| Firmware Pro | Đầy đủ tính năng | ✅ Yêu cầu |
| Firmware Standard | Phiên bản tiêu chuẩn | ✅ Yêu cầu |
| Firmware Premium | Phiên bản cao cấp | ✅ Yêu cầu |
| Firmware Demo | Dùng thử | ❌ Miễn phí |

## 🔑 License Keys

### Format key
```
MZxA-xxxx-xxxx-xxxx
```
Ví dụ: `MZ1A-K9X4-7P2M-5R8T`

### Cách hoạt động
1. Người dùng nhập license key
2. Key được validate với danh sách hợp lệ
3. Key được bind với MAC address của thiết bị ESP
4. Mỗi key chỉ dùng được trên 1 thiết bị

Liên hệ để mua license key cho các Firmware Premium.

## 🛡️ Bảo mật Cloudflare

Trang web được bảo vệ bởi Cloudflare Turnstile:
- Chống bot và spam tự động
- Không cần giải captcha
- Bảo vệ download firmware trái phép

Xem hướng dẫn cấu hình: [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md)

## 💻 Yêu cầu

- Trình duyệt: Chrome 89+, Edge 89+, Opera 76+
- Thiết bị: ESP32, ESP8266, ESP32-S2, ESP32-S3, ESP32-C3
- **KHÔNG hỗ trợ**: Firefox, Safari (chưa có Web Serial API)

## 📁 Cấu trúc dự án

```
minizflash/
├── index.html              # Trang chính với Cloudflare overlay
├── app.js                  # Logic ứng dụng ESP Flasher
├── styles.css              # Giao diện với security styles
├── security.js             # Quản lý bảo mật và session
├── license.js              # Quản lý license key
├── cloudflare-config.js    # Cấu hình Cloudflare
├── CLOUDFLARE_SETUP.md     # Hướng dẫn cấu hình
└── firmware/               # Firmware files
```

## 📝 License

MIT License

---

Made with ❤️ by MiniZ Team | 🛡️ Protected by Cloudflare
