// // import { BrowserWindow, ipcMain } from "electron";
// // import { join } from "path";
// // import { writeFileSync, existsSync, mkdirSync, readFileSync } from "fs";
// // import { app } from "electron";
// // import path from "path";
// // import fs from "fs";
// // import { createClient } from "@deepgram/sdk";
// // // import { loadConfigFromFile } from "./deepgram-service";
// // import { getAudioCaptureSettings } from "./audio-capture";

// // // Определяем интерфейс для результатов транскрипции
// // interface TranscriptionResult {
// //   text: string;
// //   timestamp: number;
// //   language: string;
// // }

// // // Временный буфер для хранения аудио данных
// // let audioBuffer: { data: Buffer; timestamp: number }[] = [];
// // let lastTranscription: TranscriptionResult | null = null;
// // const BUFFER_DURATION_MS = 5000; // 5 секунд буфера аудио

// // // Инициализируем клиент DeepGram
// // let deepgramClient: Deepgram | null = null;

// // // Функция для логирования с префиксом [DeepGram]
// // function logDeepgram(message: string, ...args: any[]) {
// //   console.log(`[DeepGram] ${message}`, ...args);
// // }

// // // Инициализация клиента DeepGram
// // function initializeDeepgramClient() {
// //   try {
// //     // const config = loadConfigFromFile();
// //     const apiKey = process.env.DEEPGRAM_API_KEY || "";

// //     if (!apiKey) {
// //       logDeepgram(
// //         "No DeepGram API key provided. Please configure it in the settings."
// //       );
// //       return null;
// //     }

// //     deepgramClient = createClient(apiKey);
// //     logDeepgram("DeepGram client initialized successfully");
// //     return deepgramClient;
// //   } catch (error) {
// //     logDeepgram("Failed to initialize DeepGram client:", error);
// //     return null;
// //   }
// // }

// // // Create a dummy transcription for debugging or when DeepGram API is not available
// // // function createDummyTranscription(
// // //   language: "ru" | "en" | "pl"
// // // ): TranscriptionResult {
// // //   const now = Date.now();

// // //   // Generate a dummy message based on the buffer size to make debugging easier
// // //   const bufferSize = audioBuffer.length;
// // //   const totalBytes = audioBuffer.reduce(
// // //     (acc, item) => acc + item.data.length,
// // //     0
// // //   );

// // //   const text =
// // //     bufferSize > 0
// // //       ? `Audio recording received (${bufferSize} fragments, ${totalBytes} bytes). DeepGram API not configured.`
// // //       : `Audio recording is empty. Check microphone settings. DeepGram API not configured.`;

// // //   return {
// // //     text,
// // //     timestamp: now,
// // //     language,
// // //   };
// // // }

// // // async function transcribeAudioWithDeepgram(
// // //   audioPath: string,
// // //   language: "ru" | "en" | "pl" = "en"
// // // ): Promise<TranscriptionResult | null> {
// // //   try {
// // //     logDeepgram(
// // //       `Transcribing audio with DeepGram: ${audioPath} (language: ${language})`
// // //     );

// // //     // Загрузим конфигурацию
// // //     // const config = loadConfigFromFile();
// // //     const apiKey = process.env.DEEPGRAM_API_KEY || "";

// // //     if (!apiKey) {
// // //       logDeepgram(
// // //         "No DeepGram API key found, please configure it in settings."
// // //       );
// // //       return createDummyTranscription(language);
// // //     }

// // //     // Создаем клиент DeepGram
// // //     const deepgram = createClient(apiKey);

// // //     // Читаем аудио файл
// // //     const audioFile = fs.readFileSync(audioPath);

// // //     // Отправляем запрос, используя метод из вашего рабочего примера
// // //     const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
// // //       audioFile,
// // //       {
// // //         model: "nova-2",
// // //         language: language, // использование выбранного языка
// // //         smart_format: true,
// // //         punctuate: true,
// // //       }
// // //     );

// // //     // Проверяем на ошибки
// // //     if (error) {
// // //       logDeepgram(`DeepGram API error: ${error}`);
// // //       return createDummyTranscription(language);
// // //     }

// // //     // Извлекаем транскрипцию из результата
// // //     const transcript =
// // //       result?.results?.channels[0]?.alternatives[0]?.transcript;

// // //     if (!transcript) {
// // //       logDeepgram("No transcription available in DeepGram response");
// // //       return createDummyTranscription(language);
// // //     }

// // //     logDeepgram(`Transcription result: "${transcript}"`);

// // //     // Создаем и возвращаем результат транскрипции
// // //     const transcriptionResult: TranscriptionResult = {
// // //       text: transcript,
// // //       timestamp: Date.now(),
// // //       language,
// // //     };

// // //     lastTranscription = transcriptionResult;
// // //     return transcriptionResult;
// // //   } catch (error) {
// // //     logDeepgram(`Error in transcribeAudioWithDeepgram: ${error}`);
// // //     return createDummyTranscription(language);
// // //   }
// // // }

// // async function transcribeAudioWithDeepgram(
// //   audioPath: string,
// //   language: string = "en"
// // ): Promise<TranscriptionResult | null> {
// //   try {
// //     logDeepgram(
// //       `Transcribing audio with DeepGram: ${audioPath} (language: ${language})`
// //     );

// //     // Загрузим конфигурацию
// //     const apiKey =
// //       process.env.DEEPGRAM_API_KEY ||
// //       "d0b70c87fd1a89db7417aa434dc4c378835bc033";

// //     if (!apiKey) {
// //       logDeepgram(
// //         "No DeepGram API key found, please configure it in settings."
// //       );
// //       return createDummyTranscription(language);
// //     }

// //     // Создаем клиент DeepGram
// //     const deepgram = createClient(apiKey);

// //     // Читаем аудио файл
// //     const audioFile = fs.readFileSync(audioPath);

// //     // Отправляем запрос, используя метод из вашего рабочего примера
// //     const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
// //       audioFile,
// //       {
// //         model: "nova-2",
// //         language: language, // использование выбранного языка
// //         smart_format: true,
// //         punctuate: true,
// //       }
// //     );

// //     // Проверяем на ошибки
// //     if (error) {
// //       logDeepgram(`DeepGram API error: ${error}`);
// //       return createDummyTranscription(language);
// //     }

// //     // Извлекаем транскрипцию из результата
// //     const transcript =
// //       result?.results?.channels[0]?.alternatives[0]?.transcript;

// //     if (!transcript) {
// //       logDeepgram("No transcription available in DeepGram response");
// //       return createDummyTranscription(language);
// //     }

// //     logDeepgram(`Transcription result: "${transcript}"`);

