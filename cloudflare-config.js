/**
 * MiniZ Flash - Cloudflare Configuration
 * Cấu hình Cloudflare Turnstile cho bảo mật
 * 
 * HƯỚNG DẪN CẤU HÌNH:
 * 1. Đăng ký tài khoản Cloudflare: https://dash.cloudflare.com/sign-up
 * 2. Vào Cloudflare Dashboard > Turnstile
 * 3. Tạo một site mới với domain GitHub Pages của bạn
 * 4. Copy Site Key và thay vào TURNSTILE_SITE_KEY bên dưới
 * 5. Secret Key chỉ dùng cho server-side verification (không cần cho GitHub Pages)
 */

const CloudflareConfig = {
    // ============================================
    // THAY ĐỔI CÁC GIÁ TRỊ NÀY
    // ============================================
    
    // Site Key từ Cloudflare Turnstile Dashboard
    // Lấy từ: https://dash.cloudflare.com/?to=/:account/turnstile
    TURNSTILE_SITE_KEY: '0x4AAAAAAACDiqtq-o8UGuqXd',
    
    // Domain được phép sử dụng (GitHub Pages của bạn)
    ALLOWED_DOMAINS: [
        'your-username.github.io',  // Thay bằng username GitHub của bạn
        'giongaysau-stack.github.io',
        'localhost',
        '127.0.0.1'
    ],
    
    // ============================================
    // CẤU HÌNH NÂNG CAO
    // ============================================
    
    // Thời gian hết hạn token (ms)
    TOKEN_EXPIRY: 300000, // 5 phút
    
    // Theme cho Turnstile widget
    THEME: 'dark', // 'light', 'dark', 'auto'
    
    // Kích thước widget
    SIZE: 'normal', // 'normal', 'compact'
    
    // Ngôn ngữ
    LANGUAGE: 'vi', // 'auto', 'vi', 'en', etc.
    
    // Retry config
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // ms
    
    // ============================================
    // CẤU HÌNH FIRMWARE
    // ============================================
    
    // URL cơ sở cho firmware (GitHub raw URL)
    FIRMWARE_BASE_URL: 'https://raw.githubusercontent.com/your-username/your-repo/main/firmware/',
    
    // Danh sách firmware với hash để xác minh
    FIRMWARE_MANIFEST: {
        1: {
            name: 'Firmware Pro',
            file: 'firmware1.bin',
            size: 8800000,
            requiresLicense: true,
            sha256: null // Thêm hash sau khi upload firmware
        },
        2: {
            name: 'Firmware Standard',
            file: 'firmware2.bin',
            size: 8800000,
            requiresLicense: true,
            sha256: null
        },
        3: {
            name: 'Firmware Premium',
            file: 'firmware3.bin',
            size: 8970000,
            requiresLicense: true,
            sha256: null
        },
        4: {
            name: 'Firmware Demo',
            file: 'firmware_demo.bin',
            size: 4400000,
            requiresLicense: false,
            sha256: null
        }
    }
};

// Export cho ES modules
export default CloudflareConfig;

// Gán vào window cho non-module scripts
if (typeof window !== 'undefined') {
    window.CloudflareConfig = CloudflareConfig;
}
