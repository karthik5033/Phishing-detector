import { updateBaseline, getBehavioralMultiplier } from './baseline.js';

const API_BASE_URL = "http://localhost:8000/api/v1";

// Utility to sanitize URLs (remove query params)
function sanitizeURL(url) {
    try {
        const u = new URL(url);
        return `${u.protocol}//${u.hostname}${u.pathname}`;
    } catch (e) {
        return url;
    }
}

async function handleRiskCheck(payload, sendResponse) {
    const { text, url } = payload;
    const sanitizedUrl = url ? sanitizeURL(url) : null;
    
    // 1. Update User Baseline (this is an event)
    await updateBaseline();

    if (sanitizedUrl) {
         const cached = await chrome.storage.local.get(sanitizedUrl);
         if (cached[sanitizedUrl]) {
             sendResponse({ success: true, data: cached[sanitizedUrl] });
             return;
         }
    }

    try {
        // 2. Get Global Risk from Backend (includes Temporal Module)
        const now = new Date();
        const requestBody = {
            text: text || url,
            url: sanitizedUrl,
            page_title: payload.title || null, // Pass title for Module 3
            local_hour: now.getHours(),
            day_of_week: (now.getDay() + 6) % 7 
        };

        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);
        let data = await response.json();

        // 3. Apply Local Behavioral Multiplier
        const localMultiplier = await getBehavioralMultiplier();
        if (localMultiplier > 1.0) {
            console.log(`[Risk] Applying Local Anomaly Multiplier: ${localMultiplier}x`);
            data.max_risk_score = Math.min(data.max_risk_score * localMultiplier, 1.0);
            
            // Append local warning
            if (data.explanation) {
                data.explanation += " (Unusual activity pattern for you)";
            }
        }

        if (sanitizedUrl) {
            await chrome.storage.local.set({ 
                [sanitizedUrl]: { ...data, timestamp: Date.now() } 
            });
        }

        sendResponse({ success: true, data });
    } catch (error) {
        console.error("[SecureSentinel] Backend unreachable:", error);
        sendResponse({ success: false, error: error.message });
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[SecureSentinel] Msg:", message.type);

    if (message.type === "CHECK_RISK") {
        handleRiskCheck(message.payload, sendResponse);
        return true; 
    }

    if (message.type === "GET_CACHED_RESULT") {
        const sanitized = sanitizeURL(message.payload.url);
        chrome.storage.local.get(sanitized).then(result => {
            sendResponse({ result: result[sanitized] || null });
        });
        return true;
    }
});

console.log("[SecureSentinel] Service Worker Active.");
