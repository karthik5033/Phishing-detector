"use client";

import { useState, useCallback, useEffect } from "react";
import { CognitiveService } from "./feature.service";

export function useCognitiveController() {
  const [isShieldActive, setIsShieldActive] = useState(true);
  const [stressData, setStressData] = useState<any>(null);
  const [suppressedElements, setSuppressedElements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    CognitiveService.getStressLevel().then(data => {
      setStressData(data);
      setSuppressedElements(CognitiveService.getSuppressionList());
      setLoading(false);
    });
  }, []);

  const toggleShield = useCallback(() => {
    setIsShieldActive(prev => !prev);
  }, []);

  return {
    isShieldActive,
    stressData,
    suppressedElements,
    loading,
    toggleShield
  };
}
