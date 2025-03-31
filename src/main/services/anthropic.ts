// src/main/services/anthropic.ts
import { BrowserWindow, ipcMain } from "electron";
import fetch from "node-fetch";
import { readFileSync } from "fs";
import path from "path";
import { app } from "electron";

// Состояние генерации
let isGenerating = false;

// Настройка сервиса Anthropic
export function setupAnthropicService(mainWindow: BrowserWindow): void {
  console.log("Setting up Anthropic (Claude) service...");

  // Обработчик для генерации ответа с помощью API Anthropic
  ipcMain.handle(
    "generate-anthropic-response",
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

      // Получаем API ключ из переменной среды
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          error: "Anthropic API key not configured",
        };
      }

      try {
        isGenerating = true;
        mainWindow.webContents.send("generation-status", { status: "started" });

        // Объединяем тексты в один с разделителем
        const combinedText = texts.join("\n\n");

        // API URL для Anthropic Claude
        const apiUrl = "https://api.anthropic.com/v1/messages";

        // Получаем настройки модели из конфигурации
        const model = process.env.ANTHROPIC_MODEL || "claude-3-opus-20240229";
        const maxTokens = parseInt(process.env.ANTHROPIC_MAX_TOKENS || "2048");
        const temperature = parseFloat(process.env.ANTHROPIC_TEMPERATURE || "0.7");

        // Создаем массив сообщений для API
        const messages = [];
        
        // Создаем содержимое сообщения пользователя
        let userContent = [];
        
        // Добавляем текст
        if (combinedText) {
          userContent.push({
            type: "text",
            text: combinedText
          });
        }
        
        // Добавляем изображения, если они есть и используется модель с поддержкой изображений
        if (images && images.length > 0) {
          for (const imagePath of images) {
            try {
              const imageBuffer = readFileSync(imagePath);
              const base64Image = imageBuffer.toString("base64");
              const mimeType = imagePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
              
              userContent.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: base64Image
                }
              });
            } catch (imageError) {
              console.error(`Error reading image ${imagePath}:`, imageError);
            }
          }
        }

        // Создаем тело запроса
        const requestBody = {
          model: model,
          messages: [
            {
              role: "user",
              content: userContent
            }
          ],
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
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
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
              // Claude возвращает SSE в формате event: name\ndata: {JSON}\n\n
              const events = chunk.split("\n\n").filter(Boolean);

              for (const event of events) {
                try {
                  const lines = event.split("\n");
                  const dataLine = lines.find(line => line.startsWith("data:"));
                  
                  if (!dataLine) continue;
                  
                  const jsonString = dataLine.substring(5).trim();
                  
                  if (jsonString === "[DONE]") {
                    continue;
                  }

                  const data = JSON.parse(jsonString);

                  if (data.type === "content_block_delta" && data.delta && data.delta.text) {
                    const textChunk = data.delta.text;
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
          // Для Anthropic Claude отключаем стриминг
          requestBody.stream = false;
          
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
          }

          const data = await response.json();

          let result = "";
          if (data.content && data.content.length > 0) {
            // Собираем весь текстовый контент из блоков ответа
            result = data.content
              .filter(block => block.type === "text")
              .map(block => block.text)
              .join("");
          }

          mainWindow.webContents.send("generation-status", {
            status: "completed",
            result,
          });

          isGenerating = false;
          return { success: true, result };
        }
      } catch (error) {
        console.error("Anthropic generation error:", error);

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
  ipcMain.handle("stop-anthropic-generation", () => {
    if (!isGenerating) {
      return { success: true, wasGenerating: false };
    }

    try {
      // Anthropic API не поддерживает остановку запроса напрямую
      // Мы просто устанавливаем флаг состояния
      isGenerating = false;
      mainWindow.webContents.send("generation-status", { status: "stopped" });

      return { success: true, wasGenerating: true };
    } catch (error) {
      console.error("Error stopping Anthropic generation:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  console.log("Anthropic service setup complete");
}

// Получение состояния генерации
export function isAnthropicGenerating(): boolean {
  return isGenerating;
}