// //     // Создаем и возвращаем результат транскрипции
// //     const transcriptionResult: TranscriptionResult = {
// //       text: transcript,
// //       timestamp: Date.now(),
// //       language,
// //     };

// //     lastTranscription = transcriptionResult;
// //     return transcriptionResult;
// //   } catch (error) {
// //     logDeepgram(`Error in transcribeAudioWithDeepgram: ${error}`);
// //     return createDummyTranscription(language);
// //   }
// // }

// // // А также в функции createDummyTranscription:
// // function createDummyTranscription(language: string): TranscriptionResult {
// //   const now = Date.now();

// //   // Generate a dummy message based on the buffer size to make debugging easier
// //   const bufferSize = audioBuffer.length;
// //   const totalBytes = audioBuffer.reduce(
// //     (acc, item) => acc + item.data.length,
// //     0
// //   );

// //   const text =
// //     bufferSize > 0
// //       ? `Audio recording received (${bufferSize} fragments, ${totalBytes} bytes). DeepGram API not configured.`
// //       : `Audio recording is empty. Check microphone settings. DeepGram API not configured.`;

// //   return {
// //     text,
// //     timestamp: now,
// //     language,
// //   };
// // }

// // // Add audio data to buffer with improved handling and logging
// // function addToAudioBuffer(audioData: Buffer) {
// //   const now = Date.now();

// //   // Log more detailed information about the incoming audio data
// //   console.log(
// //     `[DeepGram] Adding audio data to buffer: ${audioData.length} bytes`
// //   );

// //   // Check if the audioData is valid before adding to buffer
// //   if (!audioData || audioData.length === 0) {
// //     console.warn("[DeepGram] Received empty audio data, ignoring");
// //     return;
// //   }

// //   // Add the new data to buffer
// //   audioBuffer.push({ data: audioData, timestamp: now });

// //   // Clean up old data
// //   const cutoffTime = now - BUFFER_DURATION_MS;
// //   const oldLength = audioBuffer.length;
// //   audioBuffer = audioBuffer.filter((item) => item.timestamp >= cutoffTime);

// //   // Log detailed buffer stats periodically or when significant changes occur
// //   const totalBytes = audioBuffer.reduce(
// //     (acc, item) => acc + item.data.length,
// //     0
// //   );

// //   console.log(
// //     `[DeepGram] Audio buffer updated: ${audioBuffer.length} chunks (${totalBytes} bytes), removed ${oldLength - audioBuffer.length} old chunks`
// //   );
// // }

// // // Function to clear the audio buffer with better logging
// // function clearAudioBuffer() {
// //   console.log("[DeepGram] Clearing audio buffer completely");
// //   const oldLength = audioBuffer.length;

// //   if (oldLength > 0) {
// //     const totalBytes = audioBuffer.reduce(
// //       (acc, item) => acc + item.data.length,
// //       0
// //     );
// //     console.log(
// //       `[DeepGram] Discarding ${oldLength} chunks (${totalBytes} bytes)`
// //     );
// //   }

// //   audioBuffer = [];
// //   console.log("[DeepGram] Audio buffer cleared");
// // }

// // // Get the last transcription
// // function getLastTranscription(): TranscriptionResult | null {
// //   return lastTranscription;
// // }

// // // Set up Whisper service
// // export function setupWhisperService(mainWindow: BrowserWindow): void {
// //   logDeepgram("Setting up DeepGram transcription service");

// //   // Создаем директорию для временных аудио файлов
// //   const tempDir = path.join(app.getPath("temp"), "deepgram_audio");
// //   if (!existsSync(tempDir)) {
// //     logDeepgram(`Creating temp directory: ${tempDir}`);
// //     mkdirSync(tempDir, { recursive: true });
// //   }

// //   // Инициализируем клиент DeepGram
// //   initializeDeepgramClient();

// //   // Обработчик для транскрипции буфера аудио
// //   // ipcMain.handle(
// //   //   "transcribe-buffer",
// //   //   async (_, options: { language?: string } = {}) => {
// //   //     logDeepgram(
// //   //       `Received transcribe-buffer request with options: ${JSON.stringify(options)}`
// //   //     );

// //   //     // Проверяем, есть ли данные для транскрипции
// //   //     if (audioBuffer.length === 0) {
// //   //       logDeepgram("Audio buffer is empty, returning dummy transcription");
// //   //       const dummyTranscription = createDummyTranscription(
// //   //         options.language || "en"
// //   //       );
// //   //       mainWindow.webContents.send("transcription-result", dummyTranscription);
// //   //       return dummyTranscription;
// //   //     }

// //   //     try {
// //   //       // Объединяем все фрагменты аудио в один буфер
// //   //       const combinedBuffer = Buffer.concat(
// //   //         audioBuffer.map((item) => item.data)
// //   //       );
// //   //       logDeepgram(
// //   //         `Combined buffer size: ${combinedBuffer.length} bytes from ${audioBuffer.length} chunks`
// //   //       );

// //   //       // Создаем временный файл для аудио
// //   //       const tempAudioPath = join(
// //   //         tempDir,
// //   //         `audio_to_transcribe_${Date.now()}.wav`
// //   //       );

// //   //       // Сохраняем аудио во временный файл
// //   //       logDeepgram(`Saving audio to: ${tempAudioPath}`);
// //   //       writeFileSync(tempAudioPath, combinedBuffer);

// //   //       // Проверяем, успешно ли создан файл
// //   //       if (!existsSync(tempAudioPath)) {
// //   //         throw new Error(`Failed to write audio file to ${tempAudioPath}`);
// //   //       }

// //   //       // Транскрибируем аудио с помощью DeepGram
// //   //       // Получаем язык из переданных опций или из состояния захвата аудио
// //   //       let language = options.language;

// //   //       // Если язык не задан явно в опциях, проверяем captureSettings
// //   //       if (!language && captureSettings && captureSettings.language) {
// //   //         language = captureSettings.language;
// //   //         logDeepgram(`Using language from capture settings: ${language}`);
// //   //       } else if (!language) {
// //   //         // Если язык по-прежнему не определен, используем английский по умолчанию
// //   //         language = "en";
// //   //         logDeepgram(`No language specified, using default: ${language}`);
// //   //       }

// //   //       const result = await transcribeAudioWithDeepgram(
// //   //         tempAudioPath,
// //   //         language
// //   //       );

// //   //       // Отправляем результат в рендерер
// //   //       if (result) {
// //   //         logDeepgram(`Sending transcription result to UI: "${result.text}"`);
// //   //         mainWindow.webContents.send("transcription-result", result);
// //   //       } else {
// //   //         logDeepgram("No transcription result to send to UI");
// //   //       }

// //   //       return result;
// //   //     } catch (err) {
// //   //       logDeepgram(`Error transcribing buffer: ${err}`);

