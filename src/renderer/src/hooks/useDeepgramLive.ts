// // src/renderer/src/hooks/useDeepgramLive.ts
// import { useState, useEffect, useCallback, useRef } from "react";

// interface TranscriptionResult {
//   text: string;
//   timestamp: number;
//   language: string;
//   isFinal: boolean;
// }

// export function useDeepgramLive() {
//   const [isTranscribing, setIsTranscribing] = useState(false);
//   const [currentTranscript, setCurrentTranscript] = useState<string>("");
//   const [fullTranscript, setFullTranscript] = useState<string>("");
//   const [error, setError] = useState<string | null>(null);
//   const [language, setLanguage] = useState<"en" | "ru" | "pl">("en");

//   // Refs to maintain state between renders
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const socketRef = useRef<any>(null);
//   const deepgramClientRef = useRef<any>(null);

//   // Start live transcription
//   const startLiveTranscription = useCallback(
//     async (lang: "en" | "ru" | "pl" = "en") => {
//       try {
//         if (isTranscribing) {
//           console.log("Live transcription already active");
//           return true;
//         }

//         console.log(
//           `Starting DeepGram live transcription in ${lang} language...`
//         );
//         setLanguage(lang);
//         setError(null);
//         setCurrentTranscript("");
//         setFullTranscript("");

//         // Tell the main process we're starting transcription
//         const result =
//           await window.api.deepgramLive.startLiveTranscription(lang);
//         if (!result.success) {
//           throw new Error(result.error || "Failed to start live transcription");
//         }

//         // Get DeepGram API key
//         // const apiKey = await window.api.deepgramLive.getApiKey();
//         const apiKey = "06f4401b3a57b4b54994f6fe6b3d449b86d26a25";
//         if (!apiKey) {
//           throw new Error("DeepGram API key not configured");
//         }

//         // Initialize DeepGram client in the renderer
//         try {
//           // Import DeepGram SDK dynamically to avoid bundling issues
//           const deepgramSdk = await import("@deepgram/sdk");
//           const { createClient } = deepgramSdk;

//           // Create DeepGram client
//           const deepgramClient = createClient(apiKey);
//           deepgramClientRef.current = deepgramClient;

//           console.log("[ DeepGram ] Client initialized successfully asdasdasd");
//           console.log(
//             "[ DeepGram ] TEST IF STARTED live transcription 123123123"
//           );

//           // Create live transcription connection
//           console.log("Creating DeepGram live connection...");
//           const connection = deepgramClient.listen.live({
//             language: lang,
//             model: "nova-2",
//             smart_format: true,
//             punctuate: true,
//             interim_results: true,
//           });
//           socketRef.current = connection;

//           // Set up event handlers
//           connection.on("open", () => {
//             console.log("DeepGram connection opened");
//           });

//           connection.on("close", () => {
//             console.log("DeepGram connection closed");
//             if (isTranscribing) {
//               setIsTranscribing(false);
//             }
//           });

//           connection.on("error", (error: any) => {
//             console.error("DeepGram connection error:", error);
//             setError(`DeepGram error: ${error.message || "Unknown error"}`);
//           });

//           connection.on("transcriptReceived", (transcription: any) => {
//             try {
//               // Extract transcript from response
//               const transcript =
//                 transcription.channel?.alternatives?.[0]?.transcript || "";
//               const isFinal = !transcription.is_final;

//               if (transcript) {
//                 console.log(
//                   `Transcript received: "${transcript}" (isFinal: ${isFinal})`
//                 );

//                 // Update current transcript for display
//                 setCurrentTranscript(transcript);

//                 // If this is a final result, append to full transcript
//                 if (isFinal) {
//                   setFullTranscript((prev) => {
//                     const newText = prev ? `${prev} ${transcript}` : transcript;
//                     return newText;
//                   });

//                   // Send the result to main process to update listeners
//                   const result: TranscriptionResult = {
//                     text: transcript,
//                     timestamp: Date.now(),
//                     language: lang,
//                     isFinal: true,
//                   };
//                   window.api.deepgramLive.sendTranscriptionResult(result);
//                 }
//               }
//             } catch (error) {
//               console.error("Error processing DeepGram transcript:", error);
//             }
//           });

//           // Request audio access and start streaming
//           const stream = await navigator.mediaDevices.getUserMedia({
//             audio: {
//               echoCancellation: true,
//               noiseSuppression: true,
//               autoGainControl: true,
//             },
//           });

//           // Create MediaRecorder
//           const recorder = new MediaRecorder(stream, {
//             mimeType: MediaRecorder.isTypeSupported("audio/webm")
//               ? "audio/webm"
//               : "audio/mp4",
//           });

//           mediaRecorderRef.current = recorder;

//           // Listen for audio data and send to DeepGram
//           recorder.addEventListener("dataavailable", (event) => {
//             if (event.data.size > 0 && socketRef.current?.readyState === 1) {
//               socketRef.current.send(event.data);
//             }
//           });

