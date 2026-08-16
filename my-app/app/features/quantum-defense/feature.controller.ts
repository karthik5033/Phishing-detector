"use client";

import { useState, useCallback, useEffect } from "react";
import { QuantumService } from "./feature.service";

export function useQuantumController() {
  const [chain, setChain] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshChain = useCallback(async () => {
    setLoading(true);
    const result = await QuantumService.getAttackChain();
    setChain(result);
    setStats(QuantumService.getCorrelationStats());
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshChain();
  }, [refreshChain]);

  return {
    chain,
    stats,
    loading,
    refreshChain
  };
}
