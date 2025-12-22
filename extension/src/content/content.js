/**
 * SecureSentinel Content Script
 * Observes DOM changes, injects risk badges, and collects behavioral signals.
 */

console.log("[SecureSentinel] Content script active on:", window.location.href);

const startTime = Date.now();
let firstInteractionDone = false;

/**
 * Signal Collection: Detect interactions and anomalies
 */
function reportSignal(type, extra = {}) {
    const timeSinceLoad = Date.now() - startTime;
    chrome.runtime.sendMessage({
        type: "BEHAVIORAL_SIGNAL",
        payload: {
            hostname: window.location.hostname,
            timeToInteraction: timeSinceLoad,
            signalType: type,
            ...extra
        }
    });
}

// 1. Detect Form Interactions
document.addEventListener("focus", (e) => {
    if (firstInteractionDone) return;
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        firstInteractionDone = true;
        reportSignal("FORM_FOCUS", { tagName: e.target.tagName });
    }
}, true);

// 2. Detect Popups/Overlays
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
                const style = window.getComputedStyle(node);
                const isOverlay = style.position === "fixed" || style.position === "absolute";
                const isHighZ = parseInt(style.zIndex) > 100;
                const hasInput = node.querySelector("input, textarea");

                if (isOverlay && isHighZ && hasInput) {
                    reportSignal("POPUP_DETECTED", { popupDetected: true });
                }
            }
        });
    });
});
observer.observe(document.body, { childList: true, subtree: true });

/**
 * UI: Risk Badge Injection
 */
function injectBadge(element, score) {
    if (element.dataset.sentinelChecked === "injected") return;
    element.dataset.sentinelChecked = "injected";

    const container = document.createElement("span");
    container.className = "sentinel-badge-anchor";
    container.style.cssText = `
        display: inline-flex !important;
        vertical-align: middle !important;
        margin-left: 6px !important;
        align-items: center !important;
        justify-content: center !important;
        transform: translateY(-1px) !important;
        height: 1em !important;
        width: 1em !important;
    `;

    const shadow = container.attachShadow({ mode: "open" });
    const color = score > 0.8 ? "#f43f5e" : score > 0.6 ? "#f59e0b" : "#10b981";
    const label = score > 0.8 ? "High Risk" : score > 0.6 ? "Suspicious" : "Likely Safe";

    shadow.innerHTML = `
    <style>
      :host {
        display: inline-flex;
        vertical-align: middle;
      }
      .badge {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: ${color};
        box-shadow: 0 0 4px ${color}66;
        cursor: pointer;
        border: 1.5px solid white;
        transition: transform 0.2s;
        flex-shrink: 0;
      }
      .badge:hover {
        transform: scale(1.3);
      }
    </style>
    <div class="badge" title="SecureSentinel: ${label} (${Math.round(score * 100)}%)"></div>
  `;

    const titleElement = element.querySelector("h3, .title, [class*='title']") || element;
    if (titleElement !== element) {
        titleElement.style.display = "inline";
        titleElement.appendChild(container);
    } else {
        element.appendChild(container);
    }
}

function scanLinks() {
    const links = document.querySelectorAll("a[href^='http']:not([data-sentinel-checked])");
    links.forEach(link => {
        const url = link.href;
        if (url.includes(window.location.hostname) || url.length > 300) {
            link.dataset.sentinelChecked = "skipped";
            return;
        }

        chrome.runtime.sendMessage({
            type: "CHECK_RISK",
            payload: { url }
        }, (response) => {
            if (chrome.runtime.lastError) return;
            if (response && response.success) {
                injectBadge(link, response.data.max_risk_score);
            }
        });
    });
}

[500, 1500, 3000].forEach(ms => setTimeout(scanLinks, ms));
const linkObserver = new MutationObserver(() => {
    if (window.scanTimeout) clearTimeout(window.scanTimeout);
    window.scanTimeout = setTimeout(scanLinks, 300);
});
linkObserver.observe(document.body, { childList: true, subtree: true });