//           // Start recording - get data every 250ms for low latency
//           recorder.start(250);
//           setIsTranscribing(true);
//           console.log("DeepGram live transcription started successfully");

//           return true;
//         } catch (error) {
//           console.error("Error initializing DeepGram client:", error);
//           throw error;
//         }
//       } catch (error) {
//         console.error("Error starting live transcription:", error);
//         setError(
//           `Error starting transcription: ${error instanceof Error ? error.message : String(error)}`
//         );
//         await stopLiveTranscription();
//         return false;
//       }
//     },
//     [isTranscribing]
//   );

//   // Stop live transcription
//   const stopLiveTranscription = useCallback(async () => {
//     try {
//       console.log("Stopping DeepGram live transcription...");

//       // Stop media recorder if it exists
//       if (
//         mediaRecorderRef.current &&
//         mediaRecorderRef.current.state !== "inactive"
//       ) {
//         mediaRecorderRef.current.stop();
//         // Stop all audio tracks
//         if (mediaRecorderRef.current.stream) {
//           mediaRecorderRef.current.stream
//             .getTracks()
//             .forEach((track) => track.stop());
//         }
//       }

//       // Close socket connection
//       if (socketRef.current) {
//         socketRef.current.close();
//         socketRef.current = null;
//       }

//       // Cleanup DeepGram client
//       deepgramClientRef.current = null;

//       // Tell the main process we're stopping
//       const result = await window.api.deepgramLive.stopLiveTranscription();

//       // Final transcription result
//       if (currentTranscript) {
//         const finalResult: TranscriptionResult = {
//           text: fullTranscript || currentTranscript,
//           timestamp: Date.now(),
//           language,
//           isFinal: true,
//         };

//         // Send final result
//         window.api.deepgramLive.sendTranscriptionResult(finalResult);
//       }

//       setIsTranscribing(false);
//       console.log("DeepGram live transcription stopped successfully");

//       return true;
//     } catch (error) {
//       console.error("Error stopping live transcription:", error);
//       setError(
//         `Error stopping transcription: ${error instanceof Error ? error.message : String(error)}`
//       );
//       setIsTranscribing(false);
//       return false;
//     }
//   }, [currentTranscript, fullTranscript, language]);

//   // Setup listeners for status changes from main process
//   useEffect(() => {
//     const removeStatusListener = window.api.deepgramLive.onLiveStatus(
//       (status) => {
//         console.log("DeepGram live status changed:", status);

//         if (status.status === "started" && !isTranscribing) {
//           // Main process requested to start transcription
//           startLiveTranscription(
//             (status.language as "en" | "ru" | "pl") || "en"
//           );
//         } else if (status.status === "stopped" && isTranscribing) {
//           // Main process requested to stop transcription
//           stopLiveTranscription();
//         }
//       }
//     );

//     // Cleanup on unmount
//     return () => {
//       removeStatusListener();
//       if (isTranscribing) {
//         stopLiveTranscription();
//       }
//     };
//   }, [isTranscribing, startLiveTranscription, stopLiveTranscription]);

//   return {
//     isTranscribing,
//     currentTranscript,
//     fullTranscript,
//     error,
//     language,
//     startLiveTranscription,
//     stopLiveTranscription,
//   };
// }

// src/renderer/src/hooks/useDeepgramLive.ts
import { useState, useEffect, useCallback, useRef } from "react";

interface TranscriptionResult {
  text: string;
  timestamp: number;
  language: string;
  isFinal: boolean;
}

