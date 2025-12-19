/**
 * Behavioral Baseline Service
 * Maintains a local, privacy-preserving model of user activity.
 * Data is stored in chrome.storage.local as 'user_baseline'.
 */

const DEFAULT_BASELINE = {
    total_events: 0,
    hourly_counts: new Array(24).fill(0), // [0, 0, ..., 0] for 0-23h
    last_updated: Date.now()
};

/**
 * Initializes or retrieves the baseline from storage.
 */
async function getBaseline() {
    const result = await chrome.storage.local.get('user_baseline');
    return result.user_baseline || DEFAULT_BASELINE;
}

/**
 * Updates the baseline with a new event at the current time.
 */
export async function updateBaseline() {
    const baseline = await getBaseline();
    const currentHour = new Date().getHours();

    baseline.total_events += 1;
    baseline.hourly_counts[currentHour] += 1;
    baseline.last_updated = Date.now();

    // Decay old data periodically (e.g., if total > 1000, divide by 2) to adapt to lifestyle changes
    if (baseline.total_events > 1000) {
        baseline.total_events = Math.floor(baseline.total_events / 2);
        baseline.hourly_counts = baseline.hourly_counts.map(c => Math.floor(c / 2));
    }

    await chrome.storage.local.set({ user_baseline: baseline });
    console.log("[Baseline] Updated:", baseline.hourly_counts);
}

/**
 * Calculates an anomaly score for the current activity.
 * Returns a multiplier > 1.0 if activity is unusual.
 */
export async function getBehavioralMultiplier() {
    const baseline = await getBaseline();
    
    // Cold Start: If not enough data, return neutral
    if (baseline.total_events < 20) return 1.0;

    const currentHour = new Date().getHours();
    const expected = baseline.hourly_counts[currentHour] / baseline.total_events;
    
    // Anomaly Detection Logic
    // If expected probability for this hour is < 2% (very rare time for user), increase risk
    if (expected < 0.02) {
        console.log(`[Baseline] Anomaly detected at hour ${currentHour} (p=${expected.toFixed(3)})`);
        return 1.25; // +25% Risk Multiplier
    }

    return 1.0;
}
