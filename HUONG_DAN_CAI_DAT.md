# 🔧 HƯỚNG DẪN CÀI ĐẶT CHI TIẾT - MiniZ Flash

## 📋 Mục lục
1. [Tạo Private Repository cho Firmware](#1-tạo-private-repository-cho-firmware)
2. [Cài đặt Cloudflare Worker](#2-cài-đặt-cloudflare-worker)
3. [Tạo KV Namespace](#3-tạo-kv-namespace)
4. [Cập nhật Frontend](#4-cập-nhật-frontend)
5. [Kiểm tra hoạt động](#5-kiểm-tra-hoạt-động)

---

## 1. Tạo Private Repository cho Firmware

### Bước 1.1: Tạo repo mới
1. Truy cập: https://github.com/new
2. Điền thông tin:
   - **Repository name**: `minizflash-private`
   - **Description**: `Private firmware storage`
   - ⚠️ **QUAN TRỌNG**: Chọn **Private** (không phải Public!)
   - Click **Create repository**

### Bước 1.2: Upload firmware
1. Sau khi tạo repo, click **uploading an existing file**
2. Kéo thả các file firmware vào:
   - `firmware/MiniZ_v1.0.bin`
   - `firmware/MiniZ_v2.0.bin`
   - (tất cả file .bin của bạn)
3. Click **Commit changes**

### Bước 1.3: Tạo Personal Access Token
1. Truy cập: https://github.com/settings/tokens
2. Click **Generate new token** → **Generate new token (classic)**
3. Điền:
   - **Note**: `minizflash-firmware-access`
   - **Expiration**: Chọn thời hạn (khuyến nghị 90 days hoặc No expiration)
   - **Select scopes**: Tick ✅ `repo` (Full control of private repositories)
4. Click **Generate token**
5. ⚠️ **COPY TOKEN NGAY** - bạn sẽ không thể xem lại!
   - Token có dạng: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Lưu vào notepad tạm thời

---

## 2. Cài đặt Cloudflare Worker

### Bước 2.1: Truy cập Cloudflare Dashboard
1. Đăng nhập: https://dash.cloudflare.com
2. Ở menu bên trái, click **Workers & Pages**

### Bước 2.2: Tạo Worker mới
1. Click **Create application**
2. Chọn **Create Worker**
3. Đặt tên: `minizflash-api`
4. Click **Deploy**

### Bước 2.3: Chỉnh sửa code Worker
1. Sau khi deploy, click **Edit code**
2. **XÓA HẾT** code mặc định
3. Mở file `cloudflare-worker.js` trong dự án
4. **COPY TOÀN BỘ** nội dung và dán vào editor
5. Tìm và sửa các giá trị sau:

```javascript
// Tìm dòng này (khoảng dòng 4-8):
const CONFIG = {
    TURNSTILE_SECRET: '0x4AAAAAAACDiqpablKrVCk3s-1XQpd26ILE',
    GITHUB_TOKEN: 'ghp_YOUR_GITHUB_TOKEN_HERE',  // ← THAY TOKEN Ở ĐÂY
    GITHUB_REPO: 'giongaysau-stack/minizflash-private',
    SECRET_KEY: 'your-super-secret-key-change-this'  // ← ĐỔI THÀNH KEY BÍ MẬT
};
```

**Thay thế:**
- `ghp_YOUR_GITHUB_TOKEN_HERE` → Token bạn đã copy ở bước 1.3
- `your-super-secret-key-change-this` → Đặt 1 chuỗi bí mật bất kỳ (ví dụ: `miniz-secret-2024-xyz`)

6. Click **Save and Deploy**

### Bước 2.4: Lấy URL Worker
Sau khi deploy, bạn sẽ thấy URL như:
```
https://minizflash-api.YOUR_SUBDOMAIN.workers.dev
```
**Copy URL này** - sẽ dùng ở bước 4

---

## 3. Tạo KV Namespace

### Bước 3.1: Tạo KV Storage
1. Ở menu trái, click **KV**
2. Click **Create a namespace**
3. Đặt tên: `LICENSE_BINDINGS`
4. Click **Add**

### Bước 3.2: Liên kết KV với Worker
1. Quay lại **Workers & Pages**
2. Click vào worker `minizflash-api`
3. Click tab **Settings**
4. Kéo xuống tìm **Variables** → **KV Namespace Bindings**
5. Click **Add binding**
6. Điền:
   - **Variable name**: `LICENSE_BINDINGS`
   - **KV namespace**: Chọn `LICENSE_BINDINGS` từ dropdown
7. Click **Save**

---

## 4. Cập nhật Frontend

### Bước 4.1: Cập nhật app.js
Mở file `app.js` và thêm URL Worker:

Tìm đoạn code kết nối firmware và thay đổi để gọi Worker thay vì download trực tiếp.

### Bước 4.2: Xóa firmware khỏi public repo
⚠️ **QUAN TRỌNG**: Sau khi Worker hoạt động, xóa folder `firmware/` khỏi repo public!

```bash
# Chạy trong terminal
git rm -r firmware/
git commit -m "Remove firmware from public repo"
git push
```

---

## 5. Kiểm tra hoạt động

### Bước 5.1: Test API
Mở trình duyệt và truy cập:
```
https://minizflash-api.YOUR_SUBDOMAIN.workers.dev/api/validate-license?key=MZxA-1234-5678-9012&mac=AA:BB:CC:DD:EE:FF
```

Nếu thành công, bạn sẽ thấy:
```json
{"success": true, "message": "License hợp lệ"}
```

### Bước 5.2: Test download firmware
```
https://minizflash-api.YOUR_SUBDOMAIN.workers.dev/api/download-firmware?key=LICENSE_KEY&mac=MAC_ADDRESS&firmware=MiniZ_v1.0.bin
```

---

## 🔐 Danh sách License Keys

Đây là 50 license keys đã cài đặt:

| STT | License Key |
|-----|-------------|
| 1 | MZxA-1234-5678-9012 |
| 2 | MZxA-2345-6789-0123 |
| 3 | MZxA-3456-7890-1234 |
| 4 | MZxA-4567-8901-2345 |
| 5 | MZxA-5678-9012-3456 |
| 6 | MZxA-6789-0123-4567 |
| 7 | MZxA-7890-1234-5678 |
| 8 | MZxA-8901-2345-6789 |
| 9 | MZxA-9012-3456-7890 |
| 10 | MZxA-0123-4567-8901 |
| 11 | MZxA-ABCD-EFGH-IJKL |
| 12 | MZxA-MNOP-QRST-UVWX |
| 13 | MZxA-YZAB-CDEF-GHIJ |
| 14 | MZxA-KLMN-OPQR-STUV |
| 15 | MZxA-WXYZ-1234-ABCD |
| 16 | MZxA-EFGH-5678-IJKL |
| 17 | MZxA-MNOP-9012-QRST |
| 18 | MZxA-UVWX-3456-YZAB |
| 19 | MZxA-CDEF-7890-GHIJ |
| 20 | MZxA-KLMN-1357-OPQR |
| 21 | MZxA-STUV-2468-WXYZ |
| 22 | MZxA-ABCD-3579-EFGH |
| 23 | MZxA-IJKL-4680-MNOP |
| 24 | MZxA-QRST-5791-UVWX |
| 25 | MZxA-YZAB-6802-CDEF |
| 26 | MZxA-GHIJ-7913-KLMN |
| 27 | MZxA-OPQR-8024-STUV |
| 28 | MZxA-WXYZ-9135-ABCD |
| 29 | MZxA-EFGH-0246-IJKL |
| 30 | MZxA-MNOP-1357-QRST |
| 31 | MZxA-PRO1-2024-VN01 |
| 32 | MZxA-PRO2-2024-VN02 |
| 33 | MZxA-PRO3-2024-VN03 |
| 34 | MZxA-PRO4-2024-VN04 |
| 35 | MZxA-PRO5-2024-VN05 |
| 36 | MZxA-GOLD-1111-2222 |
| 37 | MZxA-GOLD-3333-4444 |
| 38 | MZxA-GOLD-5555-6666 |
| 39 | MZxA-GOLD-7777-8888 |
| 40 | MZxA-GOLD-9999-0000 |
| 41 | MZxA-VIP1-AAAA-BBBB |
| 42 | MZxA-VIP2-CCCC-DDDD |
| 43 | MZxA-VIP3-EEEE-FFFF |
| 44 | MZxA-VIP4-GGGG-HHHH |
| 45 | MZxA-VIP5-IIII-JJJJ |
| 46 | MZxA-TEST-1234-5678 |
| 47 | MZxA-DEMO-ABCD-EFGH |
| 48 | MZxA-TRIAL-9999-8888 |
| 49 | MZxA-ADMIN-0000-1111 |
| 50 | MZxA-MASTER-ZZZZ-9999 |

---

## ❓ Xử lý lỗi thường gặp

### Lỗi: "License không hợp lệ"
- Kiểm tra license key có đúng trong danh sách không
- Kiểm tra định dạng: `MZxA-XXXX-XXXX-XXXX`

### Lỗi: "MAC address đã được sử dụng"
- Mỗi license chỉ bind được với 1 MAC address
- Liên hệ admin để reset binding trong KV

### Lỗi: "Failed to fetch firmware"
- Kiểm tra GitHub Token còn hạn không
- Kiểm tra repo private có file firmware không
- Kiểm tra tên file firmware đúng không

### Lỗi: CORS
- Thêm domain vào allowed origins trong Worker config

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. Console log trong trình duyệt (F12 → Console)
2. Worker logs trong Cloudflare Dashboard
3. KV bindings đã được thiết lập đúng chưa

---

## 🎉 Hoàn tất!

Sau khi hoàn thành tất cả các bước:
- ✅ Firmware được bảo vệ trong private repo
- ✅ Chỉ user có license hợp lệ mới download được
- ✅ Mỗi license chỉ dùng được trên 1 thiết bị
- ✅ Không ai có thể "đào" firmware từ trang web
