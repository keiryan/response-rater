import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Run, ResponseRecord } from "@/lib/types";

interface RunsState {
  currentRun: Run | null;
  history: Run[];
  setCurrentRun: (run: Run | null) => void;
  updateResponse: (
    responseId: string,
    updates: Partial<ResponseRecord>
  ) => void;
  addResponse: (response: ResponseRecord) => void;
  addToHistory: (run: Run) => void;
  clearHistory: () => void;
}

export const useRunsStore = create<RunsState>()(
  persist(
    (set) => ({
      currentRun: null,
      history: [],
      setCurrentRun: (run) => set({ currentRun: run }),
      updateResponse: (responseId, updates) =>
        set((state) => {
          if (!state.currentRun) return state;
          return {
            currentRun: {
              ...state.currentRun,
              responses: state.currentRun.responses.map((response) =>
                response.id === responseId
                  ? { ...response, ...updates }
                  : response
              ),
            },
          };
        }),
      addResponse: (response) =>
        set((state) => {
          if (!state.currentRun) return state;
          return {
            currentRun: {
              ...state.currentRun,
              responses: [...state.currentRun.responses, response],
            },
          };
        }),
      addToHistory: (run) =>
        set((state) => ({
          history: [run, ...state.history.slice(0, 49)], // Keep last 50 runs
        })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "runs-storage",
    }
  )
);
