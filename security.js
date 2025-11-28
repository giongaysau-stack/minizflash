/**
 * MiniZ Flash - Security Manager
 * Bảo mật và quản lý session với Cloudflare Integration
 */

class SecurityManager {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.attemptCount = 0;
        this.maxAttempts = 10;
        this.lockoutTime = 300000; // 5 phút
        this.lastAttempt = 0;
        
        // Cloudflare Turnstile state
        this.turnstileVerified = false;
        this.turnstileToken = null;
        this.turnstileExpiry = null;
        
        // Domain được phép (thêm domain của bạn vào đây)
        this.trustedOrigins = [
            'giongaysau-stack.github.io',
            'your-username.github.io',  // Thay bằng username GitHub của bạn
            'localhost',
            '127.0.0.1',
            ''  // Cho phép file:// protocol khi test local
        ];
        
        // Cloudflare configuration
        this.cloudflareConfig = {
            siteKey: '0x4AAAAAAACDiqtq-o8UGuqXd', // Site Key từ Cloudflare
            secretKey: null, // Chỉ dùng ở server-side
            verifyUrl: 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
        };
    }

    /**
     * Kiểm tra môi trường development
     */
    isDevelopment() {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || 
               hostname === '127.0.0.1' || 
               window.location.protocol === 'file:';
    }

    /**
     * Tạo session ID ngẫu nhiên
     */
    generateSessionId() {
        return Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Kiểm tra origin có được phép không
     */
    checkOrigin() {
        const hostname = window.location.hostname;
        
        // Cho phép test local
        if (this.isDevelopment()) {
            return true;
        }
        
        return this.trustedOrigins.some(origin => hostname.includes(origin));
    }
    
    /**
     * Xác thực Cloudflare Turnstile token
     * Note: Việc xác thực token nên được thực hiện ở server-side
     * Đây chỉ là client-side verification cơ bản
     */
    setTurnstileToken(token) {
        this.turnstileToken = token;
        this.turnstileVerified = true;
        this.turnstileExpiry = Date.now() + 300000; // 5 phút
        
        // Lưu vào sessionStorage
        sessionStorage.setItem('cf_turnstile_token', token);
        sessionStorage.setItem('cf_turnstile_expiry', this.turnstileExpiry.toString());
    }
    
    /**
     * Kiểm tra Turnstile còn hợp lệ không
     */
    isTurnstileValid() {
        // Kiểm tra từ sessionStorage nếu chưa có
        if (!this.turnstileToken) {
            this.turnstileToken = sessionStorage.getItem('cf_turnstile_token');
            this.turnstileExpiry = parseInt(sessionStorage.getItem('cf_turnstile_expiry') || '0');
        }
        
        if (!this.turnstileToken || !this.turnstileExpiry) {
            return false;
        }
        
        // Kiểm tra hết hạn
        if (Date.now() > this.turnstileExpiry) {
            this.clearTurnstile();
            return false;
        }
        
        return true;
    }
    
    /**
     * Xóa Turnstile token
     */
    clearTurnstile() {
        this.turnstileToken = null;
        this.turnstileVerified = false;
        this.turnstileExpiry = null;
        sessionStorage.removeItem('cf_turnstile_token');
        sessionStorage.removeItem('cf_turnstile_expiry');
    }
    
    /**
     * Tạo request headers với security tokens
     */
    getSecureHeaders() {
        const headers = {
            'X-Session-ID': this.sessionId,
            'X-Timestamp': Date.now().toString()
        };
        
        if (this.turnstileToken) {
            headers['X-CF-Turnstile-Token'] = this.turnstileToken;
        }
        
        return headers;
    }

    /**
     * Kiểm tra có bị lock không (quá nhiều lần thử sai)
     */
    isLocked() {
        if (this.attemptCount >= this.maxAttempts) {
            const timeSinceLast = Date.now() - this.lastAttempt;
            if (timeSinceLast < this.lockoutTime) {
                return true;
            } else {
                this.attemptCount = 0;
            }
        }
        return false;
    }

    /**
     * Ghi nhận lần thử thất bại
     */
    recordAttempt() {
        this.attemptCount++;
        this.lastAttempt = Date.now();
    }

    /**
     * Reset attempts
     */
    resetAttempts() {
        this.attemptCount = 0;
    }

    /**
     * Thêm random params vào URL để tránh cache
     */
    obfuscateUrl(url) {
        const timestamp = Date.now();
        const rand = Math.random().toString(36).substring(7);
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}t=${timestamp}&s=${this.sessionId.substring(0, 8)}&r=${rand}`;
    }

    /**
     * Xác minh tính toàn vẹn của firmware
     */
    async verifyIntegrity(data, expectedSize) {
        // Kiểm tra kích thước
        if (Math.abs(data.length - expectedSize) > expectedSize * 0.1) {
            // Cho phép sai lệch 10%
            console.warn('Size mismatch:', data.length, 'vs expected', expectedSize);
        }
        
        // Kiểm tra magic byte ESP image (0xE9 hoặc 0x00)
        if (data.length > 0 && data[0] !== 0xE9 && data[0] !== 0x00) {
            console.warn('Unexpected magic byte:', data[0].toString(16));
            return false;
        }
        
        return true;
    }

    /**
     * Ẩn thông tin nhạy cảm trong console output
     */
    sanitizeConsoleOutput(message) {
        if (typeof message !== 'string') return message;
        
        return message
            .replace(/https?:\/\/[^\s]+/g, '[URL]')
            .replace(/\b[A-Fa-f0-9]{32,}\b/g, '[HASH]')
            .replace(/MZ[0-9][A-Z]-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/gi, '[LICENSE]');
    }

    /**
     * Chặn click chuột phải (tùy chọn)
     */
    disableRightClick() {
        document.addEventListener('contextmenu', (e) => {
            if (!this.isDevelopment()) {
                e.preventDefault();
                return false;
            }
        });
    }

    /**
     * Chặn copy/paste (tùy chọn)
     */
    disableCopyPaste() {
        if (this.isDevelopment()) return;
        
        document.addEventListener('copy', (e) => {
            e.preventDefault();
            return false;
        });
        
        document.addEventListener('cut', (e) => {
            e.preventDefault();
            return false;
        });
    }

    /**
     * Thêm security headers qua meta tags
     */
    addSecurityHeaders() {
        // Content Security Policy
        const csp = document.createElement('meta');
        csp.httpEquiv = 'Content-Security-Policy';
        csp.content = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdnjs.cloudflare.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "connect-src 'self' https://raw.githubusercontent.com https://unpkg.com"
        ].join('; ');
        document.head.appendChild(csp);
    }
}

export default SecurityManager;
