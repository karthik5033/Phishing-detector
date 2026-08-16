"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { TemporalService } from "./feature.service";

const DEMO_TEXT = "Your account session will expire immediately. Please update your credentials now to avoid being locked out permanently.";

export function useTemporalController() {
  const [text, setText] = useState(DEMO_TEXT);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const lastBackendText = useRef<string>("");

  // Fetch history from backend
  const fetchHistory = useCallback(async (isInitial = false) => {
    const historyData = await TemporalService.fetchHistory();
    if (historyData && historyData.length > 0) {
      setHistory(historyData.slice(0, 10).map((item: any, index: number) => ({
        text: item.text,
        result: item,
        timestamp: new Date()
      })));
      
      const latestItem = historyData[0];
      const isNewUpdate = latestItem.text !== lastBackendText.current;
      
      // Update view if:
      // 1. It's the very first load
      // 2. OR It's a NEW item from backend AND we are watching the "Live" slot (index 0)
      if ((isInitial || (isNewUpdate && selectedIndex === 0)) && latestItem) {
        lastBackendText.current = latestItem.text;
        setText(latestItem.text);
        setAnalysis(latestItem);
        setIsLive(true);
      }
    }
  }, [selectedIndex]);

  // Select a history item to view
  const selectHistoryItem = useCallback((index: number) => {
    if (history[index]) {
      setSelectedIndex(index);
      setText(history[index].text);
      setAnalysis(history[index].result);
      setIsLive(true);
    }
  }, [history]);

  // Navigate to previous item
  const goToPrevious = useCallback(() => {
    if (selectedIndex < history.length - 1) {
      selectHistoryItem(selectedIndex + 1);
    }
  }, [selectedIndex, history.length, selectHistoryItem]);

  // Navigate to next item (more recent)
  const goToNext = useCallback(() => {
    if (selectedIndex > 0) {
      selectHistoryItem(selectedIndex - 1);
    }
  }, [selectedIndex, selectHistoryItem]);

  // Analyze text manually (or simulated)
  const runAnalysis = useCallback(async (input: string) => {
    if (!input.trim()) return;
    setLoading(true);
    setText(input);
    
    // Optimistically update tracker to prevent race condition with polling
    lastBackendText.current = input;

    const result = await TemporalService.analyzeText(input);
    if (result) {
      setAnalysis(result);
      setIsLive(input !== DEMO_TEXT);
      setSelectedIndex(0);
      // Refresh history after new analysis
      setTimeout(() => fetchHistory(false), 500);
    }
    setLoading(false);
  }, [fetchHistory]);

  // Initial fetch + poll for new data
  useEffect(() => {
    // Initial fetch of history
    fetchHistory(true);
    
    // Poll for new data every 3 seconds
    const interval = setInterval(() => fetchHistory(false), 3000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  return {
    text,
    setText,
    analysis,
    loading,
    runAnalysis,
    history,
    isLive,
    selectedIndex,
    selectHistoryItem,
    goToPrevious,
    goToNext,
    canGoPrevious: selectedIndex < history.length - 1,
    canGoNext: selectedIndex > 0
  };
}
