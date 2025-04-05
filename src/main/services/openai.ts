// src/main/services/openai.ts - Final fixed version
import { BrowserWindow, ipcMain } from "electron";
import fetch from "node-fetch";
import { readFileSync, statSync, existsSync } from "fs";
import { extname, basename } from "path";

// OpenAI API configuration
interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

// Generation state
let isGenerating = false;

export const BASE_SYSTEM_PROMPT = `Ты помощник, отвечающий на вопросы.

Если вопрос теоретический, твой ответ должен содержать:
1. Краткий ответ (1-2 предложения)
2. Углубленное объяснение с деталями
3. Примеры, если они уместны
4. Код, если он требуется для иллюстрации

Если вопрос связан с алгоритмами или программированием, твой ответ должен содержать:
1. Логическое объяснение решения
2. Код решения с комментариями
3. Анализ сложности (O-нотация)

Используй форматирование Markdown для лучшей читаемости:
- Используй ## для заголовков разделов
- Используй \`\`\` для блоков кода с указанием языка
- Используй **жирный** для важных концепций
- Используй маркированные списки для перечислений
- Используй > для цитат или выделения важной информации

Отвечай кратко и по существу.`;

// Helper function to handle image processing - use synchronous methods to avoid promise issues
function processImageSync(imagePath) {
  try {
    // Check if file exists
    if (!existsSync(imagePath)) {
      console.error(`File does not exist: ${imagePath}`);
      return null;
    }

    // Check file stats
    const stats = statSync(imagePath);
    console.log(
      `Image file stats: ${JSON.stringify({
        size: stats.size,
        isFile: stats.isFile(),
        path: imagePath,
      })}`
    );

    if (!stats.isFile()) {
      throw new Error(`Not a file: ${imagePath}`);
    }

    if (stats.size === 0) {
      throw new Error(`Empty file: ${imagePath}`);
    }

    // Read file synchronously for simplicity and to avoid promise issues
    const buffer = readFileSync(imagePath);

    console.log(`Read buffer length: ${buffer.length} bytes`);

    // If buffer is empty, throw error
    if (!buffer || buffer.length === 0) {
      throw new Error(`Read buffer is empty for file: ${imagePath}`);
    }

    // Determine MIME type based on extension
    const ext = extname(imagePath).toLowerCase();
    const mimeType =
      ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".gif"
            ? "image/gif"
            : "application/octet-stream";

    console.log(`Using MIME type: ${mimeType} for extension: ${ext}`);

    // Convert to base64 - use direct Buffer method
    const base64 = buffer.toString("base64");

    // Check length of base64 string
    console.log(`Base64 string length: ${base64 ? base64.length : 0} chars`);

    // Verify base64 is not empty
    if (!base64 || base64.length === 0) {
      throw new Error(
        `Base64 conversion produced empty string for file: ${imagePath}`
      );
    }

    // Return in OpenAI's required format
    return {
      type: "image_url",
      image_url: {
        url: `data:${mimeType};base64,${base64}`,
      },
    };
  } catch (error) {
    console.error(`Failed to process image ${imagePath}:`, error);
    return null;
  }
}

