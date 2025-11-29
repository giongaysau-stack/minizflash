/**
 * MiniZ Flash - Security Manager
 * Simple security module
 */

class SecurityManager {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.attemptCount = 0;
        this.maxAttempts = 10;
        this.lockoutTime = 300000; // 5 phút
        this.lastAttempt = 0;
        
        // Domain được phép
        this.trustedOrigins = [
            'giongaysau-stack.github.io',
            'localhost',
            '127.0.0.1',
            ''
        ];
    }

    /**
     * Tạo session ID ngẫu nhiên
     */
    generateSessionId() {
        return Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
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
     * Kiểm tra origin có được phép không
     */
    checkOrigin() {
        const hostname = window.location.hostname;
        if (this.isDevelopment()) return true;
        return this.trustedOrigins.some(origin => hostname.includes(origin));
    }

    /**
     * Kiểm tra có bị lock không
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
}

export default SecurityManager;
