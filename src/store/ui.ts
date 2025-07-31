import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  theme: "system" | "light" | "dark";
  concurrency: number;
  loopCap: number;
  similarityThreshold: number;
  classificationThresholds: {
    red: number;
    yellow: number;
  };
  setTheme: (theme: "system" | "light" | "dark") => void;
  setConcurrency: (concurrency: number) => void;
  setLoopCap: (loopCap: number) => void;
  setSimilarityThreshold: (threshold: number) => void;
  setClassificationThresholds: (thresholds: { red: number; yellow: number }) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "system",
      concurrency: 3,
      loopCap: 5,
      similarityThreshold: 0.9,
      classificationThresholds: {
        red: 0.8,
        yellow: 0.6
      },
      setTheme: (theme) => set({ theme }),
      setConcurrency: (concurrency) => set({ concurrency }),
      setLoopCap: (loopCap) => set({ loopCap }),
      setSimilarityThreshold: (similarityThreshold) =>
        set({ similarityThreshold }),
      setClassificationThresholds: (thresholds) => set({ classificationThresholds: thresholds }),
    }),
    {
      name: "ui-storage",
    }
  )
);