// //   //       // Возвращаем запасной вариант при ошибке
// //   //       const language =
// //   //         options.language ||
// //   //         (captureSettings && captureSettings.language) ||
// //   //         "en";
// //   //       const dummy = createDummyTranscription(language);
// //   //       mainWindow.webContents.send("transcription-result", dummy);
// //   //       return dummy;
// //   //     }
// //   //   }
// //   // );

// //   ipcMain.handle(
// //     "transcribe-buffer",
// //     async (_, options: { language?: string } = {}) => {
// //       logDeepgram(
// //         `Received transcribe-buffer request with options: ${JSON.stringify(options)}`
// //       );

// //       // Проверяем, есть ли данные для транскрипции
// //       if (audioBuffer.length === 0) {
// //         logDeepgram("Audio buffer is empty, returning dummy transcription");
// //         const dummyTranscription = createDummyTranscription(
// //           options.language || "en"
// //         );
// //         mainWindow.webContents.send("transcription-result", dummyTranscription);
// //         return dummyTranscription;
// //       }

// //       try {
// //         // Объединяем все фрагменты аудио в один буфер
// //         const combinedBuffer = Buffer.concat(
// //           audioBuffer.map((item) => item.data)
// //         );
// //         logDeepgram(
// //           `Combined buffer size: ${combinedBuffer.length} bytes from ${audioBuffer.length} chunks`
// //         );

// //         // Создаем временный файл для аудио
// //         const tempAudioPath = join(
// //           tempDir,
// //           `audio_to_transcribe_${Date.now()}.wav`
// //         );

// //         // Сохраняем аудио во временный файл
// //         logDeepgram(`Saving audio to: ${tempAudioPath}`);
// //         writeFileSync(tempAudioPath, combinedBuffer);

// //         // Проверяем, успешно ли создан файл
// //         if (!existsSync(tempAudioPath)) {
// //           throw new Error(`Failed to write audio file to ${tempAudioPath}`);
// //         }

// //         // Транскрибируем аудио с помощью DeepGram
// //         // Получаем язык из переданных опций или из настроек аудио
// //         let language = options.language;

// //         // Если язык не задан явно в опциях, получаем из настроек
// //         if (!language) {
// //           // Используем функцию для получения текущих настроек
// //           const audioSettings = getAudioCaptureSettings();
// //           if (audioSettings && audioSettings.language) {
// //             language = audioSettings.language;
// //             logDeepgram(`Using language from capture settings: ${language}`);
// //           } else {
// //             // Если язык по-прежнему не определен, используем английский по умолчанию
// //             language = "en";
// //             logDeepgram(`No language in settings, using default: ${language}`);
// //           }
// //         }

// //         const result = await transcribeAudioWithDeepgram(
// //           tempAudioPath,
// //           language
// //         );

// //         // Отправляем результат в рендерер
// //         if (result) {
// //           logDeepgram(`Sending transcription result to UI: "${result.text}"`);
// //           mainWindow.webContents.send("transcription-result", result);
// //         } else {
// //           logDeepgram("No transcription result to send to UI");
// //         }

// //         return result;
// //       } catch (err) {
// //         logDeepgram(`Error transcribing buffer: ${err}`);

// //         // Возвращаем запасной вариант при ошибке
// //         let language = options.language || "en";

// //         // Если язык не задан явно, попробуем получить из настроек
// //         if (!options.language) {
// //           try {
// //             const audioSettings = getAudioCaptureSettings();
// //             if (audioSettings && audioSettings.language) {
// //               language = audioSettings.language;
// //             }
// //           } catch (settingsErr) {
// //             logDeepgram(`Error getting audio settings: ${settingsErr}`);
// //           }
// //         }

// //         const dummy = createDummyTranscription(language);
// //         mainWindow.webContents.send("transcription-result", dummy);
// //         return dummy;
// //       }
// //     }
// //   );

// //   // Получение последней транскрипции
// //   ipcMain.handle("get-last-transcription", () => {
// //     logDeepgram(
// //       `Returning last transcription: ${lastTranscription?.text || "none"}`
// //     );
// //     return lastTranscription;
// //   });

// //   // Добавление аудио данных в буфер
// //   ipcMain.on("add-audio-data", (_, audioData: Buffer) => {
// //     addToAudioBuffer(audioData);
// //   });

// //   // Сообщаем об успешной инициализации
// //   mainWindow.webContents.send("whisper-status", {
// //     status: "ready",
// //     message: "DeepGram transcription service ready",
// //   });

// //   logDeepgram("DeepGram transcription service setup complete");
// // }

// // export { getLastTranscription, addToAudioBuffer, clearAudioBuffer };

// // src/main/services/whisper.ts with improvements for better buffer management
// import { BrowserWindow, ipcMain } from "electron";
// import { join } from "path";
// import {
//   writeFileSync,
//   existsSync,
//   mkdirSync,
//   readFileSync,
//   unlinkSync,
//   readdirSync,
// } from "fs";
// import { app } from "electron";
// import path from "path";
// import fs from "fs";
// import { createClient } from "@deepgram/sdk";
// import { getAudioCaptureSettings } from "./audio-capture";

// // Определяем интерфейс для результатов транскрипции
// interface TranscriptionResult {
//   text: string;
//   timestamp: number;
//   language: string;
// }

// // Constants for buffer management
// const BUFFER_DURATION_MS = 60000; // 60 seconds buffer limit (reduced from unbounded growth)
// const MAX_BUFFER_SIZE = 1024 * 1024 * 10; // 10MB limit as a failsafe
// const TEMP_DIR = path.join(app.getPath("temp"), "deepgram_audio");

// // Временный буфер для хранения аудио данных
// let audioBuffer: { data: Buffer; timestamp: number }[] = [];
// let lastTranscription: TranscriptionResult | null = null;
// let totalBufferSize = 0; // Track total buffer size

// // Инициализируем клиент DeepGram
// let deepgramClient: Deepgram | null = null;

// // Функция для логирования с префиксом [DeepGram]
// function logDeepgram(message: string, ...args: any[]) {
//   console.log(`[DeepGram] ${message}`, ...args);
// }

// // Инициализация клиента DeepGram
// function initializeDeepgramClient() {
//   try {
//     const apiKey = process.env.DEEPGRAM_API_KEY || "";

//     if (!apiKey) {
//       logDeepgram(
//         "No DeepGram API key provided. Please configure it in the settings."
//       );
//       return null;
//     }

//     deepgramClient = createClient(apiKey);
//     logDeepgram("DeepGram client initialized successfully");
//     return deepgramClient;
//   } catch (error) {
//     logDeepgram("Failed to initialize DeepGram client:", error);
//     return null;
//   }
// }

