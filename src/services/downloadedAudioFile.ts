import { File } from "expo-file-system";
import { Platform } from "react-native";

const AUDIO_EXTENSIONS = [".m4a", ".mp4", ".mp3"] as const;

const extensionForMimeType = (mimeType: string): string | null => {
  switch (mimeType.toLowerCase().split(";")[0].trim()) {
    case "audio/mp4":
    case "audio/x-m4a":
      return ".m4a";
    case "video/mp4":
      return ".mp4";
    case "audio/mpeg":
    case "audio/mp3":
      return ".mp3";
    default:
      return null;
  }
};

export const getStoredObjectPaths = (casPath: string): string[] =>
  Platform.OS === "ios"
    ? [casPath, ...AUDIO_EXTENSIONS.map((extension) => `${casPath}${extension}`)]
    : [casPath];

export const getDownloadedAudioPath = (
  casPath: string,
  mimeType: string
): string => {
  if (Platform.OS !== "ios") return casPath;
  const extension = extensionForMimeType(mimeType);
  return extension ? `${casPath}${extension}` : casPath;
};

export const ensurePlayableDownloadedAudio = (
  casPath: string,
  mimeType: string
): string => {
  const playbackPath = getDownloadedAudioPath(casPath, mimeType);
  if (playbackPath === casPath) return casPath;

  const destination = new File(playbackPath);
  if (destination.exists) return playbackPath;

  // Earlier versions saved audio without an extension. Move it in place so
  // existing offline downloads remain available without a second copy.
  const sourcePath = getStoredObjectPaths(casPath).find(
    (path) => path !== playbackPath && new File(path).exists
  );
  if (sourcePath) new File(sourcePath).move(destination);
  return playbackPath;
};
