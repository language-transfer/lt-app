import * as FileSystem from "expo-file-system/legacy";
import * as Network from "expo-network";

import CourseData from "@/src/data/courseData";
import {
  genPreferenceDownloadOnlyOnWifi,
  genPreferenceDownloadQuality,
  genProgressForLesson,
} from "@/src/storage/persistence";
import type { CourseName, DownloadSnapshot, Quality } from "@/src/types";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "../data/queryClient";

const DOCUMENT_DIRECTORY =
  (FileSystem as any).documentDirectory ??
  (FileSystem as any).cacheDirectory ??
  "";
const DOWNLOAD_ROOT = `${DOCUMENT_DIRECTORY}downloads`;

type InternalDownload = DownloadSnapshot & {
  resumable?: FileSystem.DownloadResumable;
  stagingPath?: string;
};

const downloads: Record<string, InternalDownload> = {};
// const subscriptions: Record<string, Set<(download: DownloadSnapshot | null) => void>> = {};

const resolvedDownloadPaths: Record<string, string | undefined> = {};

const ensureDir = async (path: string) => {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
};

const ensureCourseDir = async (course: CourseName) => {
  await ensureDir(DOWNLOAD_ROOT);
  await ensureDir(`${DOWNLOAD_ROOT}/${course}`);
};

const resolveDownloadPath = async (
  downloadId: string
): Promise<{ path: string; exists: boolean }> => {
  const primary = downloadPath(downloadId);
  const primaryInfo = await FileSystem.getInfoAsync(primary);
  if (primaryInfo.exists) {
    resolvedDownloadPaths[downloadId] = primary;
    return { path: primary, exists: true };
  }

  const legacy = legacyDownloadPath(downloadId);
  const legacyInfo = await FileSystem.getInfoAsync(legacy);
  if (legacyInfo.exists) {
    resolvedDownloadPaths[downloadId] = legacy;
    return { path: legacy, exists: true };
  }

  resolvedDownloadPaths[downloadId] = primary;
  return { path: primary, exists: false };
};

// const emit = (downloadId: string) => {
//   const snapshot = downloads[downloadId] ?? null;
//   subscriptions[downloadId]?.forEach((cb) => cb(snapshot));
// };

// TODO: maybe nest the query key? don't use download IDs?
const invalidate = (downloadId: string) => {
  queryClient.invalidateQueries({
    queryKey: ["@local", "downloads", downloadId],
  });
  const [course] = getCourseAndLesson(downloadId);
  queryClient.invalidateQueries({
    queryKey: ["@local", "downloads", course, "count"],
  });
};

const toDownloadId = (course: CourseName, lesson: number) =>
  `${course}/${CourseData.getLessonId(course, lesson)}`;

const getCourseAndLesson = (downloadId: string): [CourseName, string] => {
  const [course, lessonId] = downloadId.split("/");
  return [course as CourseName, lessonId];
};

const downloadPath = (downloadId: string) => {
  const [course, lessonId] = getCourseAndLesson(downloadId);
  return `${DOWNLOAD_ROOT}/${course}/${lessonId}.mp4`;
};

const legacyDownloadPath = (downloadId: string) => {
  const [course, lessonId] = getCourseAndLesson(downloadId);
  return `${DOWNLOAD_ROOT}/${course}/${lessonId}.mp3`;
};

const stagingPath = (downloadId: string) => `${downloadPath(downloadId)}.download`;

const snapshotFor = (downloadId: string): InternalDownload => {
  if (!downloads[downloadId]) {
    downloads[downloadId] = {
      id: downloadId,
      state: "idle",
      bytesWritten: 0,
      totalBytes: null,
      requested: false,
    };
  }

  return downloads[downloadId];
};

const trackProgress = (
  downloadId: string,
  totalBytes: number,
  bytesWritten: number
) => {
  const snapshot = snapshotFor(downloadId);
  snapshot.totalBytes = totalBytes;
  snapshot.bytesWritten = bytesWritten;
  invalidate(downloadId);
};

const finalizeDownload = async (downloadId: string) => {
  const snap = snapshotFor(downloadId);
  snap.state = "finished";
  snap.bytesWritten = snap.totalBytes ?? snap.bytesWritten;
  invalidate(downloadId);
};

const handleError = (downloadId: string, error: Error) => {
  const snap = snapshotFor(downloadId);
  snap.state = "error";
  snap.errorMessage = error.message;
  invalidate(downloadId);
};

const snapshots = new Map<string, FileSystem.DownloadResumable>();

const startResumableDownload = async (
  downloadId: string,
  url: string
): Promise<FileSystem.DownloadResumable> => {
  await ensureCourseDir(getCourseAndLesson(downloadId)[0]);
  const destination = stagingPath(downloadId);

  const resumable = FileSystem.createDownloadResumable(
    url,
    destination,
    {},
    (progress) => {
      const total = progress.totalBytesExpectedToWrite ?? 0;
      trackProgress(downloadId, total, progress.totalBytesWritten);
    }
  );

  return resumable;
};

