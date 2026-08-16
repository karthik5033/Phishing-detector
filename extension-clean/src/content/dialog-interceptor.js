/**
 * ClickWise Dialog Interceptor
 * Intercepts alert(), confirm(), prompt() dialogs and analyzes their content
 * for social engineering / phishing patterns.
 * Runs at document_start to override native dialog methods before page scripts execute.
 */

(function () {
    "use strict";

    // Avoid double-injection
    if (window.__clickwiseDialogInterceptorActive) return;
    window.__clickwiseDialogInterceptorActive = true;

    // Store originals
    const _alert = window.alert.bind(window);
    const _confirm = window.confirm.bind(window);
    const _prompt = window.prompt.bind(window);

    /**
     * Send dialog text to background for analysis
     */
    function analyzeDialogContent(text, dialogType) {
        if (!text || typeof text !== "string" || text.trim().length < 5) return;

        try {
            chrome.runtime.sendMessage({
                type: "ANALYZE_DIALOG",
                text: text,
                dialogType: dialogType,
                url: window.location.href
            }, (response) => {
                if (chrome.runtime.lastError) return;
                if (response && response.riskScore > 0.6) {
                    console.warn(
                        `%c[ClickWise] ⚠️ Suspicious ${dialogType} detected! Risk: ${Math.round(response.riskScore * 100)}%`,
                        "color: #ef4444; font-weight: bold"
                    );
                }
            });
        } catch (e) {
            // Extension context may be invalidated; fail silently
        }
    }

    // Override alert
    window.alert = function (message) {
        analyzeDialogContent(String(message), "alert");
        return _alert(message);
    };

    // Override confirm
    window.confirm = function (message) {
        analyzeDialogContent(String(message), "confirm");
        return _confirm(message);
    };

    // Override prompt
    window.prompt = function (message, defaultValue) {
        analyzeDialogContent(String(message), "prompt");
        return _prompt(message, defaultValue);
    };

    console.log("%c[ClickWise] Dialog Interceptor Active", "color: #10b981; font-size: 10px");
})();
