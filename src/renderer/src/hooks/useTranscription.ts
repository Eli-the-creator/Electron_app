// src/renderer/src/hooks/useTranscription.ts с обновлениями
import { debugLog } from "@renderer/lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";

interface TranscriptionResult {
  text: string;
  timestamp: number;
  language: string;
}

interface TranscriptionStatus {
  status: "ready" | "error" | "processing";
  message?: string;
}

export function useTranscription() {
  const [lastTranscription, setLastTranscription] =
    useState<TranscriptionResult | null>(null);
  const [transcriptionStatus, setTranscriptionStatus] =
    useState<TranscriptionStatus>({
      status: "ready",
    });
  const [error, setError] = useState<string | null>(null);
  const [isListeningForTranscription, setIsListeningForTranscription] =
    useState(false);
  const [transcriptionLanguage, setTranscriptionLanguage] =
    useState<string>("en");

  // Use refs for internal state that shouldn't trigger re-renders
  const transcriptionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingTranscriptionRef = useRef<boolean>(false);
  const lastTranscriptionTextRef = useRef<string | null>(null);
  const continuousTranscriptionActiveRef = useRef<boolean>(false);

  // Загрузка языка из настроек аудио
  useEffect(() => {
    const loadAudioSettings = async () => {
      try {
        const status = await window.api.audio.getCaptureStatus();
        if (status && status.settings && status.settings.language) {
          setTranscriptionLanguage(status.settings.language);
          console.log(
            `Loaded transcription language from settings: ${status.settings.language}`
          );
        }
      } catch (err) {
        console.error("Error loading audio settings:", err);
      }
    };

    loadAudioSettings();
  }, []);

  // Function to transcribe current audio buffer with DeepGram

  // const transcribeBuffer = useCallback(
  //   async (language?: string) => {
  //     // Don't start a new transcription if one is already in progress
  //     if (pendingTranscriptionRef.current) {
  //       console.log("Transcription already in progress, skipping new request");
  //       return null;
  //     }

  //     try {
  //       // Если язык явно указан, используем его, иначе не передаем параметр вообще
  //       const options = language ? { language } : {};

  //       console.log(
  //         `Transcribing buffer with DeepGram API${language ? ` (language: ${language})` : " (using settings)"}`
  //       );
  //       pendingTranscriptionRef.current = true;
  //       setTranscriptionStatus({ status: "processing" });

  //       // Передаем options без явного указания language, если его не было в аргументах
  //       const result = await window.api.whisper.transcribeBuffer(options);

  //       if (result) {
  //         console.log(`DeepGram transcription successful: "${result.text}"`);

  //         // Only update state if text is actually different to avoid unnecessary renders
  //         if (result.text !== lastTranscriptionTextRef.current) {
  //           lastTranscriptionTextRef.current = result.text;
  //           setLastTranscription(result);
  //         }

  //         setTranscriptionStatus({ status: "ready" });
  //         pendingTranscriptionRef.current = false;
  //         return result;
  //       } else {
  //         console.log("No transcription result returned from DeepGram");
  //         setTranscriptionStatus({ status: "ready" });
  //         pendingTranscriptionRef.current = false;
  //         return null;
  //       }
  //     } catch (err) {
  //       const errorMessage = `Error transcribing buffer with DeepGram: ${err instanceof Error ? err.message : String(err)}`;
  //       console.error(errorMessage, err);
  //       setError(errorMessage);
  //       setTranscriptionStatus({
  //         status: "error",
  //         message: errorMessage,
  //       });
  //       pendingTranscriptionRef.current = false;
  //       return null;
  //     }
  //   },
  //   [transcriptionLanguage]
  // );

  const transcribeBuffer = useCallback(
    async (language?: string) => {
      // Don't start a new transcription if one is already in progress
      if (pendingTranscriptionRef.current) {
        console.log("Transcription already in progress, skipping new request");
        return null;
      }

      try {
        // If language explicitly provided, use it, otherwise don't pass parameter
        const options = language ? { language } : {};

        console.log(
          `Transcribing buffer with DeepGram API${language ? ` (language: ${language})` : " (using settings)"}`
        );
        pendingTranscriptionRef.current = true;
        setTranscriptionStatus({ status: "processing" });

        // Use a timeout to prevent hanging if no response
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => {
            if (pendingTranscriptionRef.current) {
              console.log("Transcription request timed out after 15 seconds");
              pendingTranscriptionRef.current = false;
              resolve(null);
            }
          }, 15000); // 15 seconds timeout
        });

        // Create the transcription request
        const transcribePromise = window.api.whisper.transcribeBuffer(options);

        // Race between timeout and actual response
        const result = await Promise.race([transcribePromise, timeoutPromise]);

        if (result) {
          console.log(`DeepGram transcription successful: "${result.text}"`);

          // Only update state if text is actually different to avoid unnecessary renders
          if (result.text !== lastTranscriptionTextRef.current) {
            lastTranscriptionTextRef.current = result.text;
            setLastTranscription(result);
          }

          setTranscriptionStatus({ status: "ready" });
          pendingTranscriptionRef.current = false;
          return result;
        } else {
          console.log("No transcription result returned from DeepGram");
          setTranscriptionStatus({ status: "ready" });
          pendingTranscriptionRef.current = false;
          return null;
        }
      } catch (err) {
        const errorMessage = `Error transcribing buffer with DeepGram: ${err instanceof Error ? err.message : String(err)}`;
        console.error(errorMessage, err);
        setError(errorMessage);
        setTranscriptionStatus({
          status: "error",
          message: errorMessage,
        });
        pendingTranscriptionRef.current = false;
        return null;
      }
    },
    [transcriptionLanguage]
  );

  // Function to start continuous transcription
  const startContinuousTranscription = useCallback(
    (intervalMs = 2000, language?: string) => {
      // Use provided language or fall back to the one from settings
      const langToUse = language || transcriptionLanguage;

      console.log(
        `Starting continuous transcription with DeepGram: ${intervalMs}ms interval in ${langToUse} language`
      );

      // If a transcription interval is already running, stop it
      if (transcriptionIntervalRef.current) {
        clearInterval(transcriptionIntervalRef.current);
        transcriptionIntervalRef.current = null;
      }

      // Set active flag
      continuousTranscriptionActiveRef.current = true;

      // For DeepGram, we might not need to poll as frequently since we'll
      // transcribe the entire recording when stopped

      // Start interval for periodic status checks (not actual transcriptions)
      const interval = setInterval(() => {
        if (!continuousTranscriptionActiveRef.current) {
          // If no longer active, clear the interval
          clearInterval(interval);
          return;
        }

        console.log(
          "Audio capture active, collecting audio for DeepGram transcription"
        );
      }, intervalMs);

      transcriptionIntervalRef.current = interval;

      // Return cleanup function
      return () => {
        continuousTranscriptionActiveRef.current = false;
        if (transcriptionIntervalRef.current) {
          clearInterval(transcriptionIntervalRef.current);
          transcriptionIntervalRef.current = null;
        }
      };
    },
    [transcriptionLanguage]
  );

  // Function to stop continuous transcription and process results with DeepGram
  const stopContinuousTranscription = useCallback(() => {
    console.log("Stopping capture and processing transcription with DeepGram");
    continuousTranscriptionActiveRef.current = false;

    if (transcriptionIntervalRef.current) {
      clearInterval(transcriptionIntervalRef.current);
      transcriptionIntervalRef.current = null;
    }

    // With DeepGram, we'll transcribe the entire audio buffer once after stopping
    if (!pendingTranscriptionRef.current) {
      console.log("Processing final transcription with DeepGram");
      // Let the main process handle the API call
      // We don't explicitly call transcribeBuffer here as that will happen in App.tsx
    }
  }, []);

  // Set up event listeners and initial state
  useEffect(() => {
    console.log("Setting up DeepGram transcription listeners");

    const getLastTranscription = async () => {
      try {
        const result = await window.api.whisper.getLastTranscription();
        if (result) {
          console.log("Retrieved last transcription from DeepGram:", result);
          setLastTranscription(result);
          lastTranscriptionTextRef.current = result.text;
        }
      } catch (err) {
        setError(
          `Error getting last transcription from DeepGram: ${err instanceof Error ? err.message : String(err)}`
        );
        console.error("Error getting last transcription:", err);
      }
    };

    getLastTranscription();

    // Set up event listeners
    const removeTranscriptionResultListener =
      window.api.whisper.onTranscriptionResult((result) => {
        console.log("Received DeepGram transcription result:", result);
        if (result && result.text !== lastTranscriptionTextRef.current) {
          setLastTranscription(result);
          lastTranscriptionTextRef.current = result.text;
        }
        pendingTranscriptionRef.current = false;
      });

    const removeWhisperStatusListener = window.api.whisper.onWhisperStatus(
      (status) => {
        console.log("DeepGram transcription service status changed:", status);
        setTranscriptionStatus(status);
      }
    );

    // Set up audio data listener
    const removeProcessAudioDataListener =
      window.api.whisper.onProcessAudioData((audioData) => {
        if (isListeningForTranscription) {
          console.log(
            `Received audio data for DeepGram processing: ${audioData.length} bytes`
          );
        }
      });

    setIsListeningForTranscription(true);

    return () => {
      // Unsubscribe from events on unmount
      removeTranscriptionResultListener();
      removeWhisperStatusListener();
      removeProcessAudioDataListener();
      setIsListeningForTranscription(false);

      // Clean up transcription interval on unmount
      stopContinuousTranscription();
    };
  }, [stopContinuousTranscription]);

  // const cleanupAudioFiles = useCallback(async () => {
  //   try {
  //     await window.api.whisper.cleanupAudioFiles();
  //     debugLog(
  //       "useTranscription",
  //       "Successfully cleaned up temporary audio files"
  //     );
  //     return true;
  //   } catch (err) {
  //     const errorMessage = `Error cleaning up audio files: ${err instanceof Error ? err.message : String(err)}`;
  //     setError(errorMessage);
  //     debugLog("useTranscription", errorMessage);
  //     return false;
  //   }
  // }, []);

  return {
    lastTranscription,
    transcriptionStatus,
    error,
    transcribeBuffer,
    startContinuousTranscription,
    stopContinuousTranscription,
    setLastTranscription, // Export setLastTranscription for use in App.tsx
    transcriptionLanguage, // Export language for use elsewhere
    setTranscriptionLanguage, // Allow explicit setting of language
  };
}