// // Create a dummy transcription for debugging or when DeepGram API is not available
// function createDummyTranscription(language: string): TranscriptionResult {
//   const now = Date.now();

//   // Generate a dummy message based on the buffer size to make debugging easier
//   const bufferSize = audioBuffer.length;
//   const totalBytes = audioBuffer.reduce(
//     (acc, item) => acc + item.data.length,
//     0
//   );

//   const text =
//     bufferSize > 0
//       ? `Audio recording received (${bufferSize} fragments, ${totalBytes} bytes). DeepGram API not configured.`
//       : `Audio recording is empty. Check microphone settings. DeepGram API not configured.`;

//   return {
//     text,
//     timestamp: now,
//     language,
//   };
// }

// // async function transcribeAudioWithDeepgram(
// //   audioPath: string,
// //   language: string = "en"
// // ): Promise<TranscriptionResult | null> {
// //   try {
// //     logDeepgram(
// //       `Transcribing audio with DeepGram: ${audioPath} (language: ${language})`
// //     );

// //     // Load API key
// //     const apiKey =
// //       process.env.DEEPGRAM_API_KEY ||
// //       "61c6085076948c01a838b2c69f31d1dedd2778b7";

// //     if (!apiKey) {
// //       logDeepgram(
// //         "No DeepGram API key found, please configure it in settings."
// //       );
// //       return createDummyTranscription(language);
// //     }

// //     // Create DeepGram client
// //     const deepgram = createClient(apiKey);

// //     try {
// //       // Read audio file with error handling
// //       let audioFile: Buffer;
// //       try {
// //         audioFile = fs.readFileSync(audioPath);
// //         logDeepgram(
// //           `Successfully read audio file: ${audioPath} (${audioFile.length} bytes)`
// //         );
// //       } catch (readError) {
// //         logDeepgram(`Error reading audio file ${audioPath}: ${readError}`);
// //         return createDummyTranscription(language);
// //       }

// //       // Check if file contains valid data
// //       if (!audioFile || audioFile.length === 0) {
// //         logDeepgram("Audio file is empty or corrupted");
// //         return createDummyTranscription(language);
// //       }

// //       // Send to DeepGram with more detailed options
// //       const { result, error } =
// //         await deepgram.listen.prerecorded.transcribeFile(audioFile, {
// //           model: "nova-2",
// //           language: language,
// //           smart_format: true,
// //           punctuate: true,
// //           diarize: false, // Disable diarization for simpler results
// //           tier: "enhanced", // Use enhanced tier for better quality
// //           detect_language: true, // Backup language detection
// //         });

// //       // Check for errors
// //       if (error) {
// //         logDeepgram(`DeepGram API error: ${error}`);
// //         return createDummyTranscription(language);
// //       }

// //       // Extract transcription from result
// //       const transcript =
// //         result?.results?.channels[0]?.alternatives[0]?.transcript;

// //       if (!transcript) {
// //         logDeepgram("No transcription available in DeepGram response");
// //         return createDummyTranscription(language);
// //       }

// //       logDeepgram(`Transcription result: "${transcript}"`);

// //       // Create and return transcription result
// //       const transcriptionResult: TranscriptionResult = {
// //         text: transcript,
// //         timestamp: Date.now(),
// //         language,
// //       };

// //       lastTranscription = transcriptionResult;
// //       return transcriptionResult;
// //     } catch (apiError) {
// //       logDeepgram(`DeepGram API processing error: ${apiError}`);
// //       return createDummyTranscription(language);
// //     }
// //   } catch (error) {
// //     logDeepgram(`Error in transcribeAudioWithDeepgram: ${error}`);
// //     return createDummyTranscription(language);
// //   }
// // }

// // async function transcribeAudioWithDeepgram(
// //   audioPath: string,
// //   language: string = "en"
// // ): Promise<TranscriptionResult | null> {
// //   try {
// //     logDeepgram(
// //       `Transcribing audio with DeepGram: ${audioPath} (language: ${language})`
// //     );

// //     // Load API key
// //     const apiKey = process.env.DEEPGRAM_API_KEY || "";

// //     if (!apiKey) {
// //       logDeepgram(
// //         "No DeepGram API key found, please configure it in settings."
// //       );
// //       return createDummyTranscription(language);
// //     }

// //     // Create DeepGram client
// //     const deepgram = createClient(apiKey);

// //     try {
// //       // Read audio file with error handling
// //       let audioFile: Buffer;
// //       try {
// //         audioFile = fs.readFileSync(audioPath);
// //         logDeepgram(
// //           `Successfully read audio file: ${audioPath} (${audioFile.length} bytes)`
// //         );
// //       } catch (readError) {
// //         logDeepgram(`Error reading audio file ${audioPath}: ${readError}`);
// //         return createDummyTranscription(language);
// //       }

// //       // Check if file contains valid data
// //       if (!audioFile || audioFile.length === 0) {
// //         logDeepgram("Audio file is empty or corrupted");
// //         return createDummyTranscription(language);
// //       }

// //       // Send to DeepGram with more compatible options
// //       // Using general model instead of nova-2 which requires special permissions
// //       const { result, error } =
// //         await deepgram.listen.prerecorded.transcribeFile(audioFile, {
// //           model: "general", // Changed from nova-2 to the standard general model
// //           language: language,
// //           smart_format: true,
// //           punctuate: true,
// //           diarize: false, // Disable diarization for simpler results
// //           detect_language: true, // Backup language detection
// //         });

// //       // Check for errors
// //       if (error) {
// //         logDeepgram(`DeepGram API error: ${error}`);
// //         return createDummyTranscription(language);
// //       }

// //       // Extract transcription from result
// //       const transcript =
// //         result?.results?.channels[0]?.alternatives[0]?.transcript;

// //       if (!transcript) {
// //         logDeepgram("No transcription available in DeepGram response");
// //         return createDummyTranscription(language);
// //       }

// //       logDeepgram(`Transcription result: "${transcript}"`);

// //       // Create and return transcription result
// //       const transcriptionResult: TranscriptionResult = {
// //         text: transcript,
// //         timestamp: Date.now(),
// //         language,
// //       };

// //       lastTranscription = transcriptionResult;
// //       return transcriptionResult;
// //     } catch (apiError) {
// //       logDeepgram(`DeepGram API processing error: ${apiError}`);
// //       return createDummyTranscription(language);
// //     }
// //   } catch (error) {
// //     logDeepgram(`Error in transcribeAudioWithDeepgram: ${error}`);
// //     return createDummyTranscription(language);
// //   }
// // }

// const DEEPGRAM_MODELS = ["nova-2", "nova", "general"];

