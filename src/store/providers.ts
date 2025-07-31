import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ProviderSettings, ProviderName } from "@/lib/types";

interface ProvidersState {
  providers: Record<ProviderName, ProviderSettings>;
  setProviderSettings: (
    provider: ProviderName,
    settings: Partial<ProviderSettings>
  ) => void;
  getProviderSettings: (provider: ProviderName) => ProviderSettings;
}

const defaultProviderSettings: ProviderSettings = {
  apiKey: "",
  transport: "direct",
};

export const useProvidersStore = create<ProvidersState>()(
  persist(
    (set, get) => ({
      providers: {
        openai: { ...defaultProviderSettings },
        anthropic: { ...defaultProviderSettings },
        deepseek: { ...defaultProviderSettings },
        openai_compatible: { ...defaultProviderSettings },
      },
      setProviderSettings: (provider, settings) =>
        set((state) => ({
          providers: {
            ...state.providers,
            [provider]: { ...state.providers[provider], ...settings },
          },
        })),
      getProviderSettings: (provider) => get().providers[provider],
    }),
    {
      name: "providers-storage",
    }
  )
);
