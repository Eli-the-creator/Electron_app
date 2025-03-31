// src/main/services/llm-service.ts
import { BrowserWindow, ipcMain } from "electron";
import { app } from "electron";
import fs from "fs";
import path from "path";

// Define interface for configuration
export interface LLMConfig {
  provider: "openai" | "anthropic" | "gemini";
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

// Default configuration for each provider
const defaultConfigs: Record<LLMConfig["provider"], Omit<LLMConfig, "provider" | "apiKey">> = {
  openai: {
    model: "gpt-4",
    maxTokens: 2048,
    temperature: 0.7,
  },
  anthropic: {
    model: "claude-3-opus-20240229",
    maxTokens: 2048,
    temperature: 0.7,
  },
  gemini: {
    model: "gemini-pro",
    maxTokens: 2048,
    temperature: 0.7,
  },
};

// Provider model options
export const modelOptions = {
  openai: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"],
  anthropic: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
  gemini: ["gemini-pro", "gemini-pro-vision"],
};

// Path to store the config
const getConfigPath = () => {
  return path.join(app.getPath("userData"), "llm-config.json");
};

// Save config to file
const saveConfigToFile = (config: LLMConfig) => {
  try {
    fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving LLM config to file:", error);
    return false;
  }
};

// Load config from file
const loadConfigFromFile = (): LLMConfig | null => {
  try {
    if (fs.existsSync(getConfigPath())) {
      const data = fs.readFileSync(getConfigPath(), "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading LLM config from file:", error);
  }
  return null;
};

// Set up LLM service
export function setupLLMService(mainWindow: BrowserWindow): void {
  console.log("Setting up LLM service...");

  // Handle loading config
  ipcMain.handle("load-llm-config", async () => {
    try {
      const config = loadConfigFromFile();
      if (!config) {
        // Return default config if no config is found
        return {
          provider: "gemini", // Default provider
          apiKey: "",
          ...defaultConfigs.gemini,
        };
      }
      return config;
    } catch (error) {
      console.error("Error loading LLM config:", error);
      return {
        provider: "gemini",
        apiKey: "",
        ...defaultConfigs.gemini,
      };
    }
  });

  // Handle saving config
  ipcMain.handle("save-llm-config", async (_, config: LLMConfig) => {
    try {
      const success = saveConfigToFile(config);
      if (success) {
        // Make the API key available to the appropriate service
        if (config.provider === "gemini") {
          process.env.GEMINI_API_KEY = config.apiKey;
        } else if (config.provider === "openai") {
          process.env.OPENAI_API_KEY = config.apiKey;
        } else if (config.provider === "anthropic") {
          process.env.ANTHROPIC_API_KEY = config.apiKey;
        }

        return { success: true, config };
      } else {
        return {
          success: false,
          error: "Failed to save LLM configuration",
        };
      }
    } catch (error) {
      console.error("Error saving LLM config:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Handle getting default config for a provider
  ipcMain.handle("get-llm-provider-defaults", async (_, provider: LLMConfig["provider"]) => {
    return defaultConfigs[provider] || defaultConfigs.gemini;
  });

  // Handle getting model options for a provider
  ipcMain.handle("get-llm-model-options", async (_, provider: LLMConfig["provider"]) => {
    return modelOptions[provider] || [];
  });

  // Load initial config
  const initialConfig = loadConfigFromFile();
  if (initialConfig) {
    // Set environment variable based on provider
    if (initialConfig.provider === "gemini") {
      process.env.GEMINI_API_KEY = initialConfig.apiKey;
    } else if (initialConfig.provider === "openai") {
      process.env.OPENAI_API_KEY = initialConfig.apiKey;
    } else if (initialConfig.provider === "anthropic") {
      process.env.ANTHROPIC_API_KEY = initialConfig.apiKey;
    }
    console.log(`LLM API key loaded from config for provider: ${initialConfig.provider}`);
  }

  console.log("LLM service setup complete");
}

// Export utility function to get API key for the current provider
export function getCurrentLLMConfig(): LLMConfig | null {
  return loadConfigFromFile();
}