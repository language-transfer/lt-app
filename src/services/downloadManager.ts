// import * as FileSystem from "expo-file-system/legacy";
import { File } from "expo-file-system";
import * as Network from "expo-network";

import CourseData, { getCASObjectURL } from "@/src/data/courseData";
import {
  genPreferenceDownloadOnlyOnWifi,
  genPreferenceDownloadQuality,
  usePreferenceQuery,
} from "@/src/storage/persistence";
import type {
  CourseName,
  DownloadSnapshot,
  FilePointer,
  Quality,
} from "@/src/types";
import { useQueries, useQuery } from "@tanstack/react-query";
import { queryClient } from "../data/queryClient";
import { createAsyncStorage } from "@react-native-async-storage/async-storage";

const downloadIntentAsyncStorage = createAsyncStorage("@download-intent");

type InternalDownload = DownloadSnapshot & {
  resumable?: FileSystem.DownloadResumable;
  stagingPath?: string;
};

const downloads: Record<string, InternalDownload> = {};

const DOCUMENT_DIRECTORY =
  (FileSystem as any).documentDirectory ??
  (FileSystem as any).cacheDirectory ??
  "";
export const OBJECT_STORAGE_DIR = `${DOCUMENT_DIRECTORY}objects`;
const STAGING_DIR = `${DOCUMENT_DIRECTORY}staging`;

// sweep: remove STAGING_DIR if saved async not found
// remove all objects not referenced recursively by the index

const resolvedDownloadPaths: Record<string, string | undefined> = {};

// const resolveDownloadPath = async (
//   downloadId: string
// ): Promise<{ path: string; exists: boolean }> => {
//   const primary = downloadPath(downloadId);
//   const primaryInfo = await FileSystem.getInfoAsync(primary);
//   if (primaryInfo.exists) {
//     resolvedDownloadPaths[downloadId] = primary;
//     return { path: primary, exists: true };
//   }

//   resolvedDownloadPaths[downloadId] = primary;
//   return { path: primary, exists: false };
// };

// TODO consider replacing this with a 'status' that consumers need to think about
const isDownloaded = async (filePointer: FilePointer): Promise<boolean> => {
  const downloadPath = getLocalObjectPath(filePointer);
  const fileInfo = await FileSystem.getInfoAsync(downloadPath);
  return fileInfo.exists;
};

// TODO: maybe nest the query key? don't use download IDs?
const invalidate = (filePointer: FilePointer) => {
  queryClient.invalidateQueries({
    queryKey: ["@local", "downloads", filePointer],
  });
  // const [course] = getCourseAndLesson(downloadId);
  // queryClient.invalidateQueries({
  //   queryKey: ["@local", "downloads", course, "count"],
  // });
};

const stagingPath = (filePointer: FilePointer) =>
  `${STAGING_DIR}/${filePointer.object}.download`;

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

// const snapshots = new Map<string, FileSystem.DownloadResumable>();

const syncDownloadIntent = async () => {
  const allIntents = await downloadIntentAsyncStorage.getAllKeys();
};

const startResumableDownload = async (
  filePointer: FilePointer
): Promise<FileSystem.DownloadResumable> => {
  const destination = stagingPath(filePointer);
  const url = await getCASObjectURL(filePointer);

  const filePromise = File.downloadFileAsync(url, new File(destination), {
    idempotent: true,
  })
    .catch((err) => {
      handleError(filePointer, err as Error);
      throw err;
    })
    .then((result) => {
      if (result.status !== 200) {
        const error = new Error(
          `Download failed with status code ${result.status}`
        );
        handleError(filePointer, error);
        throw error;
      }
      return result;
    });
  // , (progress) => {
  //   const total = progress.totalBytesExpectedToWrite ?? 0;
  //   trackProgress(downloadId, total, progress.totalBytesWritten);
  // });

  return filePromise;
};

const startDownloadInternal = async (filePointer: FilePointer) => {
  // const existing = snapshots.get(downloadId);
  // if (existing) {
  //   return existing;
  // }

  const resumable = await startResumableDownload(filePointer);
  // snapshots.set(downloadId, resumable);
  const snap = snapshotFor(downloadId);
  snap.state = "downloading";
  snap.requested = true;
  snap.stagingPath = stagingPath(downloadId);
  invalidate(filePointer);

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

export const getLocalObjectPath = (pointer: FilePointer): string => {
  const objectHash = pointer.object;
  const prefix = objectHash.substring(0, 2);
  const rest = objectHash.substring(2);

  return `${OBJECT_STORAGE_DIR}/${prefix}/${rest}`;
};

export const ensureRootObjectDir = async () => {
  const info = await FileSystem.getInfoAsync(OBJECT_STORAGE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(OBJECT_STORAGE_DIR, {
      intermediates: true,
    });
  }
};

export const ensureObjectDir = async (pointer: FilePointer): Promise<void> => {
  await ensureRootObjectDir();
  const localPath = getLocalObjectPath(pointer);
  const dirPath = localPath.substring(0, localPath.lastIndexOf("/"));
  await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
};

const DownloadManager = {
  async startDownload(filePointer: FilePointer) {
    const wifiOnly = await genPreferenceDownloadOnlyOnWifi();

    if (wifiOnly) {
      const net = await Network.getNetworkStateAsync();
      if (net.type !== Network.NetworkStateType.WIFI) {
        throw new Error("Wi-Fi connection required to download");
      }
    }

    await startDownloadInternal(filePointer);
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

  // async genDeleteAllDownloadsForCourse(course: CourseName) {
  //   const folder = DownloadManager.getDownloadFolderForCourse(course);
  //   const info = await FileSystem.getInfoAsync(folder);
  //   if (info.exists) {
  //     await FileSystem.deleteAsync(folder, { idempotent: true });
  //     Object.keys(resolvedDownloadPaths).forEach((downloadId) => {
  //       if (downloadId.startsWith(`${course}/`)) {
  //         delete resolvedDownloadPaths[downloadId];
  //       }
  //     });
  //   }
  // },

  // async genDeleteFinishedDownloadsForCourse(course: CourseName) {
  //   await CourseData.loadCourseMetadata(course);
  //   const lessons = CourseData.getLessonIndices(course);
  //   await Promise.all(
  //     lessons.map(async (lesson) => {
  //       const progress = await genProgressForLesson(course, lesson);
  //       if (progress?.finished) {
  //         await DownloadManager.genDeleteDownload(course, lesson);
  //       }
  //     })
  //   );
  // },

  stopDownload(filePointer: FilePointer) {
    // const task = snapshots.get(downloadId);
    // if (task) {
    //   task.pauseAsync().catch(() => {});
    //   snapshots.delete(downloadId);
    // }

    const snap = snapshotFor(downloadId);
    snap.state = "idle";
    snap.bytesWritten = 0;
    snap.totalBytes = null;
    invalidate(downloadId);

    FileSystem.deleteAsync(stagingPath(downloadId), { idempotent: true }).catch(
      () => {}
    );
  },

  // stopAllDownloadsForCourse(course: CourseName) {
  //   Object.keys(downloads).forEach((downloadId) => {
  //     if (downloadId.startsWith(`${course}/`)) {
  //       DownloadManager.stopDownload(downloadId);
  //     }
  //   });
  // },
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

const getLessonIndicesAsync = async (course: CourseName): Promise<number[]> => {
  // future proofing our hook for when this function gets colored
  return CourseData.getLessonIndices(course);
};

const getLessonPointerAsync = async (
  course: CourseName,
  lesson: number,
  quality: Quality
): Promise<FilePointer> => {
  return CourseData.getLessonPointer(course, lesson, quality);
};

const useLessonObjectPointersForCourse = (course: CourseName) => {
  const downloadQualityQuery = usePreferenceQuery<"high" | "low">(
    "download-quality",
    "high"
  );

  return useQuery({
    queryKey: [
      "@local",
      "downloads",
      course,
      "lesson-pointers",
      downloadQualityQuery,
    ],
    queryFn: async () => {
      const { data: downloadQuality } = downloadQualityQuery;

      if (downloadQuality === null) {
        return null;
      }

      // TODO possibly extract this into a hook
      const lessonIndices = await getLessonIndicesAsync(course);

      return await Promise.all(
        lessonIndices.map((lesson) =>
          getLessonPointerAsync(course, lesson, downloadQuality!)
        )
      );
    },
  });
};

export function useDownloadCount(course: CourseName) {
  const lessonPointers = useLessonObjectPointersForCourse(course);
  const queries = useQueries({
    queries: (lessonPointers.data ?? []).map((pointer) => ({
      queryKey: ["@local", "downloads", pointer.object, "is-downloaded"],
      queryFn: async () => {
        const exists = await isDownloaded(pointer);
        return exists;
      },
    })),
  });

  const allComplete =
    lessonPointers.data !== null && queries.every((q) => q.isSuccess);
  if (!allComplete) {
    return null;
  }

  return queries.filter((q) => q.data).length;
}

export const CourseDownloadManager = {
  async startDownload(course: CourseName, lesson: number) {
    const quality = await genPreferenceDownloadQuality();
    const pointer = CourseData.getLessonPointer(course, lesson, quality);

    return await DownloadManager.startDownload(pointer);
  },
};

export default DownloadManager;