// /**
//  * Try transcribing with multiple DeepGram models with fallback
//  */
// async function transcribeWithFallback(
//   deepgram: any,
//   audioFile: Buffer,
//   language: string
// ): Promise<{ result: any; error: any; model: string }> {
//   // Try each model in succession until one works
//   for (const model of DEEPGRAM_MODELS) {
//     try {
//       logDeepgram(`Attempting transcription with model: ${model}`);

//       const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
//         audioFile,
//         {
//           model: model,
//           language: language,
//           smart_format: true,
//           punctuate: true,
//           diarize: false,
//           detect_language: true,
//         }
//       );

//       // If no error, return successful result
//       if (!error) {
//         logDeepgram(`Successful transcription with model: ${model}`);
//         return { result, error: null, model };
//       }

//       // If permission error, try next model
//       if (error.toString().includes("INSUFFICIENT_PERMISSIONS")) {
//         logDeepgram(`Permission error with model ${model}, trying next model`);
//         continue;
//       }

//       // For other errors, return the error
//       return { result, error, model };
//     } catch (err) {
//       logDeepgram(`Exception with model ${model}: ${err}`);
//       // Continue to next model on exception
//     }
//   }

//   // If all models failed, return final error
//   return {
//     result: null,
//     error: new Error("All DeepGram models failed"),
//     model: "none"
//   };
// }

// // Then update the transcribeAudioWithDeepgram function to use the fallback logic:

// async function transcribeAudioWithDeepgram(
//   audioPath: string,
//   language: string = "en"
// ): Promise<TranscriptionResult | null> {
//   try {
//     logDeepgram(
//       `Transcribing audio with DeepGram: ${audioPath} (language: ${language})`
//     );

//     // Load API key
//     const apiKey = process.env.DEEPGRAM_API_KEY || "";

//     if (!apiKey) {
//       logDeepgram(
//         "No DeepGram API key found, please configure it in settings."
//       );
//       return createDummyTranscription(language);
//     }

//     // Create DeepGram client
//     const deepgram = createClient(apiKey);

//     try {
//       // Read audio file with error handling
//       let audioFile: Buffer;
//       try {
//         audioFile = fs.readFileSync(audioPath);
//         logDeepgram(`Successfully read audio file: ${audioPath} (${audioFile.length} bytes)`);
//       } catch (readError) {
//         logDeepgram(`Error reading audio file ${audioPath}: ${readError}`);
//         return createDummyTranscription(language);
//       }

//       // Check if file contains valid data
//       if (!audioFile || audioFile.length === 0) {
//         logDeepgram("Audio file is empty or corrupted");
//         return createDummyTranscription(language);
//       }

//       // Use the fallback logic to try multiple models
//       const { result, error, model } = await transcribeWithFallback(
//         deepgram,
//         audioFile,
//         language
//       );

//       // Check for errors
//       if (error) {
//         logDeepgram(`DeepGram API error with all models: ${error}`);
//         return createDummyTranscription(language);
//       }

//       // Extract transcription from result
//       const transcript =
//         result?.results?.channels[0]?.alternatives[0]?.transcript;

//       if (!transcript) {
//         logDeepgram("No transcription available in DeepGram response");
//         return createDummyTranscription(language);
//       }

//       logDeepgram(`Transcription result (using ${model}): "${transcript}"`);

//       // Create and return transcription result
//       const transcriptionResult: TranscriptionResult = {
//         text: transcript,
//         timestamp: Date.now(),
//         language,
//       };

//       lastTranscription = transcriptionResult;
//       return transcriptionResult;
//     } catch (apiError) {
//       logDeepgram(`DeepGram API processing error: ${apiError}`);
//       return createDummyTranscription(language);
//     }
//   } catch (error) {
//     logDeepgram(`Error in transcribeAudioWithDeepgram: ${error}`);
//     return createDummyTranscription(language);
//   }

// // Add audio data to buffer with improved handling and logging
// function addToAudioBuffer(audioData: Buffer) {
//   const now = Date.now();

//   // Check if the audioData is valid before adding to buffer
//   if (!audioData || audioData.length === 0) {
//     console.warn("[DeepGram] Received empty audio data, ignoring");
//     return;
//   }

//   // Add the new data to buffer
//   audioBuffer.push({ data: audioData, timestamp: now });
//   totalBufferSize += audioData.length;

//   // Log adding data
//   logDeepgram(`Adding audio data to buffer: ${audioData.length} bytes`);

//   // Clean up old data based on time and maximum size
//   const cutoffTime = now - BUFFER_DURATION_MS;
//   const oldLength = audioBuffer.length;

//   // First, remove old chunks by timestamp
//   const timeFiltered = audioBuffer.filter(
//     (item) => item.timestamp >= cutoffTime
//   );

//   // Then, if buffer is still too large, remove oldest chunks until under limit
//   while (totalBufferSize > MAX_BUFFER_SIZE && timeFiltered.length > 1) {
//     const removed = timeFiltered.shift();
//     if (removed) {
//       totalBufferSize -= removed.data.length;
//     }
//   }

//   audioBuffer = timeFiltered;

//   // Log buffer stats
//   logDeepgram(
//     `Audio buffer updated: ${audioBuffer.length} chunks (${totalBufferSize} bytes), removed ${oldLength - audioBuffer.length} old chunks`
//   );
// }

// // Function to clear the audio buffer with better logging
// function clearAudioBuffer() {
//   logDeepgram("Clearing audio buffer completely");
//   const oldLength = audioBuffer.length;

//   if (oldLength > 0) {
//     const totalBytes = audioBuffer.reduce(
//       (acc, item) => acc + item.data.length,
//       0
//     );
//     logDeepgram(`Discarding ${oldLength} chunks (${totalBytes} bytes)`);
//   }

//   audioBuffer = [];
//   totalBufferSize = 0;
//   logDeepgram("Audio buffer cleared");
// }

// // Get the last transcription
// function getLastTranscription(): TranscriptionResult | null {
//   return lastTranscription;
// }

// // Delete all temporary audio files
// /**
//  * Deletes all temporary audio files with comprehensive error handling
//  * @returns {boolean} Success status
//  */
// function cleanupTempFiles(): boolean {
//   try {
//     logDeepgram("Cleaning up temporary audio files...");

//     // Check if temp directory exists
//     if (!existsSync(TEMP_DIR)) {
//       logDeepgram(`Temp directory doesn't exist: ${TEMP_DIR}`);
//       return true; // Nothing to clean up
//     }

//     // Read directory contents
//     let files: string[];
//     try {
//       files = readdirSync(TEMP_DIR);
//       logDeepgram(`Found ${files.length} files in temp directory`);
//     } catch (readError) {
//       logDeepgram(`Error reading temp directory: ${readError}`);
//       return false;
//     }

