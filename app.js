/**
 * MiniZ Flash - ESP Web Flasher Application
 * Main application module with Cloudflare Security
 */

import { ESPLoader, Transport } from 'https://unpkg.com/esptool-js@latest/bundle.js';
import SecurityManager from './security.js';
import LicenseManager from './license.js';

class ESPWebFlasher {
    constructor() {
        // Device state
        this.device = null;
        this.transport = null;
        this.chip = null;
        this.esploader = null;
        
        // Firmware state
        this.firmwareData = null;
        this.firmwareSource = 'github';
        this.selectedFirmwareId = null;
        this.selectedFileName = null;
        
        // Device info
        this.deviceMAC = null;
        
        // License state
        this.licenseKey = null;
        this.licenseValidated = false;
        
        // Cloudflare state
        this.turnstileVerified = false;
        this.turnstileToken = null;
        
        // Initialize security & license managers
        this.security = new SecurityManager();
        this.license = new LicenseManager();
        
        // Initialize
        this.initializeSecurity();
        this.initializeUI();
        this.checkWebSerialSupport();
        this.displaySessionInfo();
    }

    /**
     * Khởi tạo bảo mật
     */
    initializeSecurity() {
        // Kiểm tra Cloudflare Turnstile
        this.turnstileVerified = window.turnstileVerified || false;
        this.turnstileToken = window.turnstileToken || null;
        
        // Lắng nghe sự kiện Turnstile
        window.addEventListener('turnstileVerified', (e) => {
            this.turnstileVerified = true;
            this.turnstileToken = e.detail.token;
            this.log('🛡️ Cloudflare Turnstile đã xác thực', 'success');
        });
        
        // Kiểm tra origin (chỉ warning, không block)
        if (!this.security.checkOrigin()) {
            console.warn('⚠️ Running on untrusted domain');
        }
        
        console.log('🔒 Security initialized - Session:', this.security.sessionId.substring(0, 8) + '...');
    }

    /**
     * Hiển thị thông tin session
     */
    displaySessionInfo() {
        const sessionInfo = document.getElementById('sessionInfo');
        if (sessionInfo) {
            sessionInfo.textContent = `Session: ${this.security.sessionId.substring(0, 8)}...`;
        }
    }

    /**
     * Kiểm tra Web Serial API support
     */
    checkWebSerialSupport() {
        if (!('serial' in navigator)) {
            this.log('❌ Web Serial API không được hỗ trợ. Vui lòng sử dụng Chrome, Edge, hoặc Opera.', 'error');
            document.getElementById('connectBtn').disabled = true;
        } else {
            this.log('✅ Web Serial API sẵn sàng', 'success');
        }
    }

