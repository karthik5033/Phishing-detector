import { API_BASE_URL } from "@/lib/constants";

/**
 * TEMPORAL ANALYSIS SERVICE
 * Connects to backend for real-time popup/dialog analysis
 */

export class TemporalService {
  /**
   * Analyzes text using the dedicated temporal analysis endpoint.
   */
  static async analyzeText(text: string) {
    try {
      const resp = await fetch(`${API_BASE_URL}/temporal/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!resp.ok) throw new Error("Temporal Analysis Engine unavailable");
      
      const data = await resp.json();
      
      return {
        riskScore: data.risk_score,
        triggers: data.triggers || [],
        explanation: data.explanation,
        labels: data.categories
      };
    } catch (e) {
      console.error("Temporal Analysis Engine: Connection Failure", e);
      return null;
    }
  }

  /**
   * Fetches the latest intercepted temporal analysis from the backend.
   * This retrieves real popups/dialogs detected by the extension.
   */
  static async fetchLatestAnalysis() {
    try {
      const resp = await fetch(`${API_BASE_URL}/temporal/latest`);
      if (resp.ok) {
        const data = await resp.json();
        if (data) {
          return {
            text: data.text,
            riskScore: data.risk_score,
            triggers: data.triggers || [],
            explanation: data.explanation,
            labels: data.categories
          };
        }
      }
      return null;
    } catch (e) {
      console.error("Failed to fetch latest temporal analysis:", e);
      return null;
    }
  }

  /**
   * Fetches history of recent temporal scans
   */
  static async fetchHistory() {
    try {
      const resp = await fetch(`${API_BASE_URL}/temporal/history`);
      if (resp.ok) {
        const data = await resp.json();
        return data.map((item: any) => ({
          text: item.text,
          riskScore: item.risk_score,
          triggers: item.triggers || [],
          explanation: item.explanation
        }));
      }
      return [];
    } catch (e) {
      console.error("Failed to fetch temporal history:", e);
      return [];
    }
  }
}
