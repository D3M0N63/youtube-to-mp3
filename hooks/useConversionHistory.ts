"use client";

import { ConversionHistoryItem } from "@/types/audio";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "yt_to_mp3_history_v2";
const MAX_ITEMS = 8;

export function useConversionHistory() {
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch {
      // Ignore storage access errors
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const addHistoryItem = useCallback(
    (item: Omit<ConversionHistoryItem, "downloadedAt">) => {
      setHistory((prev) => {
        const entry: ConversionHistoryItem = {
          ...item,
          downloadedAt: new Date().toISOString(),
        };
        const filtered = prev.filter(
          (existing) =>
            !(
              existing.videoId === item.videoId &&
              existing.bitrate === item.bitrate
            )
        );
        const updated = [entry, ...filtered].slice(0, MAX_ITEMS);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Ignore storage quota errors
        }
        return updated;
      });
    },
    []
  );

  const removeHistoryItem = useCallback(
    (videoId: string, downloadedAt: string) => {
      setHistory((prev) => {
        const updated = prev.filter(
          (item) =>
            !(item.videoId === videoId && item.downloadedAt === downloadedAt)
        );
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Ignore storage errors
        }
        return updated;
      });
    },
    []
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  return {
    history,
    isLoaded,
    addHistoryItem,
    removeHistoryItem,
    clearHistory,
  };
}
