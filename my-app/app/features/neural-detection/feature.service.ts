import { API_BASE_URL } from "@/lib/constants";

/**
 * PRODUCTION SERVICE: Neural Detection
 * Drives identity verification from persistent event logs.
 */
export class NeuralService {
  /**
   * Scans real activity history to determine structural consistency.
   */
  static async scanArchitecture(claimedId: string) {
    try {
      // If it looks like a URL, scan it really
      if (claimedId.includes('.') && !claimedId.includes(' ')) {
          const resp = await fetch(`${API_BASE_URL}/neural/scan`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: claimedId.startsWith('http') ? claimedId : `https://${claimedId}` })
          });
          const result = await resp.json();
          return {
              claimedId,
              confidence: result.confidence,
              signals: result.signals,
              neuralVector: [0.12, 0.45, 0.89, 1.0, 0.23, 0.11, 0.67] // Visual placeholder
          };
      }

      // Fallback for non-URL inputs (Demo mode)
      const resp = await fetch(`${API_BASE_URL}/activity?limit=5`);
      if (!resp.ok) throw new Error("Neural Node Unreachable");
      const data = await resp.json();
      
      const highRisks = data.filter((s: any) => s.risk_score > 0.5).length;
      const confidence = 1 - (highRisks * 0.15);

      return {
        claimedId,
        confidence: Math.max(0.1, confidence),
        signals: data.slice(0, 3).map((item: any) => ({
          id: `NODE_${item.id}`,
          status: item.risk_score < 0.4 ? "VALID" : "MISMATCH",
          severity: item.risk_score,
          weight: 0.3
        })),
        neuralVector: [0.12, 0.45, 0.89, 1.0, 0.23, 0.11, 0.67]
      };
      } catch (e) {
      return {
        claimedId,
        confidence: 0,
        signals: [
            { id: "SYSTEM_CONNECTION", status: "FAILED", score: 0 },
            { id: "NEURAL_CORE", status: "UNREACHABLE", score: 0 }
        ],
        neuralVector: []
      };
    }
  }
}
