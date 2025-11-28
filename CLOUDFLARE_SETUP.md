# 🛡️ Hướng dẫn cấu hình Cloudflare Turnstile cho MiniZ Flash

## 📋 Tổng quan

Cloudflare Turnstile là giải pháp CAPTCHA thay thế reCAPTCHA, miễn phí và thân thiện với người dùng. Tài liệu này hướng dẫn cách tích hợp Turnstile vào trang ESP Web Flasher trên GitHub Pages.

## 🚀 Bước 1: Tạo tài khoản Cloudflare

1. Truy cập [Cloudflare Dashboard](https://dash.cloudflare.com/sign-up)
2. Đăng ký tài khoản miễn phí
3. Xác nhận email

## 🔧 Bước 2: Tạo Turnstile Site

1. Đăng nhập Cloudflare Dashboard
2. Vào **Turnstile** từ menu bên trái
3. Nhấn **Add Site**
4. Điền thông tin:
   - **Site name**: `MiniZ Flash ESP Flasher`
   - **Domain**: `your-username.github.io` (thay bằng username GitHub của bạn)
   - **Widget Mode**: `Managed` (khuyến nghị)
5. Nhấn **Create**
6. **LƯU LẠI Site Key** (dạng: `0x4AAAAAABxxxxxxxxxxxxxxx`)

## ⚙️ Bước 3: Cấu hình trong code

### 3.1. Cập nhật `index.html`

Tìm dòng:
```html
data-sitekey="YOUR_CLOUDFLARE_TURNSTILE_SITE_KEY"
```

Thay bằng Site Key thực của bạn:
```html
data-sitekey="0x4AAAAAABxxxxxxxxxxxxxxx"
```

### 3.2. Cập nhật `cloudflare-config.js`

```javascript
TURNSTILE_SITE_KEY: '0x4AAAAAABxxxxxxxxxxxxxxx', // Site Key của bạn
ALLOWED_DOMAINS: [
    'your-username.github.io',  // Username GitHub của bạn
    'localhost',
    '127.0.0.1'
],
```

### 3.3. Cập nhật `security.js`

```javascript
this.trustedOrigins = [
    'your-username.github.io',  // Username GitHub của bạn
    'localhost',
    '127.0.0.1',
    ''
];
```

## 📤 Bước 4: Upload lên GitHub Pages

1. Commit tất cả các file đã thay đổi
2. Push lên repository GitHub của bạn
3. Đảm bảo GitHub Pages đã được bật:
   - Settings > Pages > Source: `main` branch

## ✅ Bước 5: Kiểm tra

1. Truy cập `https://your-username.github.io/your-repo/`
2. Kiểm tra:
   - [ ] Trang hiển thị overlay bảo mật
   - [ ] Widget Turnstile hiển thị đúng
   - [ ] Sau khi xác thực, chuyển sang giao diện chính
   - [ ] Console không có lỗi

## 🔒 Cấu hình bảo mật nâng cao

### Widget Modes

| Mode | Mô tả | Khi nào dùng |
|------|-------|--------------|
| `Managed` | Tự động quyết định | Mặc định, phù hợp đa số |
| `Non-interactive` | Không cần click | UX tốt hơn, ít bảo mật hơn |
| `Invisible` | Hoàn toàn ẩn | Bảo mật cao nhất |

### Thêm domains

Nếu cần thêm domain (ví dụ: custom domain):
1. Quay lại Cloudflare Turnstile Dashboard
2. Chọn site đã tạo
3. Thêm domain mới vào danh sách

## 🐛 Xử lý lỗi thường gặp

### "Widget không hiển thị"

1. Kiểm tra Site Key đúng chưa
2. Kiểm tra domain đã được thêm vào Turnstile settings chưa
3. Kiểm tra HTTPS (GitHub Pages mặc định có HTTPS)

### "Token expired"

Token Turnstile có thời hạn 5 phút. Widget sẽ tự động refresh khi hết hạn.

### "Invalid domain"

Đảm bảo domain trong Turnstile settings khớp chính xác với domain GitHub Pages.

## 📊 Monitoring

Theo dõi thống kê trong Cloudflare Dashboard:
- Số lượng challenges
- Pass rate
- Blocked attempts

## 🆘 Hỗ trợ

- [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [GitHub Issues](https://github.com/giongaysau-stack/minizflash/issues)

---

## 📁 Cấu trúc file đề xuất

```
your-repo/
├── index.html              # Trang chính
├── app.js                  # Logic ứng dụng
├── styles.css              # CSS styles
├── security.js             # Security manager
├── license.js              # License manager
├── cloudflare-config.js    # Cấu hình Cloudflare
├── README.md               # Hướng dẫn người dùng
├── CLOUDFLARE_SETUP.md     # File này
└── firmware/               # Thư mục chứa firmware
    ├── firmware1.bin
    ├── firmware2.bin
    ├── firmware3.bin
    └── firmware_demo.bin
```

## 🔑 Lưu ý bảo mật

1. **KHÔNG bao giờ commit Secret Key** vào repository public
2. Site Key có thể để public (chỉ dùng cho client-side)
3. Nếu cần server-side verification, sử dụng Cloudflare Workers hoặc backend riêng