// Setup OpenAI service
export function setupOpenAIService(mainWindow: BrowserWindow): void {
  console.log("Setting up OpenAI service...");

  // Handler for generating response with OpenAI API
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

      // Get API key and settings from LLM service
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

        // Combine texts with separator
        const combinedText = texts.join("\n\n");

        // Determine if we use vision model
        const useVision = images && images.length > 0;
        const apiUrl = "https://api.openai.com/v1/chat/completions";

        // Get model settings from configuration
        let model = process.env.OPENAI_MODEL || "gpt-4";
        const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || "2048");
        const temperature = parseFloat(process.env.OPENAI_TEMPERATURE || "0.7");

        // Use vision model if there are images
        if (useVision) {
          // Use gpt-4-turbo which supports vision as of April 2025
          model = "gpt-4-turbo";
        }

        // Create message array for API
        const messages = [];

        // Add system message
        messages.push({
          role: "system",
          content: BASE_SYSTEM_PROMPT,
        });

        // Create user message content
        let userMessageContent;

        // For standard ChatGPT models without vision
        if (!useVision) {
          userMessageContent = combinedText;
        }
        // For vision models
        else {
          userMessageContent = [];

          // Add text
          if (combinedText) {
            userMessageContent.push({
              type: "text",
              text: combinedText,
            });
          }

          // Process each image and add it to the message
          if (images && images.length > 0) {
            console.log(`Processing ${images.length} images`);
            for (const imagePath of images) {
              console.log(`Processing image: ${imagePath}`);
              const imageContent = processImageSync(imagePath);
              if (imageContent) {
                userMessageContent.push(imageContent);
                console.log(
                  `Successfully added image to request: ${basename(imagePath)}`
                );
              } else {
                console.warn(
                  `Skipping image ${imagePath} due to processing error`
                );
              }
            }
          }
        }

        // Add user message
        messages.push({
          role: "user",
          content: userMessageContent,
        });

        // Create request body
        const requestBody = {
          model: model,
          messages: messages,
          max_tokens: maxTokens,
          temperature: temperature,
          stream: streaming,
        };

        // Log the request for debugging (without sensitive data)
        console.log("Sending request to OpenAI API:", {
          model,
          useVision,
          hasImages: images?.length > 0,
          textLength: combinedText?.length || 0,
          imageCount: useVision ? images.length : 0,
          contentType:
            typeof userMessageContent === "string" ? "text" : "mixed",
          messagesLength: messages.length,
        });

        if (streaming) {
          // Stream response
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `OpenAI API error: ${response.status} ${errorText}`
            );
          }

          // Node-fetch doesn't provide the same ReadableStream as browser fetch
          // So we need to process the response as a Node.js stream
          const stream = response.body;
          if (!stream) {
            throw new Error("Response body is empty");
          }

          let result = "";
          const decoder = new TextDecoder();

          // Set up stream processing with proper error handling
          stream.on("data", (chunk) => {
            try {
              const chunkText = decoder.decode(chunk, { stream: true });
              // OpenAI sends each chunk in format "data: {JSON}\n\n"
              const lines = chunkText
                .split("\n")
                .filter((line) => line.trim() && line.startsWith("data:"));

              for (const line of lines) {
                try {
                  // Remove "data: " from the start of the line
                  const jsonString = line.substring(5).trim();

                  // Check for [DONE] signaling the end of the stream
                  if (jsonString === "[DONE]") {
                    continue;
                  }

                  const data = JSON.parse(jsonString);

                  if (
                    data.choices &&
                    data.choices[0] &&
                    data.choices[0].delta &&
                    data.choices[0].delta.content
                  ) {
                    const textChunk = data.choices[0].delta.content;
                    result += textChunk;

                    // Send chunk to renderer
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
          });

          // Handle stream end event
          stream.on("end", () => {
            // Complete generation
            mainWindow.webContents.send("generation-status", {
              status: "completed",
              result,
            });

            isGenerating = false;
          });

          // Handle stream error event
          stream.on("error", (error) => {
            console.error("Stream error:", error);
            mainWindow.webContents.send("generation-status", {
              status: "error",
              error: error.message || "Unknown stream error",
            });
            isGenerating = false;
          });

          // Return early with success status since we're handling results via events
          return { success: true, streaming: true };
        } else {
          // Non-streaming request
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `OpenAI API error: ${response.status} ${errorText}`
            );
          }

          const data = await response.json();

          let result = "";
          if (
            data.choices &&
            data.choices[0] &&
            data.choices[0].message &&
            data.choices[0].message.content
          ) {
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

  // Handler for stopping generation
  ipcMain.handle("stop-openai-generation", () => {
    if (!isGenerating) {
      return { success: true, wasGenerating: false };
    }

    try {
      // OpenAI API doesn't support direct interruption
      // We just set the flag to stop
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

// Get generation state
export function isOpenAIGenerating(): boolean {
  return isGenerating;
}
