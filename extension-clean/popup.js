/**
 * ClickWise Popup Controller
 * Monochrome Professional Edition
 */

document.addEventListener('DOMContentLoaded', async () => {
    await loadStats();
    await loadActivity();
    checkBackendStatus();
    initControls();
});

function initControls() {
    // Refresh
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        await loadStats();
        await loadActivity();
        checkBackendStatus();
    });

    // Scan
    document.getElementById('scanBtn').addEventListener('click', handleScan);

    // Dashboard
    document.getElementById('openDashboard').addEventListener('click', () => {
        chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
    });

    // Protection Toggle
    const toggle = document.getElementById('protectionToggle');
    toggle.addEventListener('click', () => {
        toggle.classList.toggle('on');
        const isActive = toggle.classList.contains('on');
        document.getElementById('systemStatus').textContent = isActive ? 'Active' : 'Paused';
        document.querySelector('.dot').classList.toggle('active', isActive);
        chrome.storage.local.set({ protectionEnabled: isActive });
    });

    // Clear History
    document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
        if (confirm('Clear scan history?')) {
            await chrome.storage.local.set({ recentScans: [] });
            loadActivity();
        }
    });

    // Load initial Toggle State
    chrome.storage.local.get('protectionEnabled', (data) => {
        if (data.protectionEnabled === false) {
            toggle.classList.remove('on');
            document.getElementById('systemStatus').textContent = 'Paused';
            document.querySelector('.dot').classList.remove('active');
        }
    });
}

async function handleScan() {
    const btn = document.getElementById('scanBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Analyzing...';
    btn.style.opacity = '0.7';
    btn.style.cursor = 'wait';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            // 1. Analyze in extension (quick check)
            chrome.runtime.sendMessage({ 
                type: "ANALYZE_URL", 
                url: tab.url,
                isMainFrame: true
            });

            // 2. Open Detailed AI Report
            // This satisfies "get details in a page" using the Gemini-powered page
            const reportUrl = `http://localhost:3000/features/neural-detection?url=${encodeURIComponent(tab.url)}&auto=true`;
            chrome.tabs.create({ url: reportUrl });

            // Reset UI
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            }, 1000);
        }
    } catch (error) {
        console.error('Scan failed:', error);
        btn.textContent = 'Error';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }, 1000);
    }
}

async function checkBackendStatus() {
    try {
        const response = await fetch('http://127.0.0.1:8002/health');
        const dot = document.querySelector('.dot');
        if (response.ok) {
            dot.style.backgroundColor = '#f4f4f5'; // White/Active
            dot.classList.add('active');
        } else {
            dot.style.backgroundColor = '#ef4444'; // Red for offline error only
            dot.classList.remove('active');
        }
    } catch (error) {
        // Offline handling
    }
}

async function loadStats() {
    const result = await chrome.storage.local.get(['scansToday', 'threatsBlocked']);
    document.getElementById('scansToday').textContent = result.scansToday || 0;
    document.getElementById('threatsBlocked').textContent = result.threatsBlocked || 0;
}

async function loadActivity() {
    const result = await chrome.storage.local.get('recentScans');
    const scans = result.recentScans || [];
    const list = document.getElementById('activityList');
    
    list.innerHTML = '';

    if (scans.length === 0) {
        list.innerHTML = '<div class="empty-state">No recent activity recorded</div>';
        return;
    }

    // Limit to 3 items to prevent scrolling and keep UI compact
    scans.slice(0, 3).forEach(scan => {
        const item = document.createElement('div');
        item.className = 'feed-item';
        
        const score = scan.risk_score || 0;
        const percentage = Math.round(score * 100);
        
        let riskClass = '';
        if (score > 0.75) riskClass = 'high';
        
        item.innerHTML = `
            <div class="feed-info">
                <div class="risk-indicator ${riskClass}"></div>
                <div>
                    <div class="url-text">${truncateUrl(scan.url)}</div>
                    <div class="meta-text">${percentage}% Risk • ${formatTime(scan.timestamp)}</div>
                </div>
            </div>
            <div class="meta-text" style="opacity: 0.5">Details ›</div>
        `;
        
        list.appendChild(item);
    });
}

function truncateUrl(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return url.substring(0, 25) + '...';
    }
}

function formatTime(timestamp) {
    const diff = (Date.now() - timestamp) / 60000; // minutes
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${Math.floor(diff)}m ago`;
    return 'Older';
}
