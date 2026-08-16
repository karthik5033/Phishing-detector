"use client";

import { useEffect, useState, useCallback } from "react";
import { BehavioralService } from "./feature.service";

/**
 * NEW FEATURE: Neural Session Fingerprinting Controller
 * Calculates an aggregate "Trust Score" by analyzing the sequence 
 * and density of real-time security events in the current session.
 */
export function useNeuralSessionFingerprint() {
  const [trustScore, setTrustScore] = useState(1.0);
  const [driftStatus, setDriftStatus] = useState("STABLE");
  const [eventHistory, setEventHistory] = useState<any[]>([]);

  const calculateFingerprint = useCallback(async () => {
    const activity = await BehavioralService.fetchRecentAnomalies();
    if (!activity || activity.length === 0) return;

    // Weight recent events more heavily
    // trust = 1.0 - (weighted avg of risk scores over last 10 events)
    const recent = activity.slice(0, 10);
    const totalRisk = recent.reduce((acc, curr) => acc + curr.score, 0);
    const avgRisk = totalRisk / (recent.length || 1);
    
    const newTrust = Math.max(0.05, 1.0 - (avgRisk * 1.2));
    
    setTrustScore(newTrust);
    setEventHistory(recent);
    
    if (newTrust < 0.3) {
      setDriftStatus("CRITICAL_IDENTITY_DRIFT");
    } else if (newTrust < 0.7) {
      setDriftStatus("SUSPICIOUS_ACTIVITY_SEQ");
    } else {
      setDriftStatus("STABLE_IDENTITY_FINGERPRINT");
    }
  }, []);

  useEffect(() => {
    calculateFingerprint();
    const interval = setInterval(calculateFingerprint, 10000); // Pulse every 10s
    return () => clearInterval(interval);
  }, [calculateFingerprint]);

  return { trustScore, driftStatus, eventHistory, refresh: calculateFingerprint };
}
