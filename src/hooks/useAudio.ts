import { useCallback, useEffect, useRef } from "react";
import { Audio, AVPlaybackSource } from "expo-av";
import { useGame } from "../context/GameContext";

// Sound effect types
export type SoundEffect =
  | "pickup"
  | "placement"
  | "clear"
  | "combo"
  | "error"
  | "gameover";

// We'll use programmatic sounds since we don't have audio files
// In a production app, you'd load actual audio files

export function useAudio() {
  const { settings } = useGame();
  const soundsRef = useRef<Map<SoundEffect, Audio.Sound>>(new Map());

  // Initialize audio on mount
  useEffect(() => {
    async function setupAudio() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error("Failed to setup audio:", error);
      }
    }
    setupAudio();

    // Cleanup sounds on unmount
    return () => {
      soundsRef.current.forEach((sound) => {
        sound.unloadAsync();
      });
    };
  }, []);

  // Play a sound effect
  const playSound = useCallback(
    async (effect: SoundEffect) => {
      if (!settings.soundEnabled) return;

      try {
        // For now, we'll create simple beep sounds
        // In production, you'd load actual audio files
        const { sound } = await Audio.Sound.createAsync(
          getSoundSource(effect),
          { shouldPlay: true, volume: getVolume(effect) }
        );

        // Auto-unload after playing
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
          }
        });
      } catch (error) {
        // Silently fail - audio is not critical
        console.debug("Audio playback failed:", effect, error);
      }
    },
    [settings.soundEnabled]
  );

  return { playSound };
}

// Get sound source for effect
// In a real app, these would be require() calls to audio files
function getSoundSource(effect: SoundEffect): AVPlaybackSource {
  // Placeholder - returns empty audio
  // Replace these with actual audio file imports:
  // return require('../assets/sounds/pickup.mp3')
  return { uri: "" };
}

// Get volume for effect
function getVolume(effect: SoundEffect): number {
  switch (effect) {
    case "pickup":
      return 0.3;
    case "placement":
      return 0.5;
    case "clear":
      return 0.7;
    case "combo":
      return 0.8;
    case "error":
      return 0.4;
    case "gameover":
      return 0.6;
    default:
      return 0.5;
  }
}

// Hook for background music
export function useBackgroundMusic() {
  const { settings } = useGame();
  const musicRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    async function setupMusic() {
      if (!settings.musicEnabled) {
        if (musicRef.current) {
          await musicRef.current.pauseAsync();
        }
        return;
      }

      // In production, load actual music file:
      // const { sound } = await Audio.Sound.createAsync(
      //   require('../assets/sounds/background.mp3'),
      //   { isLooping: true, volume: 0.3 }
      // );
      // musicRef.current = sound;
      // await sound.playAsync();
    }

    setupMusic();

    return () => {
      if (musicRef.current) {
        musicRef.current.unloadAsync();
      }
    };
  }, [settings.musicEnabled]);

  const toggleMusic = useCallback(async () => {
    if (musicRef.current) {
      const status = await musicRef.current.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await musicRef.current.pauseAsync();
        } else {
          await musicRef.current.playAsync();
        }
      }
    }
  }, []);

  return { toggleMusic };
}