export function useDeepgramLive() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>("");
  const [fullTranscript, setFullTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "ru" | "pl">("en");

  // Refs to maintain state between renders
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const apiKeyRef = useRef<string | null>(null);

  // Start live transcription
  const startLiveTranscription = useCallback(
    async (lang: "en" | "ru" | "pl" = "en") => {
      try {
        if (isTranscribing) {
          console.log("Live transcription already active");
          return true;
        }

        console.log(
          `Starting DeepGram live transcription in ${lang} language...`
        );
        setLanguage(lang);
        setError(null);
        setCurrentTranscript("");
        setFullTranscript("");

        // Tell the main process we're starting transcription
        const result =
          await window.api.deepgramLive.startLiveTranscription(lang);
        if (!result.success) {
          throw new Error(result.error || "Failed to start live transcription");
        }

        // Get DeepGram API key
        const apiKey = await window.api.deepgramLive.getApiKey();
        if (!apiKey) {
          throw new Error("DeepGram API key not configured");
        }

        apiKeyRef.current = apiKey;
        console.log("DeepGram API key received, setting up audio capture...");

        // Set up WebSocket connection to DeepGram
        const socket = new WebSocket("wss://api.deepgram.com/v1/listen", [
          "token",
          apiKey,
        ]);

        socketRef.current = socket;

        // Set up WebSocket event handlers
        socket.onopen = () => {
          console.log("DeepGram WebSocket connection opened");

          // Configure the live transcription session
          const configMessage = {
            sampling_rate: 16000,
            channels: 1,
            encoding: "linear16",
            language: lang,
            model: "nova-3",
            smart_format: true,
            punctuate: true,
            interim_results: true,
          };

          socket.send(JSON.stringify(configMessage));

          // Start recording audio
          startRecording();
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Extract transcript from response
            if (
              data.channel &&
              data.channel.alternatives &&
              data.channel.alternatives.length > 0
            ) {
              const transcript = data.channel.alternatives[0].transcript || "";
              const isFinal = !data.is_final;

              if (transcript) {
                console.log(
                  `Transcript received: "${transcript}" (isFinal: ${isFinal})`
                );

                // Update current transcript for display
                setCurrentTranscript(transcript);

                // If this is a final result, append to full transcript
                if (isFinal) {
                  setFullTranscript((prev) => {
                    const newText = prev ? `${prev} ${transcript}` : transcript;
                    return newText;
                  });

                  // Send the result to main process to update listeners
                  const result: TranscriptionResult = {
                    text: transcript,
                    timestamp: Date.now(),
                    language: lang,
                    isFinal: true,
                  };
                  window.api.deepgramLive.sendTranscriptionResult(result);
                }
              }
            }
          } catch (error) {
            console.error("Error processing DeepGram transcript:", error);
          }
        };

        socket.onerror = (error) => {
          console.error("DeepGram WebSocket error:", error);
          setError(`DeepGram WebSocket error`);
        };

        socket.onclose = (event) => {
          console.log(
            `DeepGram WebSocket closed: ${event.code}, ${event.reason}`
          );
          if (isTranscribing) {
            setIsTranscribing(false);
          }
        };

        // Function to start recording audio
        const startRecording = async () => {
          try {
            // Request audio access and start streaming
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000,
              },
            });

            // Create MediaRecorder
            const recorder = new MediaRecorder(stream, {
              mimeType: MediaRecorder.isTypeSupported("audio/webm")
                ? "audio/webm"
                : "audio/mp4",
            });

            mediaRecorderRef.current = recorder;

            // Listen for audio data and send to DeepGram
            recorder.addEventListener("dataavailable", (event) => {
              if (
                event.data.size > 0 &&
                socketRef.current?.readyState === WebSocket.OPEN
              ) {
                // Convert Blob to ArrayBuffer before sending
                event.data.arrayBuffer().then((buffer) => {
                  socketRef.current?.send(buffer);
                });
              }
            });

            // Start recording - get data every 250ms for low latency
            recorder.start(250);
            setIsTranscribing(true);
            console.log("DeepGram live transcription started successfully");
          } catch (err) {
            console.error("Error starting audio recording:", err);
            setError(
              `Error starting audio recording: ${err instanceof Error ? err.message : String(err)}`
            );
            throw err;
          }
        };

        return true;
      } catch (error) {
        console.error("Error starting live transcription:", error);
        setError(
          `Error starting transcription: ${error instanceof Error ? error.message : String(error)}`
        );
        await stopLiveTranscription();
        return false;
      }
    },
    [isTranscribing]
  );

  // Stop live transcription
  const stopLiveTranscription = useCallback(async () => {
    try {
      console.log("Stopping DeepGram live transcription...");

      // Stop media recorder if it exists
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
        // Stop all audio tracks
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream
            .getTracks()
            .forEach((track) => track.stop());
        }
      }

      // Close socket connection
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.close();
        socketRef.current = null;
      }

      // Tell the main process we're stopping
      const result = await window.api.deepgramLive.stopLiveTranscription();

      // Final transcription result
      if (currentTranscript) {
        const finalResult: TranscriptionResult = {
          text: fullTranscript || currentTranscript,
          timestamp: Date.now(),
          language,
          isFinal: true,
        };

        // Send final result
        window.api.deepgramLive.sendTranscriptionResult(finalResult);
      }

      setIsTranscribing(false);
      console.log("DeepGram live transcription stopped successfully");

      return true;
    } catch (error) {
      console.error("Error stopping live transcription:", error);
      setError(
        `Error stopping transcription: ${error instanceof Error ? error.message : String(error)}`
      );
      setIsTranscribing(false);
      return false;
    }
  }, [currentTranscript, fullTranscript, language]);

  // Setup listeners for status changes from main process
  useEffect(() => {
    const removeStatusListener = window.api.deepgramLive.onLiveStatus(
      (status) => {
        console.log("DeepGram live status changed:", status);

        if (status.status === "started" && !isTranscribing) {
          // Main process requested to start transcription
          startLiveTranscription(
            (status.language as "en" | "ru" | "pl") || "en"
          );
        } else if (status.status === "stopped" && isTranscribing) {
          // Main process requested to stop transcription
          stopLiveTranscription();
        }
      }
    );

    // Cleanup on unmount
    return () => {
      removeStatusListener();
      if (isTranscribing) {
        stopLiveTranscription();
      }
    };
  }, [isTranscribing, startLiveTranscription, stopLiveTranscription]);

  return {
    isTranscribing,
    currentTranscript,
    fullTranscript,
    error,
    language,
    startLiveTranscription,
    stopLiveTranscription,
  };
}
