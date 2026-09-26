import { renderHook, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";
import TrackPlayer from "react-native-track-player";

import CourseData from "@/src/data/courseData";
import { useLessonAudio } from "@/src/services/audioPlayer";
import { CourseDownloadManager } from "@/src/services/downloadManager";

jest.mock("react-native-track-player", () => ({
  __esModule: true,
  default: {
    setupPlayer: jest.fn().mockResolvedValue(undefined),
    updateOptions: jest.fn().mockResolvedValue(undefined),
    getActiveTrack: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn().mockResolvedValue(undefined),
    add: jest.fn().mockResolvedValue(undefined),
    skip: jest.fn().mockResolvedValue(undefined),
    play: jest.fn().mockResolvedValue(undefined),
  },
  AndroidAudioContentType: { Speech: "speech" },
  AppKilledPlaybackBehavior: { StopPlaybackAndRemoveNotification: "stop" },
  Capability: {},
  IOSCategory: { Playback: "playback" },
  IOSCategoryMode: { Default: "default" },
  IOSCategoryOptions: { DuckOthers: "duckOthers" },
  State: { Ready: "ready", Playing: "playing", Ended: "ended", Error: "error" },
  useActiveTrack: () => undefined,
  usePlaybackState: () => ({ state: "ready" }),
  useProgress: () => ({ position: 0, duration: 60 }),
}));

jest.mock("@/src/data/courseData", () => ({
  __esModule: true,
  default: {
    loadCourseMetadata: jest.fn().mockResolvedValue(undefined),
    getLessonIndices: jest.fn().mockReturnValue([0]),
    getCourseImageWithText: () => 1,
    getPreloadedLesson: jest.fn().mockReturnValue(null),
    getLessonData: jest.fn((_: string, index: number) => ({
      id: `remote-${index}`,
      title: `Remote ${index}`,
      duration: 60,
    })),
    getLessonUrl: jest.fn().mockResolvedValue("https://example.test/cas/stream"),
    getLessonId: () => "spanish1",
    getLessonMimeType: () => "video/mp4",
    getLessonTitle: () => "Lesson 1",
    getLessonDuration: () => 60,
    getCourseUIColors: () => ({ background: "#ffffff" }),
  },
}));

jest.mock("@/src/services/downloadManager", () => ({
  CourseDownloadManager: {
    getDownloadStatus: jest.fn().mockResolvedValue("not-downloaded"),
    getLessonPointer: jest.fn(),
  },
  getLocalObjectPath: (pointer: { object: string }) =>
    `file:///objects/${pointer.object}`,
}));

jest.mock("@/src/storage/persistence", () => ({
  getPreferenceWithDefault: jest.fn().mockResolvedValue("low"),
  getProgressForLesson: jest.fn().mockResolvedValue(null),
}));
jest.mock("@/src/utils/log", () => ({ log: jest.fn() }));
jest.mock("@/src/services/trackPlayerService", () => ({
  PROGRESS_PERSIST_INTERVAL_MS: 3000,
}));

describe("lesson audio sources", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(CourseData.getLessonIndices).mockReturnValue([0]);
    jest.mocked(CourseData.getPreloadedLesson).mockReturnValue(null);
    jest.mocked(CourseDownloadManager.getDownloadStatus).mockResolvedValue("not-downloaded");
  });
  afterEach(() => jest.restoreAllMocks());

  test("includes the media type for an extensionless stream", async () => {
    renderHook(() => useLessonAudio("spanish", 0));

    await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalled());
    expect(TrackPlayer.add).toHaveBeenCalledWith([
      expect.objectContaining({
        url: "https://example.test/cas/stream",
        contentType: "video/mp4",
      }),
    ]);
  });

  test("uses the downloaded file's type when it differs from the streaming variant", async () => {
    jest.mocked(CourseDownloadManager.getDownloadStatus).mockResolvedValueOnce("downloaded");
    jest.mocked(CourseDownloadManager.getLessonPointer).mockResolvedValueOnce({
      _type: "file",
      object: "download",
      mimeType: "audio/mpeg",
      filesize: 100,
    });
    renderHook(() => useLessonAudio("spanish", 0));

    await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalled());
    expect(TrackPlayer.add).toHaveBeenCalledWith([
      expect.objectContaining({
        url: "file:///objects/download",
        contentType: "audio/mpeg",
      }),
    ]);
    expect(CourseData.getLessonUrl).not.toHaveBeenCalled();
  });

  test("does not force the streaming format onto an iOS bundled asset", async () => {
    const originalOS = Platform.OS;
    Platform.OS = "ios";
    jest.mocked(CourseData.getPreloadedLesson).mockReturnValueOnce({
      asset: 123,
      data: { id: "shipped", title: "Shipped", duration: 45, variants: {} as never },
    });
    try {
      renderHook(() => useLessonAudio("spanish", 0));

      await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalled());
      expect(TrackPlayer.add).toHaveBeenCalledWith([
        expect.objectContaining({ url: 123, contentType: undefined, id: "shipped", title: "Shipped", duration: 45 }),
      ]);
    } finally {
      Platform.OS = originalOS;
    }
  });

  test("selects a preloaded lesson at an arbitrary index with its own metadata", async () => {
    jest.mocked(CourseData.getLessonIndices).mockReturnValue([0, 1]);
    jest.mocked(CourseData.getPreloadedLesson).mockImplementation((_, index) =>
      index === 1
        ? { asset: 456, data: { id: "shipped-1", title: "Shipped 1", duration: 35, variants: {} as never } }
        : null
    );
    renderHook(() => useLessonAudio("spanish", 1));

    await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalled());
    expect(TrackPlayer.add).toHaveBeenCalledWith([
      expect.objectContaining({ url: "https://example.test/cas/stream" }),
      expect.objectContaining({ url: 456, id: "shipped-1", title: "Shipped 1", duration: 35 }),
    ]);
    expect(TrackPlayer.skip).toHaveBeenCalledWith(1);
  });

  test("a downloaded copy overrides a preloaded lesson and uses online metadata", async () => {
    jest.mocked(CourseData.getPreloadedLesson).mockReturnValue({
      asset: 123,
      data: { id: "shipped", title: "Shipped", duration: 45, variants: {} as never },
    });
    jest.mocked(CourseDownloadManager.getDownloadStatus).mockResolvedValue("downloaded");
    jest.mocked(CourseDownloadManager.getLessonPointer).mockResolvedValue({
      _type: "file", object: "remote-file", mimeType: "audio/mpeg", filesize: 100,
    });
    renderHook(() => useLessonAudio("spanish", 0));

    await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalled());
    expect(TrackPlayer.add).toHaveBeenCalledWith([
      expect.objectContaining({ url: "file:///objects/remote-file", id: "remote-0", title: "Remote 0", duration: 60 }),
    ]);
    expect(CourseData.getPreloadedLesson).not.toHaveBeenCalled();
  });

  test("surfaces an autoplay rejection instead of silently swallowing it", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.mocked(TrackPlayer.play).mockRejectedValueOnce(new Error("Audio could not start"));
    const { result } = renderHook(() => useLessonAudio("spanish", 0));

    await waitFor(() =>
      expect(result.current.error?.message).toBe("Audio could not start")
    );
  });
});
