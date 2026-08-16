"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { NeuralService } from "./feature.service";

export function useNeuralController() {
  const [targetId, setTargetId] = useState("google.com");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const lastUrlRef = useRef("google.com");

  const runScan = useCallback(async (id: string) => {
    setLoading(true);
    const result = await NeuralService.scanArchitecture(id);
    setAnalysis(result);
    setLoading(false);
  }, []);

  // Real-time synchronization with browser extension
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const resp = await fetch("http://localhost:8002/api/v1/status/current-url");
        if (resp.ok) {
           const data = await resp.json();
           // Scan if URL changed and is not localhost (to avoid loop)
           if (data.url && data.url !== lastUrlRef.current && !data.url.includes("localhost")) {
               console.log("Auto-scanning detected URL:", data.url);
               lastUrlRef.current = data.url;
               setTargetId(data.url);
               runScan(data.url);
           }
        }
      } catch (e) {
        // Warning suppression
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [runScan]);

  return {
    targetId,
    setTargetId,
    analysis,
    loading,
    runScan
  };
}
