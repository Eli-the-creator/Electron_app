// src/renderer/src/components/SettingsPanel.tsx
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import DeepGramConfig from "./DeepGramConfig";
import LLMConfig from "./LLMConfig";
import AudioSettings from "./AudioSettings";

export const SettingsPanel: React.FC = () => {
  // Состояние для настроек API
  const [apiKey, setApiKey] = useState<string>("");
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [temperature, setTemperature] = useState<number>(0.7);

  // Загрузка сохраненных настроек при монтировании компонента
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Загружаем настройки API Gemini
        const geminiConfig = await window.api.gemini.loadConfig();
        if (geminiConfig) {
          setApiKey(geminiConfig.apiKey || "");
          setMaxTokens(geminiConfig.maxTokens || 2048);
          setTemperature(geminiConfig.temperature || 0.7);
        }
      } catch (error) {
        console.error("Ошибка при загрузке настроек:", error);
      }
    };

    loadSettings();
  }, []);

  // Сохранение настроек API
  const saveApiSettings = async () => {
    try {
      await window.api.gemini.saveConfig({
        apiKey,
        maxTokens,
        temperature,
      });
    } catch (error) {
      console.error("Ошибка при сохранении настроек API:", error);
    }
  };

  return (
    <div className="p-2 h-full overflow-y-auto">
      <Tabs defaultValue="audio" className="w-full">
        <TabsList className="grid w-full grid-cols-3 gap-2">
          <TabsTrigger className="border rounded-lg " value="audio">
            Audio
          </TabsTrigger>
          <TabsTrigger className="border rounded-lg " value="llm">
            LLM
          </TabsTrigger>
          {/* <TabsTrigger className="border rounded-lg " value="deepgram">
            DeepGram
          </TabsTrigger> */}
        </TabsList>

        {/* LLM Settings Tab */}
        <TabsContent value="llm" className="mt-4">
          <LLMConfig />
        </TabsContent>

        {/* Настройки аудио */}
        <TabsContent value="audio" className="mt-4">
          <AudioSettings />
        </TabsContent>

        {/* DeepGram Settings Tab */}
        <TabsContent value="deepgram" className="mt-4">
          <DeepGramConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};
