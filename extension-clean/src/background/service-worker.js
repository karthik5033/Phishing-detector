/**
 * SecureSentinel Service Worker v3.0
 * Real-time blocking enabled
 */

const API_BASE = "http://127.0.0.1:8000/api/v1";
console.log("[SecureSentinel] Service Worker v3.0 - Build: 2025-12-30");

// Cache for analyzed URLs
const cache = new Map();
const CACHE_DURATION = 3600000; // 1 hour

// Temporary whitelist (session only)
const tempWhitelist = new Set();

// Permanent blocklist (synced from backend)
let permanentBlocklist = new Set();

// Settings
const DEFAULT_SETTINGS = {
    blockingEnabled: true,
    blockThreshold: 0.7,  // 70% risk score triggers block
    showWarnings: true
};

/**
 * Sync permanent blocklist from backend
 */
async function syncBlocklist() {
    try {
        const response = await fetch(`${API_BASE}/blocklist`, {
            method: "GET",
            cache: "no-cache"
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log("[SecureSentinel] 📥 Received blocklist data:", data);
            
            permanentBlocklist.clear();
            
            if (data.domains && Array.isArray(data.domains)) {
                data.domains.forEach(item => {
                    permanentBlocklist.add(item.domain.toLowerCase().trim()); // Normalize
                });
                console.log(`[SecureSentinel] 📋 Synced ${permanentBlocklist.size} permanently blocked domains:`, Array.from(permanentBlocklist));
            }
        } else {
             console.error(`[SecureSentinel] ❌ Blocklist sync failed: ${response.status}`);
        }
    } catch (error) {
        console.error("[SecureSentinel] ❌ Failed to sync blocklist (Network Error):", error);
    }
}

/**
 * Check if domain is in permanent blocklist
 */
function isPermanentlyBlocked(url) {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.toLowerCase(); // Normalize
        
        console.log(`[SecureSentinel] 🔍 Checking: ${domain} (Blocklist size: ${permanentBlocklist.size})`);
        
        // Debug: Log first 5 items if list is small or debugging
        if (permanentBlocklist.size > 0 && permanentBlocklist.size < 10) {
             console.log("[SecureSentinel] Blocklist content:", Array.from(permanentBlocklist));
        }

        // Check exact match
        if (permanentBlocklist.has(domain)) {
            console.log(`[SecureSentinel] 🚫 EXACT MATCH found for: ${domain}`);
            return true;
        }
        
        // Check if any parent domain is blocked
        const parts = domain.split('.');
        for (let i = 0; i < parts.length - 1; i++) {
            const parentDomain = parts.slice(i).join('.');
            if (permanentBlocklist.has(parentDomain)) {
                return true;
            }
        }
        
        return false;
    } catch (error) {
        return false;
    }
}

/**
 * Get user settings
 */
async function getSettings() {
    const result = await chrome.storage.local.get('settings');
    return { ...DEFAULT_SETTINGS, ...result.settings };
}

/**
 * Check backend health on startup
 */
async function checkBackend() {
    try {
        const res = await fetch("http://127.0.0.1:8000/health", {
            method: "GET",
            cache: "no-cache"
        });
        if (res.ok) {
            console.log("[SecureSentinel] ✅ Backend online");
            return true;
        }
    } catch (err) {
        console.warn("[SecureSentinel] ⚠️ Backend offline - start with: python start_server.py");
    }
    return false;
}

// Check backend on install/startup
chrome.runtime.onInstalled.addListener(() => {
    console.log("[SecureSentinel] Extension installed");
    checkBackend();
    syncBlocklist(); // Sync blocklist on install
});

// Sync blocklist every 5 minutes
setInterval(syncBlocklist, 5 * 60 * 1000);

// Initial sync
syncBlocklist();

/**
 * Analyze URL for phishing/malicious content
 */
