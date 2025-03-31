// // src/main/services/deepgram-live.ts
// import { BrowserWindow, ipcMain } from "electron";
// import { createClient } from "@deepgram/sdk";
// import {
//   LiveTranscriptionEvents,
//   LiveOptions,
// } from "@deepgram/sdk/dist/types/lib/types";

// // DeepGram Live transcription service state
// let liveTranscriptionActive = false;
// let deepgramApiKey = "";

// // Set up DeepGram Live service
// export function setupDeepgramLiveService(mainWindow: BrowserWindow): void {
//   console.log("Setting up DeepGram Live transcription service...");

//   // Handle starting live transcription
//   ipcMain.handle(
//     "start-live-transcription",
//     async (_, language: string = "en") => {
//       try {
//         if (liveTranscriptionActive) {
//           return {
//             success: true,
//             message: "Live transcription already active",
//           };
//         }

//         // Get API key from environment variable or stored config
//         deepgramApiKey = process.env.DEEPGRAM_API_KEY || "";
//         if (!deepgramApiKey) {
//           console.error("DeepGram API key not found");
//           return {
//             success: false,
//             error:
//               "DeepGram API key not configured. Please add it in settings.",
//           };
//         }

//         // Tell the renderer to start audio capture and streaming
//         liveTranscriptionActive = true;
//         mainWindow.webContents.send("deepgram-live-status", {
//           status: "started",
//           language,
//         });

//         return { success: true };
//       } catch (error) {
//         console.error("Error starting DeepGram Live transcription:", error);
//         return {
//           success: false,
//           error: error instanceof Error ? error.message : "Unknown error",
//         };
//       }
//     }
//   );

//   // Handle stopping live transcription
//   ipcMain.handle("stop-live-transcription", async () => {
//     try {
//       if (!liveTranscriptionActive) {
//         return { success: true, message: "Live transcription not active" };
//       }

//       // Tell the renderer to stop streaming
//       liveTranscriptionActive = false;
//       mainWindow.webContents.send("deepgram-live-status", {
//         status: "stopped",
//       });

//       return { success: true };
//     } catch (error) {
//       console.error("Error stopping DeepGram Live transcription:", error);
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : "Unknown error",
//       };
//     }
//   });

//   // Handle getting DeepGram API Key for renderer process
//   ipcMain.handle("get-deepgram-api-key", () => {
//     return deepgramApiKey || process.env.DEEPGRAM_API_KEY || "";
//   });

//   // Forward transcription results from renderer to any listeners
//   ipcMain.on("deepgram-transcription-result", (_, result) => {
//     if (mainWindow && !mainWindow.isDestroyed()) {
//       mainWindow.webContents.send("transcription-result", result);
//     }
//   });

//   console.log("DeepGram Live service setup complete");
// }

// // Utility function to get the current transcription state
// export function isLiveTranscriptionActive(): boolean {
//   return liveTranscriptionActive;
// }

// src/main/services/deepgram-live.ts
import { BrowserWindow, ipcMain } from "electron";
import { getDeepgramApiKey } from "./deepgram-service";

// DeepGram Live transcription service state
let liveTranscriptionActive = false;

// Set up DeepGram Live service
export function setupDeepgramLiveService(mainWindow: BrowserWindow): void {
  console.log("Setting up DeepGram Live transcription service...");

  // Handle starting live transcription
  ipcMain.handle(
    "start-live-transcription",
    async (_, language: string = "en") => {
      try {
        if (liveTranscriptionActive) {
          return {
            success: true,
            message: "Live transcription already active",
          };
        }

        // Get API key from environment variable or stored config
        const deepgramApiKey = getDeepgramApiKey();
        if (!deepgramApiKey) {
          console.error("DeepGram API key not found");
          return {
            success: false,
            error:
              "DeepGram API key not configured. Please add it in settings.",
          };
        }

        // Tell the renderer to start audio capture and streaming
        liveTranscriptionActive = true;
        mainWindow.webContents.send("deepgram-live-status", {
          status: "started",
          language,
        });

        console.log(
          `DeepGram Live transcription started with language: ${language}`
        );

        return { success: true };
      } catch (error) {
        console.error("Error starting DeepGram Live transcription:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  // Handle stopping live transcription
  ipcMain.handle("stop-live-transcription", async () => {
    try {
      if (!liveTranscriptionActive) {
        return { success: true, message: "Live transcription not active" };
      }

      // Tell the renderer to stop streaming
      liveTranscriptionActive = false;
      mainWindow.webContents.send("deepgram-live-status", {
        status: "stopped",
      });

      console.log("DeepGram Live transcription stopped");

      return { success: true };
    } catch (error) {
      console.error("Error stopping DeepGram Live transcription:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Handle getting DeepGram API Key for renderer process
  ipcMain.handle("get-deepgram-api-key", () => {
    const apiKey = getDeepgramApiKey();
    console.log(
      `Providing DeepGram API key to renderer: ${apiKey ? "Key exists" : "Key missing"}`
    );
    return apiKey;
  });

  // Forward transcription results from renderer to any listeners
  ipcMain.on("deepgram-transcription-result", (_, result) => {
    console.log(
      `Received transcription result from renderer: "${result.text}"`
    );
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("transcription-result", result);
    }
  });

  console.log("DeepGram Live service setup complete");
}

// Utility function to get the current transcription state
export function isLiveTranscriptionActive(): boolean {
  return liveTranscriptionActive;
}