    /**
     * Khởi tạo UI events
     */
    initializeUI() {
        // Connect button
        document.getElementById('connectBtn').addEventListener('click', () => this.connectDevice());
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // Firmware cards
        document.querySelectorAll('.firmware-card').forEach(card => {
            card.addEventListener('click', () => this.selectFirmware(card));
        });
        
        // License validation
        document.getElementById('licenseKeyInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.validateLicense();
            }
        });
        
        document.getElementById('validateLicenseBtn')?.addEventListener('click', () => this.validateLicense());
        
        // Local file input
        document.getElementById('firmwareFile').addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Flash button
        document.getElementById('flashBtn').addEventListener('click', () => this.flashFirmware());
        
        // Clear console button
        document.getElementById('clearConsoleBtn')?.addEventListener('click', () => {
            document.getElementById('consoleOutput').innerHTML = '';
            this.log('Console đã được xóa', 'info');
        });
    }

    /**
     * Chuyển tab firmware
     */
    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.firmware-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        if (tabName === 'github') {
            document.getElementById('githubFirmwareTab').classList.add('active');
            this.firmwareSource = 'github';
        } else {
            document.getElementById('localFileTab').classList.add('active');
            this.firmwareSource = 'local';
        }
    }

    /**
     * Chọn firmware từ grid
     */
    async selectFirmware(card) {
        // Kiểm tra lockout
        if (this.security.isLocked()) {
            this.log('🔒 Quá nhiều lần thử. Vui lòng đợi 5 phút.', 'error');
            return;
        }

        // Bỏ chọn firmware trước đó
        document.querySelectorAll('.firmware-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        const name = card.querySelector('h3').textContent;
        const firmwareId = parseInt(card.dataset.id);
        const requiresLicense = card.dataset.requiresLicense === 'true';

        // Hiển thị/ẩn license section
        const licenseSection = document.getElementById('licenseSection');
        if (requiresLicense) {
            licenseSection.classList.remove('hidden');
            // Reset license state nếu chọn firmware khác
            if (this.selectedFirmwareId !== firmwareId) {
                this.licenseKey = null;
                this.licenseValidated = false;
                document.getElementById('licenseKeyInput').value = '';
                document.getElementById('licenseStatus').classList.add('hidden');
            }
        } else {
            licenseSection.classList.add('hidden');
            this.licenseValidated = true; // Không cần license
        }

        this.log(`📥 Đang tải ${name}...`, 'info');

        try {
            // Lấy URL firmware - sử dụng relative path để tránh CORS
            const firmwareFiles = {
                1: 'firmware/firmware1.bin',
                2: 'firmware/firmware2.bin',
                3: 'firmware/firmware3.bin',
                4: 'firmware/firmware_demo.bin'
            };

            const url = firmwareFiles[firmwareId];
            if (!url) {
                throw new Error('Firmware ID không hợp lệ');
            }

            // Thêm cache busting
            const fetchUrl = `${url}?t=${Date.now()}`;

            const response = await fetch(fetchUrl, {
                method: 'GET',
                cache: 'no-store'
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`File firmware chưa được upload. Vui lòng upload file ${url}`);
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            this.firmwareData = new Uint8Array(arrayBuffer);

            // Kiểm tra file có hợp lệ không
            if (this.firmwareData.length < 1000) {
                throw new Error('File firmware quá nhỏ hoặc không hợp lệ');
            }

            this.selectedFirmwareId = firmwareId;
            this.selectedFileName = name;

            // Hiển thị thông tin file
            const fileInfo = document.getElementById('githubFileInfo');
            fileInfo.innerHTML = `
                <strong>✅ ${name}</strong><br>
                📦 Kích thước: ${this.formatBytes(this.firmwareData.length)}<br>
                ✓ Sẵn sàng nạp
            `;
            fileInfo.classList.remove('hidden');

            this.log(`✅ ${name} đã tải thành công (${this.formatBytes(this.firmwareData.length)})`, 'success');
            
            // Cập nhật trạng thái nút Flash
            this.updateFlashButtonState();

        } catch (error) {
            this.log(`❌ Lỗi tải firmware: ${error.message}`, 'error');
            card.classList.remove('selected');
            this.firmwareData = null;
        }
    }

    /**
     * Kết nối thiết bị ESP
     */
    async connectDevice() {
        const connectBtn = document.getElementById('connectBtn');
        const statusBadge = document.getElementById('connectionStatus');

        try {
            connectBtn.disabled = true;
            this.log('🔌 Đang yêu cầu kết nối...', 'info');

            // Request serial port
            this.device = await navigator.serial.requestPort();
            
            const baudRate = parseInt(document.getElementById('baudRate').value);
            this.log(`📡 Đang mở cổng với baud rate ${baudRate}...`, 'info');

            // Tạo transport
            this.transport = new Transport(this.device);

            // Tạo ESP loader
            this.esploader = new ESPLoader({
                transport: this.transport,
                baudrate: baudRate,
                romBaudrate: 115200,
                terminal: {
                    clean: () => {},
                    writeLine: (text) => this.log(text, 'info'),
                    write: (text) => this.log(text, 'info')
                },
                debugLogging: false
            });

            // Kết nối chip
            this.log('🔄 Đang kết nối với ESP...', 'info');
            this.chip = await this.esploader.main();

            // Load stub flasher
            try {
                this.log('📦 Đang tải stub flasher...', 'info');
                await this.esploader.runStub();
                this.log('✅ Stub loaded thành công', 'success');
            } catch (e) {
                this.log('⚠️ Không thể load stub, tiếp tục không có stub (chậm hơn)', 'warning');
            }

            this.log(`✅ Đã kết nối với ${this.chip}!`, 'success');

            // Đọc MAC address
            await this.readDeviceMAC();

            // Cập nhật UI
            statusBadge.textContent = 'Đã kết nối';
            statusBadge.classList.remove('disconnected');
            statusBadge.classList.add('connected');
            
            connectBtn.innerHTML = '<span class="btn-icon">🔌</span> Ngắt kết nối';
            connectBtn.onclick = () => this.disconnectDevice();

            // Hiển thị device info
            await this.displayDeviceInfo();

            // Cập nhật trạng thái nút Flash
            this.updateFlashButtonState();

        } catch (error) {
            this.log(`❌ Kết nối thất bại: ${error.message}`, 'error');
            console.error(error);
        } finally {
            connectBtn.disabled = false;
        }
    }

    /**
     * Đọc MAC address của thiết bị
     */
    async readDeviceMAC() {
        try {
            // Method 1: Đọc từ EFUSE (ESP32-S3)
            try {
                const word0 = await this.esploader.readReg(0x60007044);
                const word1 = await this.esploader.readReg(0x60007048);
                
                if (word0 !== undefined && word1 !== undefined) {
                    const macBytes = [
                        (word0 >> 0) & 0xFF,
                        (word0 >> 8) & 0xFF,
                        (word0 >> 16) & 0xFF,
                        (word0 >> 24) & 0xFF,
                        (word1 >> 0) & 0xFF,
                        (word1 >> 8) & 0xFF
                    ];
                    this.deviceMAC = macBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
                    this.log(`✅ MAC: ${this.deviceMAC}`, 'success');
                    return;
                }
            } catch (e) {
                // Thử method khác
            }

            // Method 2: Đọc từ OTP (ESP32)
            try {
                const word0 = await this.esploader.readReg(0x3f41a048);
                const word1 = await this.esploader.readReg(0x3f41a04c);
                
                if (word0 && word1) {
                    const macBytes = [
                        (word0 >> 0) & 0xFF,
                        (word0 >> 8) & 0xFF,
                        (word0 >> 16) & 0xFF,
                        (word0 >> 24) & 0xFF,
                        (word1 >> 0) & 0xFF,
                        (word1 >> 8) & 0xFF
                    ];
                    this.deviceMAC = macBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
                    this.log(`✅ MAC: ${this.deviceMAC}`, 'success');
                    return;
                }
            } catch (e) {
                // Fallback
            }

            // Fallback: Tạo session MAC
            this.deviceMAC = this.generateSessionMAC();
            this.log(`📟 Session MAC: ${this.deviceMAC}`, 'warning');

        } catch (e) {
            this.deviceMAC = this.generateSessionMAC();
            this.log(`⚠️ Không thể đọc MAC, sử dụng session MAC: ${this.deviceMAC}`, 'warning');
        }
    }

    /**
     * Tạo session MAC (fallback)
     */
    generateSessionMAC() {
        const sessionKey = localStorage.getItem('esp_session_key') || Math.random().toString(36).substr(2, 12);
        localStorage.setItem('esp_session_key', sessionKey);
        
        const bytes = [];
        for (let i = 0; i < 6; i++) {
            bytes.push(parseInt(sessionKey.substr(i * 2, 2), 16) || Math.floor(Math.random() * 256));
        }
        bytes[0] |= 0x02; // Set locally administered bit
        
        return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
    }

    /**
     * Kiểm tra MAC format
     */
    isValidMAC(mac) {
        if (!mac || typeof mac !== 'string') return false;
        return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(mac);
    }

    /**
     * Ngắt kết nối thiết bị
     */
    async disconnectDevice() {
        try {
            if (this.transport) {
                await this.transport.disconnect();
                await this.transport.waitForUnlock(1500);
            }

            this.device = null;
            this.transport = null;
            this.chip = null;
            this.esploader = null;
            this.deviceMAC = null;
            this.licenseKey = null;
            this.licenseValidated = false;

            // Reset UI
            const statusBadge = document.getElementById('connectionStatus');
            statusBadge.textContent = 'Chưa kết nối';
            statusBadge.classList.remove('connected');
            statusBadge.classList.add('disconnected');

            const connectBtn = document.getElementById('connectBtn');
            connectBtn.innerHTML = '<span class="btn-icon">🔌</span> Kết nối thiết bị';
            connectBtn.onclick = () => this.connectDevice();

            document.getElementById('deviceInfo').classList.add('hidden');
            document.getElementById('flashBtn').disabled = true;

            // Reset license UI
            document.getElementById('licenseKeyInput').value = '';
            document.getElementById('licenseStatus').classList.add('hidden');

            this.log('🔌 Đã ngắt kết nối', 'info');

        } catch (error) {
            this.log(`Lỗi ngắt kết nối: ${error.message}`, 'error');
        }
    }

    /**
     * Hiển thị thông tin thiết bị
     */
    async displayDeviceInfo() {
        const deviceInfo = document.getElementById('deviceInfo');
        let info = `<strong>Thông tin thiết bị:</strong><br>`;
        info += `Chip: ${this.chip}<br>`;
        
        if (this.deviceMAC) {
            info += `MAC: ${this.deviceMAC}<br>`;
        }

        try {
            const features = await this.esploader.getChipFeatures();
            if (features && features.length > 0) {
                info += `Features: ${features.join(', ')}<br>`;
            }
        } catch (e) {}

        try {
            const flashId = await this.esploader.readFlashId();
            if (flashId) {
                info += `Flash ID: 0x${flashId.toString(16)}<br>`;
            }
        } catch (e) {}

        deviceInfo.innerHTML = info;
        deviceInfo.classList.remove('hidden');
    }

    /**
     * Xác thực license key
     */
    validateLicense() {
        const licenseInput = document.getElementById('licenseKeyInput');
        const keyValue = licenseInput.value.trim().toUpperCase();
        const statusDiv = document.getElementById('licenseStatus');

        // Validation checks
        if (!keyValue) {
            this.showLicenseStatus('🔴 Vui lòng nhập license key', 'error');
            return;
        }

        if (!this.selectedFirmwareId) {
            this.showLicenseStatus('🔴 Vui lòng chọn firmware trước', 'error');
            return;
        }

        if (!this.deviceMAC) {
            this.showLicenseStatus('🔴 Vui lòng kết nối thiết bị trước', 'error');
            return;
        }

        // Validate format
        if (!this.license.isValidFormat(keyValue)) {
            this.showLicenseStatus('🔴 Sai định dạng. Sử dụng: MZxA-xxxx-xxxx-xxxx', 'error');
            licenseInput.value = '';
            return;
        }

        // Validate key
        const validation = this.license.validateKey(keyValue, this.deviceMAC);

        if (!validation.valid) {
            this.showLicenseStatus(`🔴 ${validation.message}`, 'error');
            this.licenseKey = null;
            this.licenseValidated = false;
            return;
        }

        // License hợp lệ
        this.licenseKey = keyValue;
        this.licenseValidated = true;

        if (validation.firstUse) {
            this.showLicenseStatus(`🟢 Key đã kích hoạt! Đăng ký với ${this.deviceMAC}`, 'success');
            this.log(`✅ License key được kích hoạt và đăng ký với thiết bị`, 'success');
        } else {
            this.showLicenseStatus(`🟢 Key hợp lệ! Lần sử dụng: ${validation.useCount}`, 'success');
            this.log(`✅ License key xác thực thành công`, 'success');
        }

        this.updateFlashButtonState();
    }

    /**
     * Hiển thị trạng thái license
     */
    showLicenseStatus(message, type) {
        const statusDiv = document.getElementById('licenseStatus');
        statusDiv.innerHTML = message;
        statusDiv.className = `license-status ${type}`;
        statusDiv.classList.remove('hidden');
    }

    /**
     * Cập nhật trạng thái nút Flash
     */
    updateFlashButtonState() {
        const flashBtn = document.getElementById('flashBtn');
        
        // Cần: thiết bị kết nối + firmware đã tải + MAC + license (nếu cần)
        const canFlash = this.esploader && this.firmwareData && this.deviceMAC;
        
        if (!canFlash) {
            flashBtn.disabled = true;
            return;
        }

        // Kiểm tra license cho firmware yêu cầu
        const selectedCard = document.querySelector('.firmware-card.selected');
        const requiresLicense = selectedCard?.dataset.requiresLicense === 'true';

        if (requiresLicense) {
            flashBtn.disabled = !this.licenseValidated;
        } else {
            flashBtn.disabled = false;
        }
    }

    /**
     * Xử lý chọn file local
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.bin')) {
            this.log('⚠️ File nên có đuôi .bin', 'warning');
        }

        this.log(`📦 Đang tải file: ${file.name} (${this.formatBytes(file.size)})`, 'info');

        const reader = new FileReader();
        reader.onload = async (e) => {
            this.firmwareData = new Uint8Array(e.target.result);
            this.selectedFileName = file.name;
            this.firmwareSource = 'local';
            this.licenseValidated = true; // File local không cần license

            // Calculate and display hash
            const hash = await this.calculateSHA256(this.firmwareData);
            this.displayFirmwareHash(hash);

            const fileInfo = document.getElementById('fileInfo');
            fileInfo.innerHTML = `
                <strong>📦 ${file.name}</strong><br>
                Kích thước: ${this.formatBytes(file.size)}<br>
                Loại: Binary (${this.firmwareData.length} bytes)
            `;
            fileInfo.classList.remove('hidden');

            this.log(`✅ File đã tải: ${this.formatBytes(this.firmwareData.length)}`, 'success');
            this.updateFlashButtonState();
        };

        reader.onerror = () => {
            this.log(`❌ Lỗi đọc file`, 'error');
        };

        reader.readAsArrayBuffer(file);
    }

    /**
     * Tính SHA256 hash
     */
    async calculateSHA256(data) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Hiển thị hash firmware
     */
    displayFirmwareHash(hash) {
        const hashVerification = document.getElementById('hashVerification');
        const firmwareHash = document.getElementById('firmwareHash');
        const hashStatus = document.getElementById('hashStatus');
        
        if (hashVerification && firmwareHash && hashStatus) {
            hashVerification.classList.remove('hidden');
            firmwareHash.textContent = hash;
            hashStatus.textContent = '✓ Đã tính toán';
            hashStatus.className = 'hash-status valid';
        }
    }

    /**
     * Nạp firmware vào thiết bị
     */
    async flashFirmware() {
        // Kiểm tra Cloudflare verification
        if (!this.turnstileVerified && !this.security.isDevelopment()) {
            this.log('❌ Vui lòng xác thực Cloudflare trước khi flash', 'error');
            return;
        }

        if (!this.esploader || !this.firmwareData) {
            this.log('❌ Vui lòng kết nối thiết bị và chọn firmware', 'error');
            return;
        }

        // Kiểm tra license cho firmware yêu cầu
        const selectedCard = document.querySelector('.firmware-card.selected');
        if (selectedCard?.dataset.requiresLicense === 'true') {
            if (!this.licenseValidated || !this.licenseKey) {
                this.log('❌ Firmware này yêu cầu license key hợp lệ', 'error');
                return;
            }

            // Re-validate license trước khi flash
            this.log('🔐 Đang xác thực license...', 'info');
            const validation = this.license.validateKey(this.licenseKey, this.deviceMAC);
            
            if (!validation.valid) {
                this.log(`❌ License không hợp lệ: ${validation.message}`, 'error');
                this.licenseValidated = false;
                this.updateFlashButtonState();
                return;
            }
            
            this.log('✅ License đã xác thực', 'success');
        }

        const flashBtn = document.getElementById('flashBtn');
        const progressSection = document.getElementById('progressSection');

        try {
            flashBtn.disabled = true;
            progressSection.classList.remove('hidden');

            const flashOffset = parseInt(document.getElementById('flashOffset').value, 16);
            const eraseFlash = document.getElementById('eraseFlash').checked;

            this.log('='.repeat(50), 'info');
            this.log(`⚡ Bắt đầu nạp ${this.selectedFileName || 'firmware.bin'}...`, 'info');

            // Xóa flash nếu cần
            if (eraseFlash) {
                this.log('🗑️ Đang xóa flash...', 'warning');
                this.updateProgress(5, 0, this.firmwareData.length);
                await this.esploader.eraseFlash();
                this.log('✅ Đã xóa flash', 'success');
                this.updateProgress(15, 0, this.firmwareData.length);
            } else {
                this.updateProgress(10, 0, this.firmwareData.length);
            }

            // Chuyển đổi data sang binary string
            this.log(`📝 Đang ghi ${this.formatBytes(this.firmwareData.length)} vào địa chỉ 0x${flashOffset.toString(16)}...`, 'info');
            this.updateProgress(20, 0, this.firmwareData.length);

            let binaryString = '';
            for (let i = 0; i < this.firmwareData.length; i++) {
                binaryString += String.fromCharCode(this.firmwareData[i]);
            }

            const fileArray = [{
                data: binaryString,
                address: flashOffset
            }];

            const flashOptions = {
                fileArray: fileArray,
                flashSize: 'keep',
                flashMode: 'keep',
                flashFreq: 'keep',
                eraseAll: false,
                compress: true,
                reportProgress: (fileIndex, written, total) => {
                    const percent = 20 + Math.floor((written / total) * 65);
                    this.updateProgress(percent, written, total);
                },
                calculateMD5Hash: (image) => {
                    if (typeof image === 'string') {
                        return CryptoJS.MD5(CryptoJS.enc.Latin1.parse(image)).toString();
                    }
                    
                    let bytes = image instanceof Uint8Array ? image : new Uint8Array(image);
                    let binaryStr = '';
                    for (let i = 0; i < bytes.length; i++) {
                        binaryStr += String.fromCharCode(bytes[i]);
                    }
                    return CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binaryStr)).toString();
                }
            };

            this.log('Đang ghi flash...', 'info');
            await this.esploader.writeFlash(flashOptions);

            this.updateProgress(85, this.firmwareData.length, this.firmwareData.length);
            this.log('✅ Ghi hoàn tất!', 'success');

            // Verify
            this.log('🔍 Đang xác minh...', 'info');
            this.updateProgress(95, this.firmwareData.length, this.firmwareData.length);

            // Complete
            this.updateProgress(100, this.firmwareData.length, this.firmwareData.length);
            this.log('='.repeat(50), 'info');
            this.log('🎉 Nạp firmware hoàn tất! Thiết bị đã sẵn sàng.', 'success');

            // Reset device
            this.log('🔄 Đang reset thiết bị...', 'info');
            try {
                if (this.esploader?.hardReset) {
                    await this.esploader.hardReset();
                } else if (this.device?.setSignals) {
                    await this.device.setSignals({ dataTerminalReady: true });
                    await new Promise(r => setTimeout(r, 100));
                    await this.device.setSignals({ dataTerminalReady: false });
                } else {
                    this.log('⚠️ Vui lòng reset thiết bị thủ công', 'warning');
                }
            } catch (e) {
                this.log('⚠️ Vui lòng reset thiết bị thủ công', 'warning');
            }

        } catch (error) {
            this.log(`❌ Nạp thất bại: ${error.message}`, 'error');
            console.error('Flash error:', error);
            
            if (error.message.includes('timeout')) {
                this.log('💡 Thử giảm baud rate hoặc kiểm tra cáp USB', 'warning');
            }
            
            this.updateProgress(0, 0, this.firmwareData?.length || 0);
        } finally {
            flashBtn.disabled = false;
        }
    }

    /**
     * Cập nhật progress bar
     */
    updateProgress(percent, written, total) {
        document.getElementById('progressBar').style.width = `${percent}%`;
        document.getElementById('progressText').textContent = `${percent}%`;
        document.getElementById('progressBytes').textContent = `${this.formatBytes(written)} / ${this.formatBytes(total)}`;
    }

    /**
     * Ghi log ra console
     */
    log(message, type = 'info') {
        const consoleOutput = document.getElementById('consoleOutput');
        const logLine = document.createElement('div');
        logLine.className = `log-line ${type}`;
        
        const timestamp = new Date().toLocaleTimeString('vi-VN');
        const sanitizedMessage = this.security.sanitizeConsoleOutput(message);
        logLine.textContent = `[${timestamp}] ${sanitizedMessage}`;
        
        consoleOutput.appendChild(logLine);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    /**
     * Format bytes
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
}

// Khởi tạo app khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Đợi Turnstile xác thực hoặc dev mode
    if (window.turnstileVerified) {
        window.flasher = new ESPWebFlasher();
    }
});

// Global function để khởi tạo flasher sau khi Turnstile xác thực
window.initializeFlasher = function() {
    if (!window.flasher) {
        window.flasher = new ESPWebFlasher();
    }
};
