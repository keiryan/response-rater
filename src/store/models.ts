import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ModelSettings, ProviderName } from "@/lib/types";

interface ModelsState {
  models: ModelSettings[];
  addModel: (model: ModelSettings) => void;
  updateModel: (id: string, updates: Partial<ModelSettings>) => void;
  deleteModel: (id: string) => void;
  toggleModel: (id: string) => void;
  getEnabledModels: () => ModelSettings[];
  getModelsByProvider: (provider: ProviderName) => ModelSettings[];
}

const seedModels: ModelSettings[] = [
  // OpenAI models
  {
    id: "gpt-4o-mini",
    label: "GPT-4o Mini",
    provider: "openai",
    temperature: 0.7,
    enabled: false,
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    temperature: 0.7,
    enabled: false,
  },

  // Anthropic models
  {
    id: "claude-3-5-sonnet-20241022",
    label: "Claude 3.5 Sonnet",
    provider: "anthropic",
    temperature: 0.7,
    enabled: false,
  },
  {
    id: "claude-3-haiku-20240307",
    label: "Claude 3 Haiku",
    provider: "anthropic",
    temperature: 0.7,
    enabled: false,
  },

  // DeepSeek models
  {
    id: "deepseek-chat",
    label: "DeepSeek Chat",
    provider: "deepseek",
    temperature: 0.7,
    enabled: false,
  },
  {
    id: "deepseek-coder",
    label: "DeepSeek Coder",
    provider: "deepseek",
    temperature: 0.7,
    enabled: false,
  },
];

export const useModelsStore = create<ModelsState>()(
  persist(
    (set, get) => ({
      models: seedModels,
      addModel: (model) =>
        set((state) => ({
          models: [...state.models, model],
        })),
      updateModel: (id, updates) =>
        set((state) => ({
          models: state.models.map((model) =>
            model.id === id ? { ...model, ...updates } : model
          ),
        })),
      deleteModel: (id) =>
        set((state) => ({
          models: state.models.filter((model) => model.id !== id),
        })),
      toggleModel: (id) =>
        set((state) => ({
          models: state.models.map((model) =>
            model.id === id ? { ...model, enabled: !model.enabled } : model
          ),
        })),
      getEnabledModels: () => get().models.filter((model) => model.enabled),
      getModelsByProvider: (provider) =>
        get().models.filter((model) => model.provider === provider),
    }),
    {
      name: "models-storage",
    }
  )
);
