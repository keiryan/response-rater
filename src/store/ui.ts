import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  theme: "system" | "light" | "dark";
  concurrency: number;
  loopCap: number;
  similarityThreshold: number;
  setTheme: (theme: "system" | "light" | "dark") => void;
  setConcurrency: (concurrency: number) => void;
  setLoopCap: (loopCap: number) => void;
  setSimilarityThreshold: (threshold: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "system",
      concurrency: 3,
      loopCap: 5,
      similarityThreshold: 0.9,
      setTheme: (theme) => set({ theme }),
      setConcurrency: (concurrency) => set({ concurrency }),
      setLoopCap: (loopCap) => set({ loopCap }),
      setSimilarityThreshold: (similarityThreshold) =>
        set({ similarityThreshold }),
    }),
    {
      name: "ui-storage",
    }
  )
);
