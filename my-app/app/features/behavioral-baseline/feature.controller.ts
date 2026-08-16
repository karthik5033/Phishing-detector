"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { BehavioralService } from "./feature.service";
import { BehavioralReason } from "./types";

export function useBehavioralController() {
  const [loading, setLoading] = useState(true);
  const [baseline, setBaseline] = useState<any>(null);
  const [deviations, setDeviations] = useState<BehavioralReason[]>([]);
  const [activeCategory, setActiveCategory] = useState("BANKING");
  
  const [cognitiveStatus, setCognitiveStatus] = useState<any>(null);
  
  const interactionHistory = useRef<number>(0);

  // Load initial state
  useEffect(() => {
    BehavioralService.getBaselineStatus().then(data => {
      setBaseline(data);
      if (data) {
        interactionHistory.current = data.totalInteractions;
      }
      setLoading(false);
    });
  }, []);

  // Poll for real anomalies AND cognitive load
  useEffect(() => {
    if (loading) return;

    const poll = async () => {
      // 1. Fetch real anomalies from backend
      const realAnomalies = await BehavioralService.fetchRecentAnomalies();
      
      // 2. Refresh baseline stats
      const stats = await BehavioralService.getBaselineStatus();
      setBaseline(stats);

      // 3. Refresh Cognitive Status
      const cogStats = await BehavioralService.getCognitiveStatus();
      setCognitiveStatus(cogStats);

      setDeviations(realAnomalies.slice(0, 8));
    };

    poll(); // initial call
    const interval = setInterval(poll, 6000); // 6s poll
    return () => clearInterval(interval);
  }, [loading, activeCategory]);

  const resetBaseline = useCallback(async () => {
    setLoading(true);
    const result = await BehavioralService.resetBaseline();
    if (result.success) {
      setBaseline((prev: any) => ({
        ...prev,
        confidence: 0.1,
        totalInteractions: 0,
        lastReset: result.timestamp
      }));
      setDeviations([]);
    }
    setLoading(false);
  }, []);

  return {
    loading,
    baseline,
    deviations,
    cognitiveStatus,
    activeCategory,
    setActiveCategory,
    resetBaseline
  };
}
