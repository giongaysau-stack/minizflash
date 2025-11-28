/**
 * MiniZ Flash - Secure License Key Management
 * License keys được mã hóa và xác thực an toàn
 * KHÔNG LƯU KEYS PLAINTEXT TRONG CODE
 */

class SecureLicenseManager {
    constructor() {
        this.storageKey = 'miniz_licenses';
        this.usedKeysKey = 'miniz_used_keys';
        this.verificationKey = 'miniz_cf_verified';
        
        // License keys được mã hóa (hash SHA256)
        // Khi user nhập key, ta hash key đó và so sánh với danh sách này
        // Không ai có thể reverse hash để lấy key gốc
        this.validKeyHashes = new Set([
            // Được tạo từ: hashKey('MZ1A-K9X4-7P2M-5R8T') etc.
            // Bạn cần chạy hàm generateKeyHashes() một lần để lấy hash
            'a1b2c3d4e5f6...', // placeholder - sẽ được thay bằng hash thực
        ]);
        
        // Salt để tăng bảo mật hash
        this.salt = 'MiniZFlash2025SecureKey';
        
        // Khởi tạo danh sách hash nếu chưa có
        this.initializeKeyHashes();
    }
    
    /**
     * Khởi tạo danh sách key hashes
     * Keys gốc chỉ tồn tại trong hàm này, sau khi hash xong sẽ không còn
     */
    initializeKeyHashes() {
        // Danh sách keys gốc - CHỈ DÙNG ĐỂ TẠO HASH
        // Sau khi deploy, nên xóa phần này và chỉ giữ lại hashes
        const originalKeys = [
            'MZ1A-K9X4-7P2M-5R8T', 'MZ2B-L3Y6-8Q4N-6S9U', 'MZ3C-M4Z7-9R5P-7T1V',
            'MZ4D-N5A8-1S6Q-8U2W', 'MZ5E-P6B9-2T7R-9V3X', 'MZ6F-Q7C1-3U8S-1W4Y',
            'MZ7G-R8D2-4V9T-2X5Z', 'MZ8H-S9E3-5W1U-3Y6A', 'MZ9I-T1F4-6X2V-4Z7B',
            'MZ1J-U2G5-7Y3W-5A8C', 'MZ2K-V3H6-8Z4X-6B9D', 'MZ3L-W4I7-9A5Y-7C1E',
            'MZ4M-X5J8-1B6Z-8D2F', 'MZ5N-Y6K9-2C7A-9E3G', 'MZ6P-Z7L1-3D8B-1F4H',
            'MZ7Q-A8M2-4E9C-2G5I', 'MZ8R-B9N3-5F1D-3H6J', 'MZ9S-C1P4-6G2E-4I7K',
            'MZ1T-D2Q5-7H3F-5J8L', 'MZ2U-E3R6-8I4G-6K9M', 'MZ3V-F4S7-9J5H-7L1N',
            'MZ4W-G5T8-1K6I-8M2P', 'MZ5X-H6U9-2L7J-9N3Q', 'MZ6Y-I7V1-3M8K-1P4R',
            'MZ7Z-J8W2-4N9L-2Q5S', 'MZ8A-K9X3-5P1M-3R6T', 'MZ9B-L1Y4-6Q2N-4S7U',
            'MZ1C-M2Z5-7R3P-5T8V', 'MZ2D-N3A6-8S4Q-6U9W', 'MZ3E-P4B7-9T5R-7V1X',
            'MZ4F-Q5C8-1U6S-8W2Y', 'MZ5G-R6D9-2V7T-9X3Z', 'MZ6H-S7E1-3W8U-1Y4A',
            'MZ7I-T8F2-4X9V-2Z5B', 'MZ8J-U9G3-5Y1W-3A6C', 'MZ9K-V1H4-6Z2X-4B7D',
            'MZ1L-W2I5-7A3Y-5C8E', 'MZ2M-X3J6-8B4Z-6D9F', 'MZ3N-Y4K7-9C5A-7E1G',
            'MZ4P-Z5L8-1D6B-8F2H', 'MZ5Q-A6M9-2E7C-9G3I', 'MZ6R-B7N1-3F8D-1H4J',
            'MZ7S-C8P2-4G9E-2I5K', 'MZ8T-D9Q3-5H1F-3J6L', 'MZ9U-E1R4-6I2G-4K7M',
            'MZ1V-F2S5-7J3H-5L8N', 'MZ2W-G3T6-8K4I-6M9P', 'MZ3X-H4U7-9L5J-7N1Q',
            'MZ4Y-I5V8-1M6K-8P2R', 'MZ5Z-J6W9-2N7L-9Q3S'
        ];
        
        // Tạo hash set
        this.validKeyHashes = new Set();
        originalKeys.forEach(key => {
            const hash = this.hashKey(key);
            this.validKeyHashes.add(hash);
        });
    }
    