async function analyzeURL(url, isMainFrame = false) {
    // Check cache first
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        if (isMainFrame) updateStats(url, cached.data.max_risk_score, true);
        return cached.data;
    }

    try {
        const response = await fetch(`${API_BASE}/detect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: url })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Cache result
        cache.set(url, {
            data: data,
            timestamp: Date.now()
        });

        // Limit cache size
        if (cache.size > 200) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }

        // Track stats for popup
        await updateStats(url, data.max_risk_score, isMainFrame);

        return data;
    } catch (error) {
        console.error("[SecureSentinel] API Error:", error.message);
        // Return safe default on error
        return {
            max_risk_score: 0,
            text: url,
            labels: {}
        };
    }
}

/**
 * Update statistics for popup
 */
async function updateStats(url, riskScore, isMainFrame) {
    try {
        const result = await chrome.storage.local.get(['scansToday', 'threatsBlocked', 'recentScans', 'lastResetDate']);
        
        const today = new Date().toDateString();
        let scansToday = result.scansToday || 0;
        let threatsBlocked = result.threatsBlocked || 0;
        let recentScans = result.recentScans || [];
        
        // Reset daily count if new day
        if (result.lastResetDate !== today) {
            scansToday = 0;
            await chrome.storage.local.set({ lastResetDate: today });
        }
        
        // Increment counters
        scansToday++;
        if (riskScore > 0.5) {
            threatsBlocked++;
            // Badge text for threats
            chrome.action.setBadgeText({ text: "!" });
            chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
        }
        
        // HISTORY LOGIC:
        // Only log if it's the MAIN PAGE we visited, OR if it's a THREAT found on the page.
        if (isMainFrame || riskScore > 0.5) {
            // Avoid duplicate consecutive entries
            if (recentScans.length === 0 || recentScans[0].url !== url) {
                recentScans.unshift({
                    url: url,
                    risk_score: riskScore,
                    timestamp: Date.now()
                });
                recentScans = recentScans.slice(0, 10);
            }
        }
        
        // Save updated stats
        await chrome.storage.local.set({
            scansToday,
            threatsBlocked,
            recentScans
        });
    } catch (error) {
        console.error("[SecureSentinel] Stats update failed:", error);
    }
}

/**
 * Web Navigation Listener - Real-time blocking
 */
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    // Only process main frame navigations
    if (details.frameId !== 0) return;
    
    const url = details.url;
    const tabId = details.tabId;
    
    // Skip chrome:// and extension pages
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
        return;
    }
    
    // Check if URL is whitelisted
    if (tempWhitelist.has(url)) {
        console.log("[SecureSentinel] ✅ Whitelisted:", url);
        return;
    }
    
    // Get settings
    const settings = await getSettings();
    if (!settings.blockingEnabled) {
        console.log("[SecureSentinel] ⏸️ Blocking disabled");
        return;
    }
    
    // PRIORITY 1: Check permanent blocklist (instant block, no API call needed)
    if (isPermanentlyBlocked(url)) {
        console.log("[SecureSentinel] 🚫 PERMANENTLY BLOCKED:", url);
        
        // Redirect to blocking page with permanent block indicator
        const blockedPageUrl = chrome.runtime.getURL('blocked.html') +
            '?url=' + encodeURIComponent(url) +
            '&risk=1.0' +
            '&permanent=true' +
            '&labels=' + encodeURIComponent(JSON.stringify({
                blocked: { probability: 1.0, top_features: [] }
            }));
        
        chrome.tabs.update(tabId, { url: blockedPageUrl });
        return;
    }
    
    // PRIORITY 2: Analyze URL with AI model
    console.log("[SecureSentinel] 🔍 Analyzing navigation:", url);
    const analysis = await analyzeURL(url, true);
    
    // Check if should block based on risk score
    if (analysis.max_risk_score >= settings.blockThreshold) {
        console.log("[SecureSentinel] 🛑 BLOCKING:", url, "Risk:", analysis.max_risk_score);
        
        // Redirect to blocking page
        const blockedPageUrl = chrome.runtime.getURL('blocked.html') +
            '?url=' + encodeURIComponent(url) +
            '&risk=' + analysis.max_risk_score +
            '&labels=' + encodeURIComponent(JSON.stringify(analysis.labels));
        
        chrome.tabs.update(tabId, { url: blockedPageUrl });
    } else {
        console.log("[SecureSentinel] ✅ Safe:", url, "Risk:", analysis.max_risk_score);
    }
});

/**
 * Message handler
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "ANALYZE_URL") {
        analyzeURL(message.url, message.isMainFrame)
            .then(data => sendResponse({ success: true, data }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true; 
    }
    
    if (message.type === "WHITELIST_TEMP") {
        // Add URL to temporary whitelist
        tempWhitelist.add(message.url);
        console.log("[SecureSentinel] ➕ Whitelisted:", message.url);
        sendResponse({ success: true });
        return false;
    }
    
    if (message.type === "LOG_BLOCKED") {
        // Log blocked attempt
        console.log("[SecureSentinel] 📝 Logged block:", message.url);
        sendResponse({ success: true });
        return false;
    }
    
    if (message.type === "REPORT_FALSE_POSITIVE") {
        // Handle false positive report
        console.log("[SecureSentinel] 📢 False positive reported:", message.url);
        // Could send to backend for retraining
        sendResponse({ success: true });
        return false;
    }
    
    if (message.type === "PING") {
        sendResponse({ status: "ok" });
        return false;
    }
});

console.log("[SecureSentinel] Service Worker ready - Blocking enabled");
