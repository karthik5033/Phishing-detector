"use client";

import { useState, useCallback, useEffect } from "react";
import { MeshService } from "./feature.service";

export function useMeshController() {
  const [signals, setSignals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isSharingEnabled, setIsSharingEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchMeshState = useCallback(async () => {
    setLoading(true);
    const s = await MeshService.getThreatSignals();
    const st = await MeshService.getMeshStats();
    setSignals(s);
    setStats(st);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMeshState();
    const interval = setInterval(fetchMeshState, 30000);
    return () => clearInterval(interval);
  }, [fetchMeshState]);

  const toggleSharing = useCallback(() => {
    setIsSharingEnabled(prev => !prev);
  }, []);

  return {
    signals,
    stats,
    isSharingEnabled,
    loading,
    toggleSharing
  };
}
