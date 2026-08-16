/**
 * ClickWise Content Script v2.1
 * Enhanced with interactive risk popup
 */

console.log("%c[ClickWise] Content Script v3.1 Active", "color: #10b981; font-weight: bold");

// Track processed links
const processed = new Set();

/**
 * Create detailed risk popup
 */
function createRiskPopup(data, badge) {
    const score = parseFloat(data.max_risk_score) || 0;
    const percentage = Math.round(score * 100);
    
    // Determine risk level — 3-tier badge system
    // >= 0.75 = RED (HIGH — triggers block page)
    // >= 0.55 = YELLOW (MEDIUM — warning only, no block)
    // <  0.55 = GREEN (LOW — safe)
    let riskLevel, riskColor;
    if (score >= 0.75) {
        riskLevel = "HIGH RISK";
        riskColor = "#ef4444";
    } else if (score >= 0.55) {
        riskLevel = "MODERATE";
        riskColor = "#f59e0b";
    } else {
        riskLevel = "SAFE";
        riskColor = "#10b981";
    }
    
    const popup = document.createElement("div");
    popup.className = "clickwise-popup";
    popup.style.cssText = `
        position: absolute;
        z-index: 999999;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border: 1px solid ${riskColor};
        border-radius: 12px;
        padding: 16px;
        min-width: 280px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${riskColor}40;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        display: none;
        animation: slideIn 0.2s ease-out;
    `;
    
    popup.innerHTML = `
        <style>
            @keyframes slideIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .clickwise-popup * { margin: 0; padding: 0; box-sizing: border-box; }
        </style>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 8px; height: 8px; background: ${riskColor}; border-radius: 50%; box-shadow: 0 0 8px ${riskColor};"></div>
                <span style="color: white; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">ClickWise</span>
            </div>
            <button onclick="this.closest('.clickwise-popup').style.display='none'" style="background: transparent; border: none; color: #64748b; cursor: pointer; font-size: 18px; padding: 0; width: 20px; height: 20px; line-height: 1;">×</button>
        </div>
        
        <div style="background: linear-gradient(135deg, ${riskColor}20, ${riskColor}10); border-left: 3px solid ${riskColor}; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <div style="color: ${riskColor}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Risk Assessment</div>
            <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px;">
                <span style="color: white; font-size: 32px; font-weight: 700; line-height: 1;">${percentage}%</span>
                <span style="color: ${riskColor}; font-size: 12px; font-weight: 600;">${riskLevel}</span>
            </div>
            <div style="background: #0f172a; height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background: ${riskColor}; height: 100%; width: ${percentage}%; border-radius: 3px; box-shadow: 0 0 8px ${riskColor};"></div>
            </div>
        </div>
        
        <div style="margin-bottom: 12px;">
            <div style="color: #94a3b8; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Detection Signals</div>
            ${Object.entries(data.labels || {}).map(([label, info]) => {
                const prob = Math.round((info.probability || 0) * 100);
                if (prob < 5) return '';
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #1e293b;">
                        <span style="color: #cbd5e1; font-size: 11px; text-transform: capitalize;">${label}</span>
                        <span style="color: ${prob > 50 ? '#ef4444' : '#64748b'}; font-size: 11px; font-weight: 600;">${prob}%</span>
                    </div>
                `;
            }).join('') || '<div style="color: #64748b; font-size: 11px; text-align: center; padding: 8px;">No threats detected</div>'}
        </div>
        
        <div style="background: #0f172a; padding: 10px; border-radius: 8px; border: 1px solid #1e293b;">
            <div style="color: #64748b; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Analyzed URL</div>
            <div style="color: #94a3b8; font-size: 10px; word-break: break-all; font-family: monospace;">${data.text || 'Unknown'}</div>
        </div>
        
        <div style="margin-top: 12px; text-align: center;">
            <div style="color: #475569; font-size: 9px; font-weight: 500;">ML-Powered Analysis • v3.1</div>
        </div>
    `;
    
    return popup;
}

/**
 * Position popup near badge
 */
function positionPopup(popup, badge) {
    const rect = badge.getBoundingClientRect();
    popup.style.top = `${rect.bottom + window.scrollY + 8}px`;
    popup.style.left = `${rect.left + window.scrollX - 100}px`;
}

/**
 * Create and inject enhanced badge
 */
function addBadge(link, data) {
    // Avoid duplicates
    if (link.querySelector(".clickwise-badge")) return;
    
    const score = parseFloat(data.max_risk_score) || 0;
    let color, label;
    
    if (score >= 0.75) {
        color = "#ef4444";
        label = "High Risk";
    } else if (score >= 0.55) {
        color = "#f59e0b";
        label = "Moderate";
    } else {
        color = "#10b981";
        label = "Safe";
    }
    
    // Create badge container
    const container = document.createElement("span");
    container.className = "clickwise-badge-container";
    container.style.cssText = `
        display: inline-block;
        position: relative;
        margin-left: 6px;
        vertical-align: middle;
    `;
    
    // Create badge
    const badge = document.createElement("span");
    badge.className = "clickwise-badge";
    badge.style.cssText = `
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: ${color};
        box-shadow: 0 0 8px ${color}, 0 2px 4px rgba(0,0,0,0.2);
        cursor: pointer;
        transition: transform 0.2s ease;
        border: 2px solid ${color}40;
    `;
    badge.title = `Click for details • ${label} (${Math.round(score * 100)}%)`;
    
    // Hover effect
    badge.onmouseenter = () => badge.style.transform = "scale(1.3)";
    badge.onmouseleave = () => badge.style.transform = "scale(1)";
    
    // Create popup
    const popup = createRiskPopup(data, badge);
    
    // Click handler
    badge.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Hide all other popups
        document.querySelectorAll('.clickwise-popup').forEach(p => {
            if (p !== popup) p.style.display = 'none';
        });
        
        // Toggle this popup
        if (popup.style.display === 'block') {
            popup.style.display = 'none';
        } else {
            popup.style.display = 'block';
            positionPopup(popup, badge);
        }
    };
    
    container.appendChild(badge);
    document.body.appendChild(popup);
    
    // Find best injection point
    // 1. Google Search: h3 with class LC20lb
    // 2. Brave Search: h2 or h3 inside result-header
    // 3. Common headers (h3, h2)
    // 4. Fallback to the link itself
    let titleElement = link.querySelector("h3.LC20lb") || 
                       link.querySelector("h3") || 
                       link.querySelector("h2") || 
                       link.closest(".g")?.querySelector("h3") ||
                       link.closest(".result")?.querySelector(".result-title") ||
                       link.querySelector("span");
                  
    if (titleElement) {
        // Try to find a text node or a span inside the title to follow
        const textNode = Array.from(titleElement.childNodes).find(node => node.nodeType === 3 && node.textContent.trim().length > 0);
        if (textNode) {
            titleElement.insertBefore(container, textNode.nextSibling);
        } else {
            titleElement.appendChild(container);
        }
    } else {
        // If no title found inside link, try to insert at end of link text
        link.appendChild(container);
    }
    
    console.log(`[ClickWise] Badge added for: ${link.href} (${Math.round(score * 100)}%)`);
}

// Cache for API results to avoid duplicate requests
const resultsCache = new Map();

/**
 * Scan link and add badge with retry logic
 */
async function scanLink(link) {
    const url = link.href;
    
    // Skip if invalid or local/dev
    if (!url || 
        url.includes("localhost") || 
        url.includes("127.0.0.1") ||
        url.includes("github.com") ||
        url.includes("gitlab.com")) {
        return;
    }

    // Skip if this specific ELEMENT already has a badge
    if (link.querySelector(".clickwise-badge") || link.getAttribute("data-clickwise-processed")) {
        return;
    }
    
    // Check Cache first
    if (resultsCache.has(url)) {
        addBadge(link, resultsCache.get(url));
        return;
    }
    
    // Mark as processing to prevent parallel fetches for same URL
    if (processed.has(url)) return;
    processed.add(url);
    
    try {
        const response = await chrome.runtime.sendMessage({
            type: "ANALYZE_URL",
            url: url
        });
        
        if (response && response.success && response.data) {
            // Cache result
            resultsCache.set(url, response.data);
            addBadge(link, response.data);
        } else {
            console.warn("[ClickWise] Scan empty response for:", url);
            processed.delete(url); // Allow retry later
            
            // One-time retry
            setTimeout(async () => {
                if(resultsCache.has(url)) return;
                try {
                    const retry = await chrome.runtime.sendMessage({ type: "ANALYZE_URL", url: url });
                    if (retry && retry.success && retry.data) {
                        resultsCache.set(url, retry.data);
                        addBadge(link, retry.data);
                    }
                } catch(e) {}
            }, 2000);
        }
    } catch (error) {
        console.error("[ClickWise] Scan failure:", error);
        processed.delete(url);
    }
}

/**
 * Find and scan links
 */
function scanAllLinks() {
    const isYouTube = window.location.hostname.includes('youtube.com');
    let links;

    if (isYouTube) {
        // YouTube specific selectors for main video cards
        links = document.querySelectorAll('a#video-title, a#video-title-link, a.ytd-video-renderer');
    } else {
        // Generic scan for other sites (Search Engines, etc)
        // Limit to likely content links to avoid nav clutter
        links = document.querySelectorAll('a[href^="http"]');
    }
    
    links.forEach((link, index) => {
        // Throttle scans
        setTimeout(() => scanLink(link), index * 50);
    });
}

// Close popups when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.clickwise-badge') && !e.target.closest('.clickwise-popup')) {
        document.querySelectorAll('.clickwise-popup').forEach(p => p.style.display = 'none');
    }
});

// Initial scans - Aggressive start
setTimeout(scanAllLinks, 500);
setTimeout(scanAllLinks, 2000);
setTimeout(scanAllLinks, 5000);

// Mutation observer for dynamic content (infinite scroll)
let scanTimeout;
const observer = new MutationObserver(() => {
    clearTimeout(scanTimeout);
    scanTimeout = setTimeout(scanAllLinks, 1000);
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log("[ClickWise] Monitoring active");

// Listen for forced scans from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FORCE_SCAN') {
        scanAllLinks();
        sendResponse({ status: 'scanning' });
    }
});