//     // Track success status
//     let success = true;
//     let deletedCount = 0;
//     let failedCount = 0;

//     // Process each file
//     files.forEach(file => {
//       // Only delete transcription audio files
//       if (file.startsWith('audio_to_transcribe_') && file.endsWith('.wav')) {
//         const filePath = path.join(TEMP_DIR, file);

//         try {
//           // Delete the file
//           logDeepgram(`Deleting file: ${file}`);
//           unlinkSync(filePath);
//           deletedCount++;
//         } catch (deleteError) {
//           logDeepgram(`Error deleting file ${file}: ${deleteError}`);
//           failedCount++;
//           success = false;
//         }
//       }
//     });

//     // Log summary
//     logDeepgram(`Cleanup complete: ${deletedCount} files deleted, ${failedCount} failed`);

//     return success;
//   } catch (error) {
//     logDeepgram(`Error during temp file cleanup: ${error}`);
//     return false;
//   }
// }

// // Set up Whisper service
// export function setupWhisperService(mainWindow: BrowserWindow): void {
//   logDeepgram("Setting up DeepGram transcription service");

//   // Create temporary directory for audio files
//   if (!existsSync(TEMP_DIR)) {
//     logDeepgram(`Creating temp directory: ${TEMP_DIR}`);
//     mkdirSync(TEMP_DIR, { recursive: true });
//   }

//   // Initialize DeepGram client
//   initializeDeepgramClient();

//    // Handler to cleanup temporary files
//    ipcMain.handle("cleanup-audio-files", () => {
//     logDeepgram("Received cleanup request for audio files");
//     const success = cleanupTempFiles();
//     return {
//       success,
//       message: success
//         ? "Temporary audio files cleaned up successfully"
//         : "Error cleaning up some temporary files"
//     };
//   });

//   // Handler for transcribing audio buffer
//   ipcMain.handle(
//     "transcribe-buffer",
//     async (_, options: { language?: string } = {}) => {
//       logDeepgram(
//         `Received transcribe-buffer request with options: ${JSON.stringify(options)}`
//       );

//       // Check if there's data to transcribe
//       if (audioBuffer.length === 0) {
//         logDeepgram("Audio buffer is empty, returning dummy transcription");
//         const dummyTranscription = createDummyTranscription(
//           options.language || "en"
//         );
//         mainWindow.webContents.send("transcription-result", dummyTranscription);
//         return dummyTranscription;
//       }

//       try {
//         // Combine all audio fragments into one buffer
//         const combinedBuffer = Buffer.concat(
//           audioBuffer.map((item) => item.data)
//         );
//         logDeepgram(
//           `Combined buffer size: ${combinedBuffer.length} bytes from ${audioBuffer.length} chunks`
//         );

//         // Create temporary file for audio
//         const timestamp = Date.now();
//         const tempAudioPath = join(
//           TEMP_DIR,
//           `audio_to_transcribe_${timestamp}.wav`
//         );

//         // Save audio to temporary file
//         logDeepgram(`Saving audio to: ${tempAudioPath}`);
//         writeFileSync(tempAudioPath, combinedBuffer);

//         // Check if file was created successfully
//         if (!existsSync(tempAudioPath)) {
//           throw new Error(`Failed to write audio file to ${tempAudioPath}`);
//         }

//         // Determine language to use
//         let language = options.language;

//         // If language not specified in options, use settings
//         if (!language) {
//           try {
//             const audioSettings = getAudioCaptureSettings();
//             if (audioSettings && audioSettings.language) {
//               language = audioSettings.language;
//               logDeepgram(`Using language from capture settings: ${language}`);
//             } else {
//               // Default to English if no language specified
//               language = "en";
//               logDeepgram(
//                 `No language in settings, using default: ${language}`
//               );
//             }
//           } catch (settingsErr) {
//             logDeepgram(`Error getting audio settings: ${settingsErr}`);
//             language = "en";
//           }
//         }

//         // Transcribe audio
//         const result = await transcribeAudioWithDeepgram(
//           tempAudioPath,
//           language
//         );

//         // Send result to renderer
//         if (result) {
//           logDeepgram(`Sending transcription result to UI: "${result.text}"`);
//           mainWindow.webContents.send("transcription-result", result);
//         } else {
//           logDeepgram("No transcription result to send to UI");
//         }

//         return result;
//       } catch (err) {
//         logDeepgram(`Error transcribing buffer: ${err}`);

//         // Return fallback on error
//         let language = options.language || "en";

//         // Try to get language from settings if not specified
//         if (!options.language) {
//           try {
//             const audioSettings = getAudioCaptureSettings();
//             if (audioSettings && audioSettings.language) {
//               language = audioSettings.language;
//             }
//           } catch (settingsErr) {
//             logDeepgram(`Error getting audio settings: ${settingsErr}`);
//           }
//         }

//         const dummy = createDummyTranscription(language);
//         mainWindow.webContents.send("transcription-result", dummy);
//         return dummy;
//       }
//     }
//   );

//   // Handler for getting last transcription
//   ipcMain.handle("get-last-transcription", () => {
//     logDeepgram(
//       `Returning last transcription: ${lastTranscription?.text || "none"}`
//     );
//     return lastTranscription;
//   });

//   // Handler for adding audio data to buffer
//   ipcMain.on("add-audio-data", (_, audioData: Buffer) => {
//     addToAudioBuffer(audioData);
//   });

//   // Handler to cleanup temporary files
//   ipcMain.handle("cleanup-audio-files", () => {
//     logDeepgram("Cleaning up temporary audio files");
//     cleanupTempFiles();
//     return { success: true };
//   });

//   // Notify that service is ready
//   mainWindow.webContents.send("whisper-status", {
//     status: "ready",
//     message: "DeepGram transcription service ready",
//   });

//   logDeepgram("DeepGram transcription service setup complete");
// }

// export {
//   getLastTranscription,
//   addToAudioBuffer,
//   clearAudioBuffer,
//   cleanupTempFiles,
//   setupWhisperService,
// };

