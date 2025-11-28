/**
 * MiniZ Flash - Cloudflare Worker
 * Bảo mật firmware download qua server-side verification
 * 
 * HƯỚNG DẪN DEPLOY:
 * 1. Vào https://dash.cloudflare.com/ → Workers & Pages
 * 2. Create Application → Create Worker
 * 3. Copy code này vào Worker
 * 4. Deploy
 * 5. Thêm KV Namespace để lưu license bindings
 */

// ============================================
// CẤU HÌNH - THAY ĐỔI THEO NHU CẦU
// ============================================

const CONFIG = {
    // Secret key để mã hóa (THAY ĐỔI NGAY!)
    SECRET_KEY: 'miniz-secret-2025-vn-firmware-protection',
    
    // Turnstile Secret Key (từ Cloudflare Dashboard)
    TURNSTILE_SECRET: '0x4AAAAAAACDiqpablKrVCk3s-1XQpd26ILE',
    
    // GitHub Token - LẤY TỪ ENVIRONMENT VARIABLE (bảo mật hơn)
    // Không lưu token trực tiếp trong code!
    // Thêm vào Worker Settings > Variables > Environment Variables
    // Tên biến: GITHUB_TOKEN
    
    // GitHub Private Repo
    GITHUB_REPO: 'giongaysau-stack/minizflash-private',
    
    // Allowed origins
    ALLOWED_ORIGINS: [
        'https://minizjp.com',
        'https://www.minizjp.com',
        'https://giongaysau-stack.github.io',
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ],
    
    // Firmware files trong private repo
    FIRMWARE_FILES: {
        'firmware1': 'firmware/firmware1.bin',
        'firmware2': 'firmware/firmware2.bin',
        'firmware3': 'firmware/firmware3.bin',
        'demo': 'firmware/firmware_demo.bin'
    }
};

// License keys hợp lệ (hash SHA256)
// Không lưu key gốc, chỉ lưu hash
const VALID_KEY_HASHES = new Set([
    // Sẽ được generate từ keys gốc
]);

// Tạm thời: danh sách keys gốc để validate
// SAU KHI DEPLOY: xóa và chỉ dùng hashes
const VALID_KEYS = new Set([
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
]);

// ============================================
// MAIN WORKER
// ============================================

export default {
    async fetch(request, env, ctx) {
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Turnstile-Token',
        };

        // Handle preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // Route handling
            if (path === '/api/validate-license') {
                return await handleValidateLicense(request, env, corsHeaders);
            }
            
            if (path === '/api/download-firmware') {
                return await handleDownloadFirmware(request, env, corsHeaders);
            }
            
            if (path === '/api/verify-turnstile') {
                return await handleVerifyTurnstile(request, corsHeaders);
            }

            if (path === '/health') {
                return jsonResponse({ status: 'ok', timestamp: Date.now() }, corsHeaders);
            }

            return jsonResponse({ error: 'Not Found' }, corsHeaders, 404);

        } catch (error) {
            console.error('Worker error:', error);
            return jsonResponse({ error: 'Internal Server Error' }, corsHeaders, 500);
        }
    }
};

// ============================================
// API HANDLERS
// ============================================

/**
 * Xác thực Turnstile token
 */
async function handleVerifyTurnstile(request, corsHeaders) {
    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, corsHeaders, 405);
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
        return jsonResponse({ success: false, error: 'Missing token' }, corsHeaders, 400);
    }

    // Verify with Cloudflare
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            secret: CONFIG.TURNSTILE_SECRET,
            response: token
        })
    });

    const result = await verifyResponse.json();
    
    return jsonResponse({
        success: result.success,
        challenge_ts: result.challenge_ts
    }, corsHeaders);
}

/**
 * Xác thực license key
 */
