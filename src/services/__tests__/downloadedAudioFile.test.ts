import { Platform } from "react-native";

import { getDownloadedAudioPath } from "@/src/services/downloadedAudioFile";

describe("downloaded audio paths", () => {
  const casPath = "file:///documents/objects/ab/cdef";
  const originalOS = Platform.OS;

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
    Platform.OS = "ios";
    expect(getDownloadedAudioPath(casPath, mimeType)).toBe(
      `${casPath}${extension}`
    );
  });

  test("keeps non-audio objects extensionless on iOS", () => {
    Platform.OS = "ios";
    expect(getDownloadedAudioPath(casPath, "application/json")).toBe(casPath);
  });

  test("keeps Android CAS objects extensionless", () => {
    Platform.OS = "android";
    expect(getDownloadedAudioPath(casPath, "audio/mpeg")).toBe(casPath);
  });
});
