/**
 * Behavioral Baseline Service (Advanced)
 * Maintains a local, privacy-preserving model of user activity using IndexedDB.
 * Uses statistical thresholds (Mean/StdDev) to detect intent anomalies.
 */

const DB_NAME = 'SecureSentinel_Behavioral';
const DB_VERSION = 1;
const STORE_NAME = 'baseline_stats';

/**
 * Categorizes a hostname based on privacy-safe keywords.
 * Returns: 'BANKING', 'SOCIAL', 'PRODUCTIVITY', 'SHOPPING', or 'GENERAL'
 */
function getCategory(hostname) {
    const h = hostname.toLowerCase();
    if (/bank|paypal|stripe|venmo|cashapp|crypto|wallet|binance/.test(h)) return 'BANKING';
    if (/facebook|twitter|instagram|linkedin|tiktok|discord|reddit/.test(h)) return 'SOCIAL';
    if (/google|outlook|microsoft|slack|jira|github|gitlab|notion/.test(h)) return 'PRODUCTIVITY';
    if (/amazon|ebay|etsy|shopify|walmart|target/.test(h)) return 'SHOPPING';
    return 'GENERAL';
}

/**
 * Initializes/Opens IndexedDB
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'category' });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Statistical Helper: Update Welford's algorithm for online variance
 */
function updateStats(stats, value) {
    const n = (stats.count || 0) + 1;
    const oldMean = stats.mean || 0;
    const newMean = oldMean + (value - oldMean) / n;
    const oldM2 = stats.m2 || 0;
    const newM2 = oldM2 + (value - oldMean) * (value - newMean);
    
    return {
        count: n,
        mean: newMean,
        m2: newM2,
        stdDev: n > 1 ? Math.sqrt(newM2 / (n - 1)) : 0
    };
}

/**
 * Records a new behavioral signal safely.
 * @param {string} hostname - The site's hostname
 * @param {Object} signals - { timeToInteraction, sequenceLength, popupDetected }
 */
export async function updateBaseline(hostname, signals) {
    const categoryName = getCategory(hostname);
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const getReq = store.get(categoryName);
    
    getReq.onsuccess = () => {
        let data = getReq.result || { 
            category: categoryName, 
            timeStats: { count: 0, mean: 0, m2: 0 },
            popups: 0,
            totalInteractions: 0,
            lastUpdated: Date.now()
        };

        // Update Time to Interaction
        if (signals.timeToInteraction) {
            data.timeStats = updateStats(data.timeStats, signals.timeToInteraction);
        }

        // Update Popup Frequency
        if (signals.popupDetected) {
            data.popups += 1;
        }

        data.totalInteractions += 1;
        data.lastUpdated = Date.now();

        // Decay logic: Every 100 interactions, slightly reduce count to favor recent behavior
        if (data.totalInteractions % 100 === 0) {
            data.totalInteractions = Math.floor(data.totalInteractions * 0.9);
            data.timeStats.count = Math.floor(data.timeStats.count * 0.9);
        }

        store.put(data);
    };
}

/**
 * Analyzes a current event against the baseline.
 * @returns {Object} { score: 0..1, explanation: string[] }
 */
export async function analyzeBehavior(hostname, signals) {
    const categoryName = getCategory(hostname);
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
        const getReq = store.get(categoryName);
        getReq.onsuccess = () => {
            const baseline = getReq.result;
            const results = { score: 0, reasons: [] };

            if (!baseline || baseline.totalInteractions < 5) {
                resolve({ score: 0, reasons: [] }); // Cold start
                return;
            }

            // 1. Time to Interaction Anomaly (Sudden fast interaction)
            if (signals.timeToInteraction && baseline.timeStats.count >= 5) {
                const diff = (baseline.timeStats.mean - signals.timeToInteraction);
                const threshold = 2 * baseline.timeStats.stdDev;
                
                // If interaction is much faster than usual for this category
                if (diff > threshold && signals.timeToInteraction < 2000) {
                    results.score += 0.4;
                    results.reasons.push({
                        id: "SUDDEN_INTERACTION",
                        desc: "Sudden interaction detected",
                        detail: `You interacted with this page much faster than your usual pattern for ${categoryName.toLowerCase()} sites.`
                    });
                }
            }

            // 2. Unexpected Popup / Overlay
            if (signals.popupDetected) {
                const popupProb = baseline.popups / baseline.totalInteractions;
                if (popupProb < 0.05) { // If popups are rare here
                    results.score += 0.35;
                    results.reasons.push({
                        id: "UNEXPECTED_OVERLAY",
                        desc: "Unexpected overlay detected",
                        detail: "A sensitive input field was requested via a popup, which is rare for this type of service."
                    });
                }
            }

            // Cap score at 1.0
            results.score = Math.min(results.score, 1.0);
            resolve(results);
        };
    });
}