// src/main/services/whisper.ts with improvements for better buffer management
import { BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import {
  writeFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  readdirSync,
} from "fs";
import { app } from "electron";
import path from "path";
import fs from "fs";
import { createClient } from "@deepgram/sdk";
import { getAudioCaptureSettings } from "./audio-capture";

// Определяем интерфейс для результатов транскрипции
interface TranscriptionResult {
  text: string;
  timestamp: number;
  language: string;
}

// Constants for buffer management
const BUFFER_DURATION_MS = 60000; // 60 seconds buffer limit (reduced from unbounded growth)
const MAX_BUFFER_SIZE = 1024 * 1024 * 10; // 10MB limit as a failsafe
const TEMP_DIR = path.join(app.getPath("temp"), "deepgram_audio");

// List of models to try in order of preference
const DEEPGRAM_MODELS = ["nova-2", "nova", "general"];

// Временный буфер для хранения аудио данных
let audioBuffer: { data: Buffer; timestamp: number }[] = [];
let lastTranscription: TranscriptionResult | null = null;
let totalBufferSize = 0; // Track total buffer size

// Инициализируем клиент DeepGram
let deepgramClient: Deepgram | null = null;

// Функция для логирования с префиксом [DeepGram]
function logDeepgram(message: string, ...args: any[]) {
  console.log(`[DeepGram] ${message}`, ...args);
}

// Инициализация клиента DeepGram
function initializeDeepgramClient() {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY || "";

    if (!apiKey) {
      logDeepgram(
        "No DeepGram API key provided. Please configure it in the settings."
      );
      return null;
    }

    deepgramClient = createClient(apiKey);
    logDeepgram("DeepGram client initialized successfully");
    return deepgramClient;
  } catch (error) {
    logDeepgram("Failed to initialize DeepGram client:", error);
    return null;
  }
}

// Create a dummy transcription for debugging or when DeepGram API is not available
function createDummyTranscription(language: string): TranscriptionResult {
  const now = Date.now();

  // Generate a dummy message based on the buffer size to make debugging easier
  const bufferSize = audioBuffer.length;
  const totalBytes = audioBuffer.reduce(
    (acc, item) => acc + item.data.length,
    0
  );

  const text =
    bufferSize > 0
      ? `Audio recording received (${bufferSize} fragments, ${totalBytes} bytes). DeepGram API not configured.`
      : `Audio recording is empty. Check microphone settings. DeepGram API not configured.`;

  return {
    text,
    timestamp: now,
    language,
  };
}

/**
 * Try transcribing with multiple DeepGram models with fallback
 */
async function transcribeWithFallback(
  deepgram: any,
  audioFile: Buffer,
  language: string
): Promise<{ result: any; error: any; model: string }> {
  // Try each model in succession until one works
  for (const model of DEEPGRAM_MODELS) {
    try {
      logDeepgram(`Attempting transcription with model: ${model}`);

      const { result, error } =
        await deepgram.listen.prerecorded.transcribeFile(audioFile, {
          model: model,
          language: language,
          smart_format: true,
          punctuate: true,
          diarize: false,
          detect_language: true,
        });

      // If no error, return successful result
      if (!error) {
        logDeepgram(`Successful transcription with model: ${model}`);
        return { result, error: null, model };
      }

      // If permission error, try next model
      if (error.toString().includes("INSUFFICIENT_PERMISSIONS")) {
        logDeepgram(`Permission error with model ${model}, trying next model`);
        continue;
      }

      // For other errors, return the error
      return { result, error, model };
    } catch (err) {
      logDeepgram(`Exception with model ${model}: ${err}`);
      // Continue to next model on exception
    }
  }

  // If all models failed, return final error
  return {
    result: null,
    error: new Error("All DeepGram models failed"),
    model: "none",
  };
}

async function transcribeAudioWithDeepgram(
  audioPath: string,
  language: string = "en"
): Promise<TranscriptionResult | null> {
  try {
    logDeepgram(
      `Transcribing audio with DeepGram: ${audioPath} (language: ${language})`
    );

    // Load API key
    const apiKey = process.env.DEEPGRAM_API_KEY || "";

    if (!apiKey) {
      logDeepgram(
        "No DeepGram API key found, please configure it in settings."
      );
      return createDummyTranscription(language);
    }

    // Create DeepGram client
    const deepgram = createClient(apiKey);

    try {
      // Read audio file with error handling
      let audioFile: Buffer;
      try {
        audioFile = fs.readFileSync(audioPath);
        logDeepgram(
          `Successfully read audio file: ${audioPath} (${audioFile.length} bytes)`
        );
      } catch (readError) {
        logDeepgram(`Error reading audio file ${audioPath}: ${readError}`);
        return createDummyTranscription(language);
      }

      // Check if file contains valid data
      if (!audioFile || audioFile.length === 0) {
        logDeepgram("Audio file is empty or corrupted");
        return createDummyTranscription(language);
      }

      // Use the fallback logic to try multiple models
      const { result, error, model } = await transcribeWithFallback(
        deepgram,
        audioFile,
        language
      );

      // Check for errors
      if (error) {
        logDeepgram(`DeepGram API error with all models: ${error}`);
        return createDummyTranscription(language);
      }

      // Extract transcription from result
      const transcript =
        result?.results?.channels[0]?.alternatives[0]?.transcript;

      if (!transcript) {
        logDeepgram("No transcription available in DeepGram response");
        return createDummyTranscription(language);
      }

      logDeepgram(`Transcription result (using ${model}): "${transcript}"`);

      // Create and return transcription result
      const transcriptionResult: TranscriptionResult = {
        text: transcript,
        timestamp: Date.now(),
        language,
      };

      lastTranscription = transcriptionResult;
      return transcriptionResult;
    } catch (apiError) {
      logDeepgram(`DeepGram API processing error: ${apiError}`);
      return createDummyTranscription(language);
    }
  } catch (error) {
    logDeepgram(`Error in transcribeAudioWithDeepgram: ${error}`);
    return createDummyTranscription(language);
  }
}

// Add audio data to buffer with improved handling and logging
function addToAudioBuffer(audioData: Buffer) {
  const now = Date.now();

  // Check if the audioData is valid before adding to buffer
  if (!audioData || audioData.length === 0) {
    console.warn("[DeepGram] Received empty audio data, ignoring");
    return;
  }

  // Add the new data to buffer
  audioBuffer.push({ data: audioData, timestamp: now });
  totalBufferSize += audioData.length;

  // Log adding data
  logDeepgram(`Adding audio data to buffer: ${audioData.length} bytes`);

  // Clean up old data based on time and maximum size
  const cutoffTime = now - BUFFER_DURATION_MS;
  const oldLength = audioBuffer.length;

  // First, remove old chunks by timestamp
  const timeFiltered = audioBuffer.filter(
    (item) => item.timestamp >= cutoffTime
  );

  // Then, if buffer is still too large, remove oldest chunks until under limit
  while (totalBufferSize > MAX_BUFFER_SIZE && timeFiltered.length > 1) {
    const removed = timeFiltered.shift();
    if (removed) {
      totalBufferSize -= removed.data.length;
    }
  }

  audioBuffer = timeFiltered;

  // Log buffer stats
  logDeepgram(
    `Audio buffer updated: ${audioBuffer.length} chunks (${totalBufferSize} bytes), removed ${oldLength - audioBuffer.length} old chunks`
  );
}