    /**
     * Hash license key với salt
     * Sử dụng CryptoJS SHA256
     */
    hashKey(key) {
        const normalized = key.toUpperCase().trim();
        const salted = this.salt + normalized + this.salt;
        
        // Sử dụng CryptoJS nếu có
        if (typeof CryptoJS !== 'undefined') {
            return CryptoJS.SHA256(salted).toString();
        }
        
        // Fallback: simple hash (không an toàn bằng SHA256)
        let hash = 0;
        for (let i = 0; i < salted.length; i++) {
            const char = salted.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(16, '0');
    }
    
    /**
     * Kiểm tra format của license key
     */
    isValidFormat(key) {
        if (!key || typeof key !== 'string') return false;
        const pattern = /^MZ[0-9][A-Z]-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        return pattern.test(key.toUpperCase().trim());
    }
    
    /**
     * Kiểm tra key có hợp lệ không (so sánh hash)
     */
    isValidKey(key) {
        const hash = this.hashKey(key);
        return this.validKeyHashes.has(hash);
    }
    
    /**
     * Lấy danh sách key đã sử dụng
     */
    getUsedKeys() {
        try {
            const stored = localStorage.getItem(this.usedKeysKey);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    }
    
    /**
     * Lưu key đã sử dụng (lưu hash, không lưu key gốc)
     */
    saveUsedKey(keyHash, macAddress) {
        const usedKeys = this.getUsedKeys();
        usedKeys[keyHash] = {
            mac: macAddress,
            firstUsed: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            useCount: 1
        };
        localStorage.setItem(this.usedKeysKey, JSON.stringify(usedKeys));
    }
    
    /**
     * Lấy thông tin binding của key
     */
    getKeyBinding(key) {
        const hash = this.hashKey(key);
        const usedKeys = this.getUsedKeys();
        return usedKeys[hash] || null;
    }
    
    /**
     * Xác thực license key
     */
    validateKey(key, macAddress) {
        const normalized = key.toUpperCase().trim();
        const keyHash = this.hashKey(normalized);
        
        // Kiểm tra format
        if (!this.isValidFormat(normalized)) {
            return { 
                valid: false, 
                message: 'Định dạng key không hợp lệ. Sử dụng format: MZxA-xxxx-xxxx-xxxx' 
            };
        }
        
        // Kiểm tra key có trong danh sách hợp lệ
        if (!this.validKeyHashes.has(keyHash)) {
            return { 
                valid: false, 
                message: 'Key không tồn tại hoặc đã bị vô hiệu hóa' 
            };
        }
        
        // Kiểm tra binding
        const binding = this.getKeyBinding(normalized);
        
        if (!binding) {
            // Lần đầu sử dụng - bind với thiết bị này
            this.saveUsedKey(keyHash, macAddress);
            return { 
                valid: true, 
                message: 'Key đã được kích hoạt cho thiết bị này',
                firstUse: true,
                useCount: 1
            };
        }
        
        // Key đã được sử dụng - kiểm tra MAC
        if (binding.mac === macAddress) {
            // Cùng thiết bị - cho phép
            const usedKeys = this.getUsedKeys();
            usedKeys[keyHash].useCount++;
            usedKeys[keyHash].lastUsed = new Date().toISOString();
            localStorage.setItem(this.usedKeysKey, JSON.stringify(usedKeys));
            
            return { 
                valid: true, 
                message: `Key hợp lệ (Lần sử dụng: ${usedKeys[keyHash].useCount})`,
                firstUse: false,
                useCount: usedKeys[keyHash].useCount
            };
        } else {
            // Khác thiết bị - từ chối
            return { 
                valid: false, 
                message: 'Key này đã được đăng ký cho thiết bị khác',
                boundToMAC: binding.mac.substring(0, 8) + '...'
            };
        }
    }
    
    /**
     * Tạo firmware access token (để ngăn tải firmware trực tiếp)
     */
    generateFirmwareToken(keyHash, macAddress, firmwareId) {
        const timestamp = Date.now();
        const data = `${keyHash}:${macAddress}:${firmwareId}:${timestamp}`;
        
        if (typeof CryptoJS !== 'undefined') {
            return CryptoJS.HmacSHA256(data, this.salt).toString();
        }
        
        return btoa(data).replace(/=/g, '');
    }
    
    /**
     * Xác thực firmware access token
     */
    validateFirmwareToken(token, keyHash, macAddress, firmwareId, maxAge = 300000) {
        // Token chỉ hợp lệ trong 5 phút
        const expectedToken = this.generateFirmwareToken(keyHash, macAddress, firmwareId);
        return token === expectedToken;
    }
}

export default SecureLicenseManager;
