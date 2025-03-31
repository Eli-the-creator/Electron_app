// src/main/services/openai.ts
import { BrowserWindow, ipcMain } from "electron";
import fetch from "node-fetch";
import { readFileSync } from "fs";
import path from "path";
import { app } from "electron";
import FormData from "form-data";

// Конфигурация OpenAI API
interface OpenAIConfig {
  apiKey: string; 
  model: string;
  maxTokens: number;
  temperature: number;
}

// Состояние генерации
let isGenerating = false;

// Настройка сервиса OpenAI
export function setupOpenAIService(mainWindow: BrowserWindow): void {
  console.log("Setting up OpenAI service...");

  // Обработчик для генерации ответа с помощью API OpenAI
  ipcMain.handle(
    "generate-openai-response",
    async (
      _,
      {
        texts,
        images,
        streaming = true,
      }: {
        texts: string[];
        images: string[];
        streaming?: boolean;
      }
    ) => {
      if (isGenerating) {
        return {
          success: false,
          error: "Generation already in progress",
        };
      }

      // Получаем API ключ и настройки из LLM сервиса
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          error: "OpenAI API key not configured",
        };
      }

      try {
        isGenerating = true;
        mainWindow.webContents.send("generation-status", { status: "started" });

        // Объединяем тексты в один с разделителем
        const combinedText = texts.join("\n\n");

        // Определяем, используем ли мы vision модель
        const useVision = images && images.length > 0;
        const apiUrl = useVision 
          ? "https://api.openai.com/v1/chat/completions"
          : "https://api.openai.com/v1/chat/completions";

        // Получаем настройки модели из конфигурации
        let model = process.env.OPENAI_MODEL || "gpt-4";
        const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || "2048");
        const temperature = parseFloat(process.env.OPENAI_TEMPERATURE || "0.7");

        // Если есть изображения, используем модель с поддержкой vision
        if (useVision && !model.includes("vision")) {
          model = "gpt-4-vision-preview";
        }

        // Создаем массив сообщений для API
        const messages = [];
        
        // Добавляем системное сообщение
        messages.push({
          role: "system",
          content: "You are a helpful voice assistant. Respond concisely and clearly."
        });

        // Создаем содержимое сообщения пользователя
        const userMessageContent = [];
        
        // Добавляем текст
        if (combinedText) {
          userMessageContent.push({
            type: "text",
            text: combinedText
          });
        }
        
        // Добавляем изображения, если они есть
        if (useVision && images && images.length > 0) {
          for (const imagePath of images) {
            try {
              const imageBuffer = readFileSync(imagePath);
              const base64Image = imageBuffer.toString("base64");
              
              userMessageContent.push({
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              });
            } catch (imageError) {
              console.error(`Error reading image ${imagePath}:`, imageError);
            }
          }
        }
        
        // Добавляем сообщение пользователя
        messages.push({
          role: "user",
          content: userMessageContent
        });

        // Создаем тело запроса
        const requestBody = {
          model: model,
          messages: messages,
          max_tokens: maxTokens,
          temperature: temperature,
          stream: streaming
        };

        if (streaming) {
          // Стриминг ответа
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
          }

          if (!response.body) {
            throw new Error("Response body is empty");
          }

          // Создаем reader для обработки потока
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let result = "";

          // Чтение и обработка потока
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            // Декодируем и парсим чанк ответа
            const chunk = decoder.decode(value, { stream: true });
            try {
              // OpenAI возвращает каждый чанк в формате "data: {JSON}\n\n"
              const lines = chunk.split("\n").filter(line => line.trim() && line.startsWith("data:"));

              for (const line of lines) {
                try {
                  // Удаляем "data: " из начала строки
                  const jsonString = line.substring(5).trim();
                  
                  // Проверяем, не получили ли мы [DONE]
                  if (jsonString === "[DONE]") {
                    continue;
                  }

                  const data = JSON.parse(jsonString);

                  if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                    const textChunk = data.choices[0].delta.content;
                    result += textChunk;

                    // Отправляем чанк в рендерер
                    mainWindow.webContents.send("generation-chunk", {
                      chunk: textChunk,
                    });
                  }
                } catch (parseError) {
                  console.error("Error parsing JSON in stream:", parseError);
                }
              }
            } catch (chunkError) {
              console.error("Error processing chunk:", chunkError);
            }
          }

          // Завершаем генерацию
          mainWindow.webContents.send("generation-status", {
            status: "completed",
            result,
          });

          isGenerating = false;
          return { success: true, result };
        } else {
          // Обычный запрос (не стриминг)
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
          }

          const data = await response.json();

          let result = "";
          if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            result = data.choices[0].message.content;
          }

          mainWindow.webContents.send("generation-status", {
            status: "completed",
            result,
          });

          isGenerating = false;
          return { success: true, result };
        }
      } catch (error) {
        console.error("OpenAI generation error:", error);

        mainWindow.webContents.send("generation-status", {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });

        isGenerating = false;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  // Прерывание текущей генерации
  ipcMain.handle("stop-openai-generation", () => {
    if (!isGenerating) {
      return { success: true, wasGenerating: false };
    }

    try {
      // OpenAI API не поддерживает остановку запроса напрямую
      // Мы просто устанавливаем флаг состояния
      isGenerating = false;
      mainWindow.webContents.send("generation-status", { status: "stopped" });

      return { success: true, wasGenerating: true };
    } catch (error) {
      console.error("Error stopping OpenAI generation:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  console.log("OpenAI service setup complete");
}

// Получение состояния генерации
export function isOpenAIGenerating(): boolean {
  return isGenerating;
}