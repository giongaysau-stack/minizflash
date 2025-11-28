/**
 * MiniZ Flash - License Key Management System
 * Quản lý license key với binding theo MAC address thiết bị
 * Tích hợp xác thực Cloudflare Turnstile
 */

class LicenseManager {
    constructor() {
        this.storageKey = 'miniz_licenses';
        this.usedKeysKey = 'miniz_used_keys';
        this.verificationKey = 'miniz_cf_verified';
        
        // Danh sách 50 license keys hợp lệ
        // Format: MZxA-xxxx-xxxx-xxxx (x = chữ hoặc số)
        this.validKeys = [
            // Series 1 - Premium
            'MZ1A-K9X4-7P2M-5R8T', 'MZ2B-L3Y6-8Q4N-6S9U', 'MZ3C-M4Z7-9R5P-7T1V',
            'MZ4D-N5A8-1S6Q-8U2W', 'MZ5E-P6B9-2T7R-9V3X', 'MZ6F-Q7C1-3U8S-1W4Y',
            'MZ7G-R8D2-4V9T-2X5Z', 'MZ8H-S9E3-5W1U-3Y6A', 'MZ9I-T1F4-6X2V-4Z7B',
            'MZ1J-U2G5-7Y3W-5A8C',
            
            // Series 2 - Standard
            'MZ2K-V3H6-8Z4X-6B9D', 'MZ3L-W4I7-9A5Y-7C1E', 'MZ4M-X5J8-1B6Z-8D2F',
            'MZ5N-Y6K9-2C7A-9E3G', 'MZ6P-Z7L1-3D8B-1F4H', 'MZ7Q-A8M2-4E9C-2G5I',
            'MZ8R-B9N3-5F1D-3H6J', 'MZ9S-C1P4-6G2E-4I7K', 'MZ1T-D2Q5-7H3F-5J8L',
            'MZ2U-E3R6-8I4G-6K9M',
            
            // Series 3 - Basic
            'MZ3V-F4S7-9J5H-7L1N', 'MZ4W-G5T8-1K6I-8M2P', 'MZ5X-H6U9-2L7J-9N3Q',
            'MZ6Y-I7V1-3M8K-1P4R', 'MZ7Z-J8W2-4N9L-2Q5S', 'MZ8A-K9X3-5P1M-3R6T',
            'MZ9B-L1Y4-6Q2N-4S7U', 'MZ1C-M2Z5-7R3P-5T8V', 'MZ2D-N3A6-8S4Q-6U9W',
            'MZ3E-P4B7-9T5R-7V1X',
            
            // Series 4 - Pro
            'MZ4F-Q5C8-1U6S-8W2Y', 'MZ5G-R6D9-2V7T-9X3Z', 'MZ6H-S7E1-3W8U-1Y4A',
            'MZ7I-T8F2-4X9V-2Z5B', 'MZ8J-U9G3-5Y1W-3A6C', 'MZ9K-V1H4-6Z2X-4B7D',
            'MZ1L-W2I5-7A3Y-5C8E', 'MZ2M-X3J6-8B4Z-6D9F', 'MZ3N-Y4K7-9C5A-7E1G',
            'MZ4P-Z5L8-1D6B-8F2H',
            
            // Series 5 - Enterprise
            'MZ5Q-A6M9-2E7C-9G3I', 'MZ6R-B7N1-3F8D-1H4J', 'MZ7S-C8P2-4G9E-2I5K',
            'MZ8T-D9Q3-5H1F-3J6L', 'MZ9U-E1R4-6I2G-4K7M', 'MZ1V-F2S5-7J3H-5L8N',
            'MZ2W-G3T6-8K4I-6M9P', 'MZ3X-H4U7-9L5J-7N1Q', 'MZ4Y-I5V8-1M6K-8P2R',
            'MZ5Z-J6W9-2N7L-9Q3S'
        ];
        
        // Cloudflare verification status
        this.cfVerified = this.loadCFVerification();
    }
    
    /**
     * Load Cloudflare verification status
     */
    loadCFVerification() {
        try {
            const stored = sessionStorage.getItem(this.verificationKey);
            return stored ? JSON.parse(stored) : { verified: false, timestamp: null };
        } catch (e) {
            return { verified: false, timestamp: null };
        }
    }
    
    /**
     * Set Cloudflare verification status
     */
    setCFVerification(token) {
        const data = {
            verified: true,
            timestamp: Date.now(),
            tokenHash: this.hashToken(token)
        };
        sessionStorage.setItem(this.verificationKey, JSON.stringify(data));
        this.cfVerified = data;
    }
    
    /**
     * Check if Cloudflare is verified
     */
    isCFVerified() {
        if (!this.cfVerified.verified) return false;
        
        // Token expires after 5 minutes
        const expiry = 5 * 60 * 1000;
        if (Date.now() - this.cfVerified.timestamp > expiry) {
            this.clearCFVerification();
            return false;
        }
        
        return true;
    }
    
    /**
     * Clear Cloudflare verification
     */
    clearCFVerification() {
        sessionStorage.removeItem(this.verificationKey);
        this.cfVerified = { verified: false, timestamp: null };
    }
    
    /**
     * Simple hash for token (không để lộ token gốc)
     */
    hashToken(token) {
        if (!token) return null;
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
            const char = token.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    /**
     * Lấy danh sách key đã sử dụng từ localStorage
     */
    getUsedKeys() {
        try {
            const stored = localStorage.getItem(this.usedKeysKey);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('Error reading used keys:', e);
            return {};
        }
    }

    /**
     * Lưu danh sách key đã sử dụng vào localStorage
     */
    saveUsedKeys(usedKeys) {
        try {
            localStorage.setItem(this.usedKeysKey, JSON.stringify(usedKeys));
        } catch (e) {
            console.error('Error saving used keys:', e);
        }
    }

    /**
     * Kiểm tra format của license key
     * Format: MZxA-xxxx-xxxx-xxxx
     */
    isValidFormat(key) {
        if (!key || typeof key !== 'string') return false;
        const pattern = /^MZ[0-9][A-Z]-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        return pattern.test(key.toUpperCase().trim());
    }

    /**
     * Kiểm tra key có trong danh sách hợp lệ không
     */
    isValidKey(key) {
        return this.validKeys.includes(key.toUpperCase().trim());
    }

    /**
     * Lấy thông tin MAC đã bind với key
     */
    getBoundMAC(key) {
        const usedKeys = this.getUsedKeys();
        return usedKeys[key.toUpperCase().trim()] || null;
    }

    /**
     * Bind key với MAC address
     */
    bindKeyToMAC(key, macAddress) {
        const usedKeys = this.getUsedKeys();
        const normalizedKey = key.toUpperCase().trim();
        
        usedKeys[normalizedKey] = {
            mac: macAddress,
            firstUsed: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            useCount: 1
        };
        
        this.saveUsedKeys(usedKeys);
        console.log(`✅ Key ${normalizedKey} bound to ${macAddress}`);
    }

    /**
     * Tăng số lần sử dụng
     */
    incrementUseCount(key) {
        const usedKeys = this.getUsedKeys();
        const normalizedKey = key.toUpperCase().trim();
        
        if (usedKeys[normalizedKey]) {
            usedKeys[normalizedKey].useCount++;
            usedKeys[normalizedKey].lastUsed = new Date().toISOString();
            this.saveUsedKeys(usedKeys);
        }
    }

    /**
     * Xác thực license key cho thiết bị
     * @param {string} key - License key
     * @param {string} macAddress - MAC address của thiết bị
     * @param {boolean} requireCF - Yêu cầu Cloudflare verification
     * @returns {object} Kết quả xác thực
     */
    validateKey(key, macAddress, requireCF = false) {
        const normalizedKey = key.toUpperCase().trim();

        // Bước 0: Kiểm tra Cloudflare verification (nếu yêu cầu)
        if (requireCF && !this.isCFVerified() && !this.isDevelopment()) {
            return { 
                valid: false, 
                message: 'Vui lòng xác thực Cloudflare trước',
                requiresCF: true
            };
        }

        // Bước 1: Kiểm tra format
        if (!this.isValidFormat(normalizedKey)) {
            return { 
                valid: false, 
                message: 'Định dạng key không hợp lệ. Sử dụng format: MZxA-xxxx-xxxx-xxxx' 
            };
        }

        // Bước 2: Kiểm tra key có tồn tại không
        if (!this.isValidKey(normalizedKey)) {
            return { 
                valid: false, 
                message: 'Key không tồn tại hoặc đã bị vô hiệu hóa' 
            };
        }

        // Bước 3: Kiểm tra key đã được sử dụng chưa
        const boundData = this.getBoundMAC(normalizedKey);
        
        if (!boundData) {
            // Lần đầu sử dụng - bind key với thiết bị này
            this.bindKeyToMAC(normalizedKey, macAddress);
            return { 
                valid: true, 
                message: 'Key đã được kích hoạt cho thiết bị này',
                firstUse: true,
                useCount: 1
            };
        }

        // Bước 4: Key đã bind - kiểm tra MAC có khớp không
        if (boundData.mac === macAddress) {
            // MAC khớp - cho phép sử dụng
            this.incrementUseCount(normalizedKey);
            return { 
                valid: true, 
                message: `Key hợp lệ (Đã sử dụng ${boundData.useCount + 1} lần)`,
                firstUse: false,
                useCount: boundData.useCount + 1,
                firstUsedDate: boundData.firstUsed
            };
        } else {
            // MAC không khớp - key đã bind với thiết bị khác
            return { 
                valid: false, 
                message: 'Key này đã được đăng ký cho thiết bị khác',
                boundToMAC: boundData.mac.substring(0, 8) + '...'
            };
        }
    }
    
    /**
     * Check if running in development mode
     */
    isDevelopment() {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || 
               hostname === '127.0.0.1' || 
               window.location.protocol === 'file:';
    }

    /**
     * Lấy thống kê sử dụng key
     */
    getKeyStats(key) {
        const usedKeys = this.getUsedKeys();
        return usedKeys[key.toUpperCase().trim()] || null;
    }

    /**
     * Xóa binding của key (chỉ dùng cho admin/debug)
     */
    unbindKey(key) {
        const usedKeys = this.getUsedKeys();
        const normalizedKey = key.toUpperCase().trim();
        
        if (usedKeys[normalizedKey]) {
            delete usedKeys[normalizedKey];
            this.saveUsedKeys(usedKeys);
            return true;
        }
        return false;
    }

    /**
     * Export danh sách keys (chỉ dùng cho admin)
     */
    exportValidKeys() {
        return [...this.validKeys];
    }

    /**
     * Kiểm tra key còn available không (chưa bind)
     */
    isKeyAvailable(key) {
        const normalizedKey = key.toUpperCase().trim();
        if (!this.isValidKey(normalizedKey)) return false;
        return !this.getBoundMAC(normalizedKey);
    }

    /**
     * Lấy số key còn available
     */
    getAvailableKeysCount() {
        const usedKeys = this.getUsedKeys();
        return this.validKeys.filter(key => !usedKeys[key]).length;
    }
}

export default LicenseManager;
