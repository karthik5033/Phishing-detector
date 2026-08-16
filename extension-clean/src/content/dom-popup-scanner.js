/**
 * ClickWise DOM Popup Scanner
 * Scans for suspicious DOM-based popups, overlays, and fake notification bars
 * that mimic browser UI (e.g., fake "Your computer is infected!" banners).
 * Runs at document_idle (after page fully loads).
 */

(function () {
    "use strict";

    if (window.__clickwiseDomPopupScannerActive) return;
    window.__clickwiseDomPopupScannerActive = true;

    // Suspicious text patterns commonly found in scam popups
    const SUSPICIOUS_PATTERNS = [
        /your\s+(computer|device|system)\s+(is|has been)\s+(infected|compromised|hacked)/i,
        /call\s+(this\s+number|now|immediately|us)/i,
        /virus\s+(detected|found|alert)/i,
        /windows\s+defender\s+alert/i,
        /microsoft\s+security\s+(alert|warning)/i,
        /your\s+account\s+(has been|will be)\s+(suspended|locked|terminated)/i,
        /click\s+here\s+to\s+(fix|clean|remove|verify)/i,
        /unauthorized\s+(access|login|activity)\s+detected/i,
        /your\s+data\s+(is|will be)\s+(encrypted|deleted|lost)/i,
        /act\s+now|limited\s+time|expires?\s+(today|soon|in\s+\d)/i
    ];

    /**
     * Check if an element looks like a suspicious overlay/popup
     */
    function isSuspiciousOverlay(el) {
        const style = window.getComputedStyle(el);
        const isFixed = style.position === "fixed" || style.position === "absolute";
        const isHighZ = parseInt(style.zIndex) > 9000;
        const isLargeEnough = el.offsetWidth > 200 && el.offsetHeight > 100;
        const isVisible = style.display !== "none" && style.visibility !== "hidden" && parseFloat(style.opacity) > 0.3;

        return isFixed && isHighZ && isLargeEnough && isVisible;
    }

    /**
     * Scan a text string for suspicious patterns
     */
    function matchesSuspiciousPattern(text) {
        if (!text || text.length < 20 || text.length > 2000) return false;
        return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(text));
    }

    /**
     * Scan visible DOM elements for scam popups
     */
    function scanForPopups() {
        // Look for high z-index fixed/absolute elements
        const candidates = document.querySelectorAll(
            "div[style*='z-index'], div[style*='position: fixed'], div[style*='position:fixed'], [role='dialog'], [role='alertdialog']"
        );

        candidates.forEach(el => {
            if (el.dataset.clickwiseScanned) return;
            el.dataset.clickwiseScanned = "true";

            if (!isSuspiciousOverlay(el)) return;

            const text = (el.innerText || "").trim();
            if (matchesSuspiciousPattern(text)) {
                console.warn(
                    "%c[ClickWise] ⚠️ Suspicious DOM popup detected!",
                    "color: #ef4444; font-weight: bold",
                    text.substring(0, 100)
                );

                // Notify background
                try {
                    chrome.runtime.sendMessage({
                        type: "ANALYZE_DIALOG",
                        text: text.substring(0, 500),
                        dialogType: "dom_popup",
                        url: window.location.href
                    });
                } catch (e) {
                    // Extension context invalidated
                }
            }
        });
    }

    // Initial scan
    scanForPopups();

    // Observe for dynamically injected popups
    const observer = new MutationObserver(() => {
        scanForPopups();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log("%c[ClickWise] DOM Popup Scanner Active", "color: #10b981; font-size: 10px");
})();
