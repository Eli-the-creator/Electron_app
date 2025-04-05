// src/renderer/src/components/AudioSettings.tsx
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Save, Mic } from "lucide-react";

interface AudioSettingsProps {
  className?: string;
}

interface AudioSettings {
  captureMicrophone: boolean;
  captureSystemAudio: boolean;
  language: string;
  sampleRate: number;
  channels: number;
}

const AudioSettings: React.FC<AudioSettingsProps> = ({ className }) => {
  const [settings, setSettings] = useState<AudioSettings>({
    captureMicrophone: true,
    captureSystemAudio: true,
    language: "en",
    sampleRate: 16000,
    channels: 1,
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Загрузка сохраненных настроек при монтировании компонента
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Загружаем настройки аудио
        const audioStatus = await window.api.audio.getCaptureStatus();
        if (audioStatus && audioStatus.settings) {
          setSettings({
            captureMicrophone: audioStatus.settings.captureMicrophone,
            captureSystemAudio: audioStatus.settings.captureSystemAudio,
            language: audioStatus.settings.language || "en",
            sampleRate: audioStatus.settings.sampleRate || 16000,
            channels: audioStatus.settings.channels || 1,
          });
        }
      } catch (error) {
        console.error("Ошибка при загрузке настроек аудио:", error);
      }
    };

    loadSettings();
  }, []);

  // Сохранение настроек аудио
  const handleSave = async () => {
    setIsSaving(true);
    setSavedMessage(null);

    try {
      const result = await window.api.audio.updateAudioSettings(settings);

      if (result) {
        setSavedMessage("Audio settings saved successfully");
      } else {
        throw new Error("Failed to save audio settings");
      }

      // Clear message after 3 seconds
      setTimeout(() => setSavedMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save audio settings:", error);
      setSavedMessage("Failed to save audio settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Audio Settings
        </CardTitle>
        <CardDescription>
          Configure audio capture and speech recognition settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="capture-microphone">Microphone Recording</Label>
            <p className="text-xs text-muted-foreground">
              Enable recording from device microphone
            </p>
          </div>
          <Switch
            id="capture-microphone"
            checked={settings.captureMicrophone}
            className=""
            onCheckedChange={(checked) =>
              setSettings({ ...settings, captureMicrophone: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="capture-system-audio">System Audio Recording</Label>
            <p className="text-xs text-muted-foreground">
              Enable system audio recording (requires additional permissions)
            </p>
          </div>
          <Switch
            id="capture-system-audio"
            className=""
            checked={settings.captureSystemAudio}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, captureSystemAudio: checked })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Recognition Language</Label>
          <Select
            value={settings.language}
            onValueChange={(value) =>
              setSettings({ ...settings, language: value })
            }>
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent className="bg-black/90">
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ru">Russian</SelectItem>
              <SelectItem value="pl">Polish</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="it">Italian</SelectItem>
              <SelectItem value="pt">Portuguese</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
              <SelectItem value="zh">Chinese</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select language for speech recognition
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sample-rate">Sample Rate</Label>
          <Select
            value={settings.sampleRate.toString()}
            onValueChange={(value) =>
              setSettings({ ...settings, sampleRate: parseInt(value) })
            }>
            <SelectTrigger id="sample-rate">
              <SelectValue placeholder="Select sample rate" />
            </SelectTrigger>
            <SelectContent className="bg-black/90">
              <SelectItem value="8000">8 kHz (Low quality)</SelectItem>
              <SelectItem value="16000">16 kHz (Recommended)</SelectItem>
              <SelectItem value="22050">22.05 kHz</SelectItem>
              <SelectItem value="44100">44.1 kHz (High quality)</SelectItem>
              <SelectItem value="48000">48 kHz (Studio quality)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Higher sample rates provide better audio quality but require more
            processing power
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="channels">Audio Channels</Label>
          <Select
            value={settings.channels.toString()}
            onValueChange={(value) =>
              setSettings({ ...settings, channels: parseInt(value) })
            }>
            <SelectTrigger id="channels">
              <SelectValue placeholder="Select channels" />
            </SelectTrigger>
            <SelectContent className="bg-black/90">
              <SelectItem value="1">Mono (Recommended for speech)</SelectItem>
              <SelectItem value="2">Stereo</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Mono is recommended for speech recognition, stereo for music and
            ambient sound
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
        <Button variant={"outline"} onClick={handleSave} disabled={isSaving}>
          <Save size={14} className="mr-1" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AudioSettings;