// Function to clear the audio buffer with better logging
function clearAudioBuffer() {
  logDeepgram("Clearing audio buffer completely");
  const oldLength = audioBuffer.length;

  if (oldLength > 0) {
    const totalBytes = audioBuffer.reduce(
      (acc, item) => acc + item.data.length,
      0
    );
    logDeepgram(`Discarding ${oldLength} chunks (${totalBytes} bytes)`);
  }

  audioBuffer = [];
  totalBufferSize = 0;
  logDeepgram("Audio buffer cleared");
}

// Get the last transcription
function getLastTranscription(): TranscriptionResult | null {
  return lastTranscription;
}

/**
 * Deletes all temporary audio files with comprehensive error handling
 * @returns {boolean} Success status
 */
function cleanupTempFiles(): boolean {
  try {
    logDeepgram("Cleaning up temporary audio files...");

    // Check if temp directory exists
    if (!existsSync(TEMP_DIR)) {
      logDeepgram(`Temp directory doesn't exist: ${TEMP_DIR}`);
      return true; // Nothing to clean up
    }

    // Read directory contents
    let files: string[];
    try {
      files = readdirSync(TEMP_DIR);
      logDeepgram(`Found ${files.length} files in temp directory`);
    } catch (readError) {
      logDeepgram(`Error reading temp directory: ${readError}`);
      return false;
    }

    // Track success status
    let success = true;
    let deletedCount = 0;
    let failedCount = 0;

    // Process each file
    files.forEach((file) => {
      // Only delete transcription audio files
      if (file.startsWith("audio_to_transcribe_") && file.endsWith(".wav")) {
        const filePath = path.join(TEMP_DIR, file);

        try {
          // Delete the file
          logDeepgram(`Deleting file: ${file}`);
          unlinkSync(filePath);
          deletedCount++;
        } catch (deleteError) {
          logDeepgram(`Error deleting file ${file}: ${deleteError}`);
          failedCount++;
          success = false;
        }
      }
    });

    // Log summary
    logDeepgram(
      `Cleanup complete: ${deletedCount} files deleted, ${failedCount} failed`
    );

    return success;
  } catch (error) {
    logDeepgram(`Error during temp file cleanup: ${error}`);
    return false;
  }
}

// Set up Whisper service
export function setupWhisperService(mainWindow: BrowserWindow): void {
  logDeepgram("Setting up DeepGram transcription service");

  // Create temporary directory for audio files
  if (!existsSync(TEMP_DIR)) {
    logDeepgram(`Creating temp directory: ${TEMP_DIR}`);
    mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Initialize DeepGram client
  initializeDeepgramClient();

  // Handler for transcribing audio buffer
  ipcMain.handle(
    "transcribe-buffer",
    async (_, options: { language?: string } = {}) => {
      logDeepgram(
        `Received transcribe-buffer request with options: ${JSON.stringify(options)}`
      );

      // Check if there's data to transcribe
      if (audioBuffer.length === 0) {
        logDeepgram("Audio buffer is empty, returning dummy transcription");
        const dummyTranscription = createDummyTranscription(
          options.language || "en"
        );
        mainWindow.webContents.send("transcription-result", dummyTranscription);
        return dummyTranscription;
      }

      try {
        // Combine all audio fragments into one buffer
        const combinedBuffer = Buffer.concat(
          audioBuffer.map((item) => item.data)
        );
        logDeepgram(
          `Combined buffer size: ${combinedBuffer.length} bytes from ${audioBuffer.length} chunks`
        );

        // Create temporary file for audio
        const timestamp = Date.now();
        const tempAudioPath = join(
          TEMP_DIR,
          `audio_to_transcribe_${timestamp}.wav`
        );

        // Save audio to temporary file
        logDeepgram(`Saving audio to: ${tempAudioPath}`);
        writeFileSync(tempAudioPath, combinedBuffer);

        // Check if file was created successfully
        if (!existsSync(tempAudioPath)) {
          throw new Error(`Failed to write audio file to ${tempAudioPath}`);
        }

        // Determine language to use
        let language = options.language;

        // If language not specified in options, use settings
        if (!language) {
          try {
            const audioSettings = getAudioCaptureSettings();
            if (audioSettings && audioSettings.language) {
              language = audioSettings.language;
              logDeepgram(`Using language from capture settings: ${language}`);
            } else {
              // Default to English if no language specified
              language = "en";
              logDeepgram(
                `No language in settings, using default: ${language}`
              );
            }
          } catch (settingsErr) {
            logDeepgram(`Error getting audio settings: ${settingsErr}`);
            language = "en";
          }
        }

        // Transcribe audio
        const result = await transcribeAudioWithDeepgram(
          tempAudioPath,
          language
        );

        // Send result to renderer
        if (result) {
          logDeepgram(`Sending transcription result to UI: "${result.text}"`);
          mainWindow.webContents.send("transcription-result", result);
        } else {
          logDeepgram("No transcription result to send to UI");
        }

        return result;
      } catch (err) {
        logDeepgram(`Error transcribing buffer: ${err}`);

        // Return fallback on error
        let language = options.language || "en";

        // Try to get language from settings if not specified
        if (!options.language) {
          try {
            const audioSettings = getAudioCaptureSettings();
            if (audioSettings && audioSettings.language) {
              language = audioSettings.language;
            }
          } catch (settingsErr) {
            logDeepgram(`Error getting audio settings: ${settingsErr}`);
          }
        }

        const dummy = createDummyTranscription(language);
        mainWindow.webContents.send("transcription-result", dummy);
        return dummy;
      }
    }
  );

  // Handler for getting last transcription
  ipcMain.handle("get-last-transcription", () => {
    logDeepgram(
      `Returning last transcription: ${lastTranscription?.text || "none"}`
    );
    return lastTranscription;
  });

  // Handler for adding audio data to buffer
  ipcMain.on("add-audio-data", (_, audioData: Buffer) => {
    addToAudioBuffer(audioData);
  });

  // Handler to cleanup temporary files
  ipcMain.handle("cleanup-audio-files", () => {
    logDeepgram("Received cleanup request for audio files");
    const success = cleanupTempFiles();
    return {
      success,
      message: success
        ? "Temporary audio files cleaned up successfully"
        : "Error cleaning up some temporary files",
    };
  });

  // Notify that service is ready
  mainWindow.webContents.send("whisper-status", {
    status: "ready",
    message: "DeepGram transcription service ready",
  });

  logDeepgram("DeepGram transcription service setup complete");
}

export {
  getLastTranscription,
  addToAudioBuffer,
  clearAudioBuffer,
  cleanupTempFiles,
};