async function handleValidateLicense(request, env, corsHeaders) {
    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, corsHeaders, 405);
    }

    const body = await request.json();
    const { licenseKey, macAddress, turnstileToken } = body;

    // Validate inputs
    if (!licenseKey || !macAddress) {
        return jsonResponse({ 
            valid: false, 
            error: 'Missing license key or MAC address' 
        }, corsHeaders, 400);
    }

    // Verify Turnstile first (optional but recommended)
    if (turnstileToken) {
        const turnstileValid = await verifyTurnstile(turnstileToken);
        if (!turnstileValid) {
            return jsonResponse({ 
                valid: false, 
                error: 'Turnstile verification failed' 
            }, corsHeaders, 403);
        }
    }

    const normalizedKey = licenseKey.toUpperCase().trim();

    // Check if key exists
    if (!VALID_KEYS.has(normalizedKey)) {
        return jsonResponse({ 
            valid: false, 
            error: 'Invalid license key' 
        }, corsHeaders);
    }

    // Check binding in KV (if available)
    if (env.LICENSE_BINDINGS) {
        const binding = await env.LICENSE_BINDINGS.get(normalizedKey);
        
        if (binding) {
            const data = JSON.parse(binding);
            if (data.mac !== macAddress) {
                return jsonResponse({ 
                    valid: false, 
                    error: 'License key is bound to another device' 
                }, corsHeaders);
            }
            
            // Update use count
            data.useCount++;
            data.lastUsed = new Date().toISOString();
            await env.LICENSE_BINDINGS.put(normalizedKey, JSON.stringify(data));
            
            return jsonResponse({ 
                valid: true, 
                message: `License valid (Use #${data.useCount})`,
                accessToken: generateAccessToken(normalizedKey, macAddress)
            }, corsHeaders);
        }
        
        // First use - bind to this device
        const newBinding = {
            mac: macAddress,
            firstUsed: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            useCount: 1
        };
        await env.LICENSE_BINDINGS.put(normalizedKey, JSON.stringify(newBinding));
    }

    // Generate access token for firmware download
    const accessToken = generateAccessToken(normalizedKey, macAddress);

    return jsonResponse({ 
        valid: true, 
        message: 'License activated',
        accessToken: accessToken,
        expiresIn: 300 // 5 minutes
    }, corsHeaders);
}

/**
 * Download firmware (protected)
 */
async function handleDownloadFirmware(request, env, corsHeaders) {
    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, corsHeaders, 405);
    }

    const body = await request.json();
    const { firmwareId, accessToken, macAddress } = body;

    // Validate access token
    if (!accessToken || !validateAccessToken(accessToken, macAddress)) {
        return jsonResponse({ 
            error: 'Invalid or expired access token' 
        }, corsHeaders, 403);
    }

    // Get firmware path from config
    const firmwarePath = CONFIG.FIRMWARE_FILES[firmwareId];
    if (!firmwarePath) {
        return jsonResponse({ error: 'Firmware not found' }, corsHeaders, 404);
    }

    // Get GitHub token from environment variable
    const githubToken = env.GITHUB_TOKEN;
    if (!githubToken) {
        console.error('GITHUB_TOKEN not configured in Worker environment');
        return jsonResponse({ 
            error: 'Server configuration error' 
        }, corsHeaders, 500);
    }

    // Build GitHub API URL for private repo
    const githubApiUrl = `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/contents/${firmwarePath}`;

    // Fetch firmware from private GitHub repo using token
    const firmwareResponse = await fetch(githubApiUrl, {
        headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3.raw',
            'User-Agent': 'MiniZ-Flash-Worker'
        }
    });

    if (!firmwareResponse.ok) {
        console.error('GitHub API Error:', firmwareResponse.status, await firmwareResponse.text());
        return jsonResponse({ 
            error: 'Failed to fetch firmware from repository' 
        }, corsHeaders, 500);
    }

    const firmwareData = await firmwareResponse.arrayBuffer();

    // Log download for analytics (optional)
    if (env.LICENSE_BINDINGS) {
        const logKey = `download:${Date.now()}`;
        await env.LICENSE_BINDINGS.put(logKey, JSON.stringify({
            firmwareId,
            macAddress,
            timestamp: new Date().toISOString(),
            size: firmwareData.byteLength
        }), { expirationTtl: 86400 * 30 }); // Keep logs 30 days
    }

    // Return firmware binary
    return new Response(firmwareData, {
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${firmwareId}.bin"`,
            'X-Firmware-Size': firmwareData.byteLength.toString(),
            'Cache-Control': 'no-store'
        }
    });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function jsonResponse(data, corsHeaders, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
        }
    });
}

async function verifyTurnstile(token) {
    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: CONFIG.TURNSTILE_SECRET,
                response: token
            })
        });
        const result = await response.json();
        return result.success;
    } catch (e) {
        return false;
    }
}

function generateAccessToken(licenseKey, macAddress) {
    const timestamp = Date.now();
    const data = `${licenseKey}:${macAddress}:${timestamp}`;
    // Simple token - in production use proper JWT
    return btoa(data + ':' + simpleHash(data + CONFIG.SECRET_KEY));
}

function validateAccessToken(token, macAddress) {
    try {
        const decoded = atob(token);
        const parts = decoded.split(':');
        if (parts.length < 4) return false;
        
        const [key, mac, timestamp, hash] = parts;
        
        // Check MAC matches
        if (mac !== macAddress) return false;
        
        // Check expiry (5 minutes)
        const tokenTime = parseInt(timestamp);
        if (Date.now() - tokenTime > 300000) return false;
        
        // Check hash
        const expectedHash = simpleHash(`${key}:${mac}:${timestamp}` + CONFIG.SECRET_KEY);
        if (hash !== expectedHash) return false;
        
        return true;
    } catch (e) {
        return false;
    }
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}
