import { File } from "expo-file-system";
import { Platform } from "react-native";

import {
  ensurePlayableDownloadedAudio,
  getDownloadedAudioPath,
  getStoredObjectPaths,
} from "@/src/services/downloadedAudioFile";

const mockFiles = new Set<string>();

jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation((uri: string) => ({
    uri,
    get exists() {
      return mockFiles.has(uri);
    },
    move(destination: { uri: string }) {
      if (!mockFiles.has(uri)) throw new Error(`Missing source: ${uri}`);
      mockFiles.delete(uri);
      mockFiles.add(destination.uri);
    },
  })),
}));

describe("downloaded audio files", () => {
  const casPath = "file:///documents/objects/ab/cdef";
  const originalOS = Platform.OS;

  beforeEach(() => {
    mockFiles.clear();
    Platform.OS = "ios";
    jest.clearAllMocks();
  });

  afterAll(() => {
    Platform.OS = originalOS;
  });

  test.each([
    ["audio/mp4", ".m4a"],
    ["audio/x-m4a", ".m4a"],
    ["video/mp4", ".mp4"],
    ["audio/mpeg", ".mp3"],
    ["audio/mpeg; charset=binary", ".mp3"],
  ])("gives %s an iOS playback extension", (mimeType, extension) => {
    expect(getDownloadedAudioPath(casPath, mimeType)).toBe(
      `${casPath}${extension}`
    );
  });

  test("moves an existing extensionless download into its playable path", () => {
    mockFiles.add(casPath);

    expect(ensurePlayableDownloadedAudio(casPath, "video/mp4")).toBe(
      `${casPath}.mp4`
    );
    expect(mockFiles.has(casPath)).toBe(false);
    expect(mockFiles.has(`${casPath}.mp4`)).toBe(true);
    expect(getStoredObjectPaths(casPath).filter((path) => mockFiles.has(path))).toEqual([
      `${casPath}.mp4`,
    ]);
    expect(jest.mocked(File)).toHaveBeenCalled();
  });

  test("leaves a newly downloaded audio file in place", () => {
    mockFiles.add(`${casPath}.mp3`);

    expect(ensurePlayableDownloadedAudio(casPath, "audio/mpeg")).toBe(
      `${casPath}.mp3`
    );
    expect(mockFiles).toEqual(new Set([`${casPath}.mp3`]));
  });

  test("uses the existing CAS path on Android", () => {
    Platform.OS = "android";
    mockFiles.add(casPath);

    expect(ensurePlayableDownloadedAudio(casPath, "audio/mpeg")).toBe(casPath);
    expect(getStoredObjectPaths(casPath)).toEqual([casPath]);
    expect(mockFiles).toEqual(new Set([casPath]));
  });
});
