// src/renderer/src/hooks/useLLMGeneration.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useLLM } from "./useLLM";

export function useLLMGeneration() {
  const { config } = useLLM();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState<string>("");
  const [streamingChunks, setStreamingChunks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Ref для хранения полного ответа во время стриминга
  const responseRef = useRef<string>("");
  
  // Слушаем события от основного процесса
  useEffect(() => {
    const removeGenerationChunkListener = window.api.gemini.onGenerationChunk(
      ({ chunk }) => {
        setStreamingChunks((prev) => [...prev, chunk]);
        responseRef.current += chunk;
      }
    );

    const removeGenerationStatusListener = window.api.gemini.onGenerationStatus(
      (status) => {
        if (status.status === "completed") {
          setIsGenerating(false);
          if (status.result) {
            setGeneratedResponse(status.result);
          } else {
            setGeneratedResponse(responseRef.current);
          }
        } else if (status.status === "started") {
          setIsGenerating(true);
          setStreamingChunks([]);
          responseRef.current = "";
        } else if (status.status === "error") {
          setIsGenerating(false);
          setError(status.error || "An error occurred during generation");
        } else if (status.status === "stopped") {
          setIsGenerating(false);
        }
      }
    );

    return () => {
      // Отписываемся от событий при размонтировании
      removeGenerationChunkListener();
      removeGenerationStatusListener();
    };
  }, []);

  // Функция для генерации ответа через выбранный LLM провайдер
  const generateResponse = useCallback(
    async ({
      texts,
      images,
      streaming = true,
    }: {
      texts: string[];
      images: string[];
      streaming?: boolean;
    }) => {
      try {
        if (isGenerating) {
          throw new Error("Generation already in progress");
        }

        setIsGenerating(true);
        setError(null);
        setStreamingChunks([]);
        responseRef.current = "";

        // Если нет конфигурации, используем Gemini по умолчанию
        const provider = config?.provider || "gemini";

        let result;

        switch (provider) {
          case "openai":
            result = await window.api.openai.generateResponse({
              texts,
              images,
              streaming,
            });
            break;
          case "anthropic":
            result = await window.api.anthropic.generateResponse({
              texts,
              images,
              streaming,
            });
            break;
          case "gemini":
          default:
            // Используем существующий Gemini API
            result = await window.api.gemini.generateResponse({
              texts,
              images,
              streaming,
            });
            break;
        }

        if (!result.success) {
          throw new Error(result.error || "Failed to generate response");
        }

        // Если не используется стриминг, сразу устанавливаем результат
        if (!streaming && result.result) {
          setGeneratedResponse(result.result);
        }

        return result.result;
      } catch (err) {
        setIsGenerating(false);
        const errorMessage = `Error generating response: ${
          err instanceof Error ? err.message : String(err)
        }`;
        setError(errorMessage);
        console.error("Error generating response:", err);
        return null;
      }
    },
    [isGenerating, config]
  );

  // Функция для остановки генерации
  const stopGeneration = useCallback(async () => {
    try {
      if (!isGenerating) {
        return true;
      }

      // Если нет конфигурации, используем Gemini по умолчанию
      const provider = config?.provider || "gemini";

      let result;

      switch (provider) {
        case "openai":
          result = await window.api.openai.stopGeneration();
          break;
        case "anthropic":
          result = await window.api.anthropic.stopGeneration();
          break;
        case "gemini":
        default:
          result = await window.api.gemini.stopGeneration();
          break;
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to stop generation");
      }

      return true;
    } catch (err) {
      setError(
        `Error stopping generation: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      console.error("Error stopping generation:", err);
      return false;
    }
  }, [isGenerating, config]);

  return {
    isGenerating,
    generatedResponse,
    streamingChunks,
    error,
    generateResponse,
    stopGeneration,
  };
}