// src/renderer/src/hooks/useLLM.ts
import { useState, useEffect, useCallback } from "react";

interface LLMConfig {
  provider: "openai" | "anthropic" | "gemini";
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export function useLLM() {
  const [config, setConfig] = useState<LLMConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelOptions, setModelOptions] = useState<Record<string, string[]>>({
    openai: [],
    anthropic: [],
    gemini: [],
  });

  // Load config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        const config = await window.api.llm.loadConfig();
        setConfig(config);

        // Load model options for all providers
        const openaiModels = await window.api.llm.getModelOptions("openai");
        const anthropicModels = await window.api.llm.getModelOptions("anthropic");
        const geminiModels = await window.api.llm.getModelOptions("gemini");

        setModelOptions({
          openai: openaiModels,
          anthropic: anthropicModels,
          gemini: geminiModels,
        });
      } catch (err) {
        setError(
          `Error loading LLM configuration: ${err instanceof Error ? err.message : String(err)}`
        );
        console.error("Error loading LLM configuration:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Update config
  const updateConfig = useCallback(async (newConfig: Partial<LLMConfig>) => {
    try {
      if (!config) return false;
      
      // If provider changes, load default settings for that provider
      if (newConfig.provider && newConfig.provider !== config.provider) {
        const defaults = await window.api.llm.getProviderDefaults(newConfig.provider);
        
        // Save the complete new config with defaults from the new provider and keep the API key
        const mergedConfig = {
          ...config,
          ...defaults,
          provider: newConfig.provider,
          apiKey: newConfig.apiKey !== undefined ? newConfig.apiKey : config.apiKey,
          ...newConfig,
        };
        
        const result = await window.api.llm.saveConfig(mergedConfig);
        
        if (result.success) {
          setConfig(result.config);
          return true;
        } else {
          throw new Error(result.error || "Failed to update LLM configuration");
        }
      } else {
        // If not changing provider, just update the specified fields
        const updatedConfig = { ...config, ...newConfig };
        const result = await window.api.llm.saveConfig(updatedConfig);
        
        if (result.success) {
          setConfig(result.config);
          return true;
        } else {
          throw new Error(result.error || "Failed to update LLM configuration");
        }
      }
    } catch (err) {
      setError(
        `Error updating LLM configuration: ${err instanceof Error ? err.message : String(err)}`
      );
      console.error("Error updating LLM configuration:", err);
      return false;
    }
  }, [config]);

  // Get available models for a specific provider
  const getModelsForProvider = useCallback((provider: LLMConfig["provider"]) => {
    return modelOptions[provider] || [];
  }, [modelOptions]);

  return {
    config,
    isLoading,
    error,
    updateConfig,
    getModelsForProvider,
  };
}