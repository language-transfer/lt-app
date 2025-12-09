import * as FileSystem from "expo-file-system/legacy";
import * as Network from "expo-network";

import CourseData from "@/src/data/courseData";
import {
  genPreferenceDownloadOnlyOnWifi,
  genPreferenceDownloadQuality,
  genProgressForLesson,
} from "@/src/storage/persistence";
import type { Course, DownloadSnapshot, Quality } from "@/src/types";
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

const ensureDir = async (path: string) => {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
};

const ensureCourseDir = async (course: Course) => {
  await ensureDir(DOWNLOAD_ROOT);
  await ensureDir(`${DOWNLOAD_ROOT}/${course}`);
};

// const emit = (downloadId: string) => {
//   const snapshot = downloads[downloadId] ?? null;
//   subscriptions[downloadId]?.forEach((cb) => cb(snapshot));
// };

const invalidate = (downloadId: string) => {
  queryClient.invalidateQueries({
    queryKey: ["@local", "downloads", downloadId],
  });
};

const toDownloadId = (course: Course, lesson: number) =>
  `${course}/${CourseData.getLessonId(course, lesson)}`;

const getCourseAndLesson = (downloadId: string): [Course, string] => {
  const [course, lessonId] = downloadId.split("/");
  return [course as Course, lessonId];
};

const downloadPath = (downloadId: string) => {
  const [course, lessonId] = getCourseAndLesson(downloadId);
  return `${DOWNLOAD_ROOT}/${course}/${lessonId}.mp3`;
};

const stagingPath = (downloadId: string) =>
  `${downloadPath(downloadId)}.download`;

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
  course: Course,
  lesson: number,
  quality: Quality
) => {
  await CourseData.genLoadCourseMetadata(course);
  const downloadId = DownloadManager.getDownloadId(course, lesson);
  const url = CourseData.getLessonUrl(course, lesson, quality);

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
  getDownloadFolderForCourse(course: Course) {
    return `${DOWNLOAD_ROOT}/${course}`;
  },

  getDownloadSaveLocation(downloadId: string) {
    return downloadPath(downloadId);
  },

  getDownloadId(course: Course, lesson: number) {
    return toDownloadId(course, lesson);
  },

  async startDownload(course: Course, lesson: number) {
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

  async genIsDownloaded(course: Course, lesson: number): Promise<boolean> {
    const info = await FileSystem.getInfoAsync(
      DownloadManager.getDownloadSaveLocation(
        DownloadManager.getDownloadId(course, lesson)
      )
    );
    return info.exists;
  },

  async genDeleteDownload(course: Course, lesson: number) {
    const downloadId = DownloadManager.getDownloadId(course, lesson);
    const target = DownloadManager.getDownloadSaveLocation(downloadId);
    const info = await FileSystem.getInfoAsync(target);
    if (info.exists) {
      await FileSystem.deleteAsync(target, { idempotent: true });
      invalidate(downloadId);
    }
  },

  async genDeleteAllDownloadsForCourse(course: Course) {
    const folder = DownloadManager.getDownloadFolderForCourse(course);
    const info = await FileSystem.getInfoAsync(folder);
    if (info.exists) {
      await FileSystem.deleteAsync(folder, { idempotent: true });
    }
  },

  async genDeleteFinishedDownloadsForCourse(course: Course) {
    await CourseData.genLoadCourseMetadata(course);
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

  async genDeleteFullCourseFolder(course: Course) {
    await DownloadManager.genDeleteAllDownloadsForCourse(course);
    await CourseData.clearCourseMetadata(course);
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

  stopAllDownloadsForCourse(course: Course) {
    Object.keys(downloads).forEach((downloadId) => {
      if (downloadId.startsWith(`${course}/`)) {
        DownloadManager.stopDownload(downloadId);
      }
    });
  },
};

export function useIsLessonDownloaded(course: Course, lesson: number) {
  const downloadId = DownloadManager.getDownloadId(course, lesson);
  const { data: downloaded } = useQuery({
    queryKey: ["@local", "downloads", downloadId, "is-downloaded"],
    queryFn: () => DownloadManager.genIsDownloaded(course, lesson),
  });
  return downloaded;
}

export const useDownloadStatus = (course: Course, lesson: number) => {
  const downloadId = DownloadManager.getDownloadId(course, lesson);
  const { data: snapshot } = useQuery({
    queryKey: ["@local", "downloads", downloadId, "status"],
    queryFn: () => {
      return downloads[downloadId] ?? null;
    },
  });
  return snapshot;
};

export default DownloadManager;
