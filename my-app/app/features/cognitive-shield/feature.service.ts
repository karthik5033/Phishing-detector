const API_BASE_URL = "http://127.0.0.1:8002/api/v1";

/**
 * PRODUCTION SERVICE: Cognitive Shield
 * Real-time stress inference from telemetry logs.
 */
export class CognitiveService {
  /**
   * Derives real stress level from the recent frequency of high-risk events.
   */
  static async getStressLevel() {
    try {
      const resp = await fetch(`${API_BASE_URL}/dashboard`);
      const data = await resp.json();
      
      const riskRatio = (data.kpi.threats_blocked / (data.kpi.total_scans || 1));
      
      const recentThreats = data.recent_interventions?.filter((i: any) => i.score > 0.4) || [];
      const hasRecentThreats = recentThreats.length > 0;

      // Generate dynamic triggers based on real data
      let realTriggers = [];
      if (hasRecentThreats) {
        realTriggers = recentThreats.slice(0, 3).map((t: any) => 
          `threat_vector_${t.score > 0.8 ? 'critical' : 'warning'}::${t.domain.substring(0, 20)}`
        );
      } else {
        realTriggers = [
          "System Baseline Nominal",
          "No Active Vectors Detected",
          "Background Monitoring Active"
        ];
      }

      return {
        level: Math.min(riskRatio * 5, 0.95), // Scale risk density to stress
        status: riskRatio > 0.1 ? "HIGH_ALERT" : (hasRecentThreats ? "ELEVATED" : "STABLE"),
        triggers: realTriggers
      };
    } catch (e) {
      return { level: 0, status: "OFFLINE", triggers: [] };
    }
  }

  /**
   * Functional UI Suppression List.
   */
  static getSuppressionList() {
    return [
      { id: "POPUP_ADS", desc: "Dynamic Marketing Overlays", status: "SUPPRESSED" },
      { id: "STICKY_HEADER", desc: "Secondary Navigation Nodes", status: "SUPPRESSED" },
      { id: "SOCIAL_WIDGETS", desc: "Distracting Telemetry Streams", status: "SUPPRESSED" },
      { id: "FOMO_TIMERS", desc: "Artificial Pressure Markers", status: "BLOCKED" }
    ];
  }
}
