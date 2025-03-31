// src/renderer/src/components/LLMConfig.tsx
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Save, MessageSquare } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "./ui/select";
import { useLLM } from "../hooks/useLLM";

interface LLMConfigProps {
  className?: string;
}

const LLMConfig: React.FC<LLMConfigProps> = ({ className }) => {
  const { config, isLoading, error, updateConfig, getModelsForProvider } = useLLM();
  
  const [provider, setProvider] = useState<string>("gemini");
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [modelOptions, setModelOptions] = useState<string[]>([]);

  // Update local state when config loads
  useEffect(() => {
    if (config) {
      setProvider(config.provider);
      setApiKey(config.apiKey || "");
      setModel(config.model || "");
      setMaxTokens(config.maxTokens || 2048);
      setTemperature(config.temperature || 0.7);

      // Update model options based on provider
      setModelOptions(getModelsForProvider(config.provider));
    }
  }, [config, getModelsForProvider]);

  // Update model options when provider changes
  useEffect(() => {
    if (provider) {
      const options = getModelsForProvider(provider as any);
      setModelOptions(options);
      
      // If current model doesn't exist in new provider options, set to first option
      if (!options.includes(model) && options.length > 0) {
        setModel(options[0]);
      }
    }
  }, [provider, getModelsForProvider, model]);

  const handleSave = async () => {
    setIsSaving(true);
    setSavedMessage(null);

    try {
      const success = await updateConfig({
        provider: provider as any,
        apiKey,
        model,
        maxTokens,
        temperature,
      });

      if (success) {
        setSavedMessage("LLM configuration saved successfully");
      } else {
        throw new Error("Failed to save configuration");
      }

      // Clear message after 3 seconds
      setTimeout(() => setSavedMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save LLM configuration:", error);
      setSavedMessage("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Language Model Configuration
        </CardTitle>
        <CardDescription>
          Configure which AI model to use for text generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="llm-provider">Provider</Label>
          <Select 
            value={provider} 
            onValueChange={(value) => setProvider(value)}
          >
            <SelectTrigger id="llm-provider">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
              <SelectItem value="gemini">Google (Gemini)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="llm-api-key">API Key</Label>
          <Input
            id="llm-api-key"
            type="password"
            placeholder={`Enter your ${provider === 'anthropic' ? 'Anthropic' : provider === 'openai' ? 'OpenAI' : 'Gemini'} API key`}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {provider === 'openai' && (
              <>Get your API key from the <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">OpenAI dashboard</a></>
            )}
            {provider === 'anthropic' && (
              <>Get your API key from the <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Anthropic console</a></>
            )}
            {provider === 'gemini' && (
              <>Get your API key from the <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google AI Studio</a></>
            )}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="llm-model">Model</Label>
          <Select 
            value={model} 
            onValueChange={(value) => setModel(value)}
            disabled={modelOptions.length === 0}
          >
            <SelectTrigger id="llm-model">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {modelOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {modelOptions.length === 0 && (
            <p className="text-xs text-amber-500">
              No models available for selected provider
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="max-tokens">
              Maximum tokens: {maxTokens}
            </Label>
          </div>
          <Slider
            id="max-tokens"
            min={256}
            max={4096}
            step={256}
            value={[maxTokens]}
            onValueChange={(values) => setMaxTokens(values[0])}
          />
          <p className="text-xs text-muted-foreground">
            Maximum length of generated response
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="temperature">
              Temperature: {temperature.toFixed(1)}
            </Label>
          </div>
          <Slider
            id="temperature"
            min={0}
            max={1}
            step={0.1}
            value={[temperature]}
            onValueChange={(values) => setTemperature(values[0])}
          />
          <p className="text-xs text-muted-foreground">
            Affects response randomness: lower - more predictable, higher
            - more creative
          </p>
        </div>

        {savedMessage && (
          <div
            className={`text-sm ${savedMessage.includes("Failed") ? "text-destructive" : "text-green-500"}`}>
            {savedMessage}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving || !apiKey.trim()}>
          <Save size={14} className="mr-1" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LLMConfig;