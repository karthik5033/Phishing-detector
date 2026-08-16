/**
 * ClickWise AI DLP (Data Loss Prevention)
 * Monitors user input on AI chat platforms (ChatGPT, Gemini, Claude)
 * and warns if sensitive/PII data is about to be shared.
 * Runs at document_start on AI chat sites only.
 */

(function () {
    "use strict";

    if (window.__clickwiseAiDlpActive) return;
    window.__clickwiseAiDlpActive = true;

    // Patterns that indicate sensitive/PII data
    const PII_PATTERNS = [
        { name: "Credit Card", pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/ },
        { name: "SSN", pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/ },
        { name: "Aadhaar", pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/ },
        { name: "Email", pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ },
        { name: "Phone", pattern: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/ },
        { name: "API Key", pattern: /\b(?:sk|pk|api|key|token|secret|password)[-_]?[a-zA-Z0-9]{16,}\b/i },
        { name: "Private Key", pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/i },
        { name: "Password", pattern: /\b(?:password|passwd|pwd)\s*[:=]\s*\S+/i }
    ];

    let lastWarned = 0;
    const WARN_COOLDOWN = 10000; // 10 seconds between warnings

    /**
     * Check text for PII and warn user
     */
    function checkForPII(text) {
        if (!text || text.length < 10) return;

        const now = Date.now();
        if (now - lastWarned < WARN_COOLDOWN) return;

        const detections = [];
        for (const { name, pattern } of PII_PATTERNS) {
            if (pattern.test(text)) {
                detections.push(name);
            }
        }

        if (detections.length > 0) {
            lastWarned = now;
            console.warn(
                `%c[ClickWise DLP] ⚠️ Sensitive data detected: ${detections.join(", ")}`,
                "color: #f59e0b; font-weight: bold; font-size: 12px"
            );

            // Show a non-intrusive warning banner
            showWarningBanner(detections);
        }
    }

    /**
     * Show a warning banner at the top of the page
     */
    function showWarningBanner(detections) {
        // Remove any existing banner
        const existing = document.getElementById("clickwise-dlp-banner");
        if (existing) existing.remove();

        const banner = document.createElement("div");
        banner.id = "clickwise-dlp-banner";
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 2147483647;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-bottom: 2px solid #f59e0b;
            color: #f8fafc;
            padding: 10px 16px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideDown 0.3s ease-out;
        `;

        banner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">🛡️</span>
                <span><b>ClickWise DLP:</b> Detected <b>${detections.join(", ")}</b> in your input. Be careful sharing sensitive data with AI services.</span>
            </div>
            <button id="clickwise-dlp-dismiss" style="
                background: transparent;
                border: 1px solid #475569;
                color: #94a3b8;
                padding: 4px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
                white-space: nowrap;
            ">Dismiss</button>
        `;

        document.body.prepend(banner);

        document.getElementById("clickwise-dlp-dismiss").addEventListener("click", () => {
            banner.remove();
        });

        // Auto-dismiss after 8 seconds
        setTimeout(() => {
            if (banner.parentNode) banner.remove();
        }, 8000);
    }

    /**
     * Monitor input fields and textareas for PII
     */
    function attachInputMonitors() {
        document.addEventListener("beforeinput", (e) => {
            if (e.data) {
                checkForPII(e.data);
            }
        }, true);

        // Also check on paste events
        document.addEventListener("paste", (e) => {
            const text = (e.clipboardData || window.clipboardData)?.getData("text");
            if (text) {
                checkForPII(text);
            }
        }, true);
    }

    // Wait for DOM to be ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", attachInputMonitors);
    } else {
        attachInputMonitors();
    }

    console.log("%c[ClickWise] AI DLP Monitor Active", "color: #10b981; font-size: 10px");
})();
