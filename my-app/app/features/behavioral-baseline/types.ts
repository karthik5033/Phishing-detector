export interface BehavioralReason {
  id: string;
  desc: string; // The category e.g. "Safe", "Phishing"
  detail: string; // The explanation
  domain: string; // The specific URL/Domain
  score: number;
  timestamp: string;
}

export interface BaselineData {
  confidence: number;
  totalInteractions: number;
  lastReset: string;
  categoryWeights: Record<string, number>;
}