const startDownloadInternal = async (
  course: CourseName,
  lesson: number,
  quality: Quality
) => {
  await CourseData.loadCourseMetadata(course);
  const downloadId = DownloadManager.getDownloadId(course, lesson);
  const url = await CourseData.getLessonUrl(course, lesson, quality);

  const existing = snapshots.get(downloadId);
  if (existing) {
    return existing;
  }

  const resumable = await startResumableDownload(downloadId, url);
  snapshots.set(downloadId, resumable);
  const snap = snapshotFor(downloadId);
  snap.state = "downloading";
  snap.requested = true;
  snap.stagingPath = stagingPath(downloadId);
  invalidate(downloadId);

  resumable
    .downloadAsync()
    .then(async () => {
      await FileSystem.moveAsync({
        from: stagingPath(downloadId),
        to: downloadPath(downloadId),
      });
      resolvedDownloadPaths[downloadId] = downloadPath(downloadId);
      snapshots.delete(downloadId);
      await finalizeDownload(downloadId);
    })
    .catch((err) => {
      snapshots.delete(downloadId);
      handleError(downloadId, err as Error);
    });

  return resumable;
};

const DownloadManager = {
  getDownloadFolderForCourse(course: CourseName) {
    return `${DOWNLOAD_ROOT}/${course}`;
  },

  getDownloadSaveLocation(downloadId: string) {
    return resolvedDownloadPaths[downloadId] ?? downloadPath(downloadId);
  },

  getDownloadId(course: CourseName, lesson: number) {
    return toDownloadId(course, lesson);
  },

  async startDownload(course: CourseName, lesson: number) {
    const [quality, wifiOnly] = await Promise.all([
      genPreferenceDownloadQuality(),
      genPreferenceDownloadOnlyOnWifi(),
    ]);

    if (wifiOnly) {
      const net = await Network.getNetworkStateAsync();
      if (net.type !== Network.NetworkStateType.WIFI) {
        throw new Error("Wi-Fi connection required to download");
      }
    }

    await startDownloadInternal(course, lesson, quality);
  },

  async genIsDownloaded(course: CourseName, lesson: number): Promise<boolean> {
    const downloadId = DownloadManager.getDownloadId(course, lesson);
    const { exists } = await resolveDownloadPath(downloadId);
    return exists;
  },

  async genDeleteDownload(course: CourseName, lesson: number) {
    const downloadId = DownloadManager.getDownloadId(course, lesson);
    const { path: target, exists } = await resolveDownloadPath(downloadId);
    if (!exists) {
      return;
    }
    const info = await FileSystem.getInfoAsync(target);
    if (info.exists) {
      await FileSystem.deleteAsync(target, { idempotent: true });
      delete resolvedDownloadPaths[downloadId];
      invalidate(downloadId);
    }
  },

  async genDeleteAllDownloadsForCourse(course: CourseName) {
    const folder = DownloadManager.getDownloadFolderForCourse(course);
    const info = await FileSystem.getInfoAsync(folder);
    if (info.exists) {
      await FileSystem.deleteAsync(folder, { idempotent: true });
      Object.keys(resolvedDownloadPaths).forEach((downloadId) => {
        if (downloadId.startsWith(`${course}/`)) {
          delete resolvedDownloadPaths[downloadId];
        }
      });
    }
  },

  async genDeleteFinishedDownloadsForCourse(course: CourseName) {
    await CourseData.loadCourseMetadata(course);
    const lessons = CourseData.getLessonIndices(course);
    await Promise.all(
      lessons.map(async (lesson) => {
        const progress = await genProgressForLesson(course, lesson);
        if (progress?.finished) {
          await DownloadManager.genDeleteDownload(course, lesson);
        }
      })
    );
  },

  stopDownload(downloadId: string) {
    const task = snapshots.get(downloadId);
    if (task) {
      task.pauseAsync().catch(() => {});
      snapshots.delete(downloadId);
    }

    const snap = snapshotFor(downloadId);
    snap.state = "idle";
    snap.bytesWritten = 0;
    snap.totalBytes = null;
    invalidate(downloadId);

    FileSystem.deleteAsync(stagingPath(downloadId), { idempotent: true }).catch(
      () => {}
    );
  },

  stopAllDownloadsForCourse(course: CourseName) {
    Object.keys(downloads).forEach((downloadId) => {
      if (downloadId.startsWith(`${course}/`)) {
        DownloadManager.stopDownload(downloadId);
      }
    });
  },
};

export function useIsLessonDownloaded(course: CourseName, lesson: number) {
  const downloadId = DownloadManager.getDownloadId(course, lesson);
  const { data: downloaded } = useQuery({
    queryKey: ["@local", "downloads", downloadId, "is-downloaded"],
    queryFn: () => DownloadManager.genIsDownloaded(course, lesson),
  });
  return downloaded;
}

export const useDownloadStatus = (course: CourseName, lesson: number) => {
  const downloadId = DownloadManager.getDownloadId(course, lesson);
  const { data: snapshot } = useQuery({
    queryKey: ["@local", "downloads", downloadId, "status"],
    queryFn: () => {
      return downloads[downloadId] ?? null;
    },
  });
  return snapshot;
};

export function useDownloadCount(course: CourseName) {
  const { data: count } = useQuery({
    queryKey: ["@local", "downloads", course, "count"],
    queryFn: async () => {
      const lessons = CourseData.getLessonIndices(course);
      const results = await Promise.all(
        lessons.map((lesson) => DownloadManager.genIsDownloaded(course, lesson))
      );
      return results.filter((r) => r).length;
    },
  });
  return count ?? 0;
}

export default DownloadManager;
