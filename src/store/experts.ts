import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ExpertResponse, ResponseClassification } from "@/lib/types";

interface ExpertsState {
  expertResponses: ExpertResponse[];
  classifications: Record<string, ResponseClassification>;
  setExpertResponses: (responses: ExpertResponse[]) => void;
  addExpertResponse: (response: ExpertResponse) => void;
  setClassification: (responseId: string, classification: ResponseClassification) => void;
  clearExpertResponses: () => void;
}

export const useExpertsStore = create<ExpertsState>()(
  persist(
    (set) => ({
      expertResponses: [],
      classifications: {},
      setExpertResponses: (responses) => set({ expertResponses: responses }),
      addExpertResponse: (response) =>
        set((state) => ({
          expertResponses: [...state.expertResponses, response]
        })),
      setClassification: (responseId, classification) =>
        set((state) => ({
          classifications: {
            ...state.classifications,
            [responseId]: classification
          }
        })),
      clearExpertResponses: () => set({ expertResponses: [], classifications: {} }),
    }),
    {
      name: "experts-storage",
    }
  )
);
