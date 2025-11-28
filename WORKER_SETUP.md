# 🔒 Hướng dẫn Bảo mật Firmware với Cloudflare Workers

## Tổng quan

Giải pháp này bảo vệ firmware của bạn bằng cách:
1. **Firmware được lưu ở nơi private** (không public)
2. **Chỉ Cloudflare Worker có thể truy cập firmware**
3. **User phải có license key hợp lệ** để download
4. **License key được bind với MAC address** của thiết bị

## 🚀 Bước 1: Tạo Private Repository cho Firmware

1. Tạo repo mới trên GitHub: `minizflash-private` (PRIVATE)
2. Upload các file firmware vào repo đó
3. Tạo Personal Access Token:
   - GitHub → Settings → Developer settings → Personal access tokens
   - Generate new token với quyền `repo`
   - Lưu token này

## 🔧 Bước 2: Deploy Cloudflare Worker

### 2.1. Tạo Worker

1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Chọn **Workers & Pages**
3. Click **Create Application** → **Create Worker**
4. Đặt tên: `minizflash-api`
5. Click **Deploy**

### 2.2. Thêm code

1. Click **Edit code**
2. Copy toàn bộ nội dung file `cloudflare-worker.js` 
3. Paste vào editor
4. **QUAN TRỌNG**: Thay đổi các giá trị trong CONFIG:
   - `SECRET_KEY`: Đổi thành key bí mật của bạn
   - `TURNSTILE_SECRET`: Key từ Cloudflare Turnstile
   - `FIRMWARE_URLS`: URLs đến firmware trong private repo

### 2.3. Thêm KV Namespace (để lưu license bindings)

1. Trong Worker, vào **Settings** → **Variables**
2. **KV Namespace Bindings** → Add binding
3. Tạo mới hoặc chọn KV namespace có sẵn
4. Variable name: `LICENSE_BINDINGS`

### 2.4. Deploy

1. Click **Save and Deploy**
2. Note lại URL của Worker: `https://minizflash-api.your-subdomain.workers.dev`

## 🔗 Bước 3: Cập nhật Frontend

Thay đổi trong `app.js` để gọi Worker API thay vì tải firmware trực tiếp:

```javascript
// Thay đổi URL này
const WORKER_URL = 'https://minizflash-api.your-subdomain.workers.dev';

// Validate license qua Worker
async function validateLicenseViaWorker(licenseKey, macAddress) {
    const response = await fetch(`${WORKER_URL}/api/validate-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, macAddress })
    });
    return await response.json();
}

// Download firmware qua Worker
async function downloadFirmwareViaWorker(firmwareId, accessToken, macAddress) {
    const response = await fetch(`${WORKER_URL}/api/download-firmware`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firmwareId, accessToken, macAddress })
    });
    
    if (!response.ok) {
        throw new Error('Failed to download firmware');
    }
    
    return await response.arrayBuffer();
}
```

## 🛡️ Bước 4: Xóa firmware public

1. Xóa folder `firmware/` trong repo public
2. Hoặc thay bằng file giả/demo

## 📊 Luồng hoạt động

```
User nhập License Key
        ↓
Frontend gửi đến Worker API
        ↓
Worker xác thực key + MAC
        ↓
Worker kiểm tra binding trong KV
        ↓
Nếu hợp lệ → Trả về Access Token
        ↓
Frontend dùng Access Token để request firmware
        ↓
Worker xác thực token → Fetch firmware từ private source
        ↓
Trả firmware về cho user
        ↓
Flash vào ESP32
```

## ⚠️ Lưu ý bảo mật

1. **KHÔNG BAO GIỜ** commit `SECRET_KEY` lên GitHub public
2. **KHÔNG** để firmware trong repo public
3. **KHÔNG** log license keys
4. Dùng **Environment Variables** trong Worker cho các secrets
5. Set **Rate Limiting** để chống brute force

## 🔑 Quản lý License Keys

### Thêm key mới:
Thêm vào Set `VALID_KEYS` trong Worker code

### Xóa/vô hiệu hóa key:
Xóa khỏi Set `VALID_KEYS`

### Xem bindings:
Vào Cloudflare Dashboard → KV → Xem data

### Reset binding:
Xóa entry trong KV namespace

## 💰 Chi phí

Cloudflare Workers Free Plan:
- 100,000 requests/ngày
- 10ms CPU time/request
- KV: 100,000 reads/ngày, 1,000 writes/ngày

**Đủ cho hầu hết use cases!**

## 🆘 Troubleshooting

### "Invalid access token"
- Token hết hạn (5 phút)
- MAC address không khớp

### "License bound to another device"
- Key đã được dùng trên thiết bị khác
- Cần reset trong KV

### CORS errors
- Kiểm tra ALLOWED_ORIGINS trong Worker
- Thêm domain của bạn vào danh sách
