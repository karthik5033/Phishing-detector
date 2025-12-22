import { updateBaseline, analyzeBehavior } from './baseline.js';

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
    const hostname = url ? new URL(url).hostname : null;
    
    // 1. Check Cache
    if (sanitizedUrl) {
         const cached = await chrome.storage.local.get(sanitizedUrl);
         if (cached[sanitizedUrl]) {
             sendResponse({ success: true, data: cached[sanitizedUrl] });
             return;
         }
    }

    try {
        // 2. Get Global Risk from Backend
        const now = new Date();
        const requestBody = {
            text: text || url,
            url: sanitizedUrl,
            page_title: payload.title || null,
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

        // 3. Apply Local Behavioral Analysis (if interaction data available)
        // Note: For link scans, we might not have interaction data yet, 
        // but for active tab checks we might.
        if (hostname) {
            const behavioralResult = await analyzeBehavior(hostname, payload.signals || {});
            if (behavioralResult.score > 0) {
                console.log(`[Risk] Behavioral Anomaly detected: +${behavioralResult.score}`);
                data.max_risk_score = Math.min(data.max_risk_score + behavioralResult.score, 1.0);
                
                // Explanation Engine Integration
                if (behavioralResult.reasons.length > 0) {
                    const localReasons = behavioralResult.reasons.map(r => r.detail).join(" ");
                    data.explanation = (data.explanation || "") + " | [Local Behavior] " + localReasons;
                    data.behavioral_reasons = behavioralResult.reasons; // Pass structured reasons for UI
                }
            }
        }

        if (sanitizedUrl) {
            await chrome.storage.local.set({ 
                [sanitizedUrl]: { ...data, timestamp: Date.now() } 
            });
        }

        sendResponse({ success: true, data });
    } catch (error) {
        console.error("[SecureSentinel] Communication failed:", error);
        sendResponse({ success: false, error: error.message });
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[SecureSentinel] Msg:", message.type);

    if (message.type === "CHECK_RISK") {
        handleRiskCheck(message.payload, sendResponse);
        return true; 
    }

    if (message.type === "BEHAVIORAL_SIGNAL") {
        const { hostname, ...signals } = message.payload;
        updateBaseline(hostname, signals).then(() => {
            console.log(`[Baseline] Signal recorded for ${hostname}`);
        });
        return false; // No response needed
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
