import { Platform } from "react-native";

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

export const getDownloadedAudioPath = (
  casPath: string,
  mimeType: string
): string => {
  if (Platform.OS !== "ios") return casPath;
  const extension = extensionForMimeType(mimeType);
  return extension ? `${casPath}${extension}` : casPath;
};
