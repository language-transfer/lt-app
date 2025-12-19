// import * as FileSystem from "expo-file-system/legacy";
import { Directory, File, Paths } from "expo-file-system";
import * as Network from "expo-network";

import CourseData, { getCASObjectURL } from "@/src/data/courseData";
import {
  genPreferenceDownloadOnlyOnWifi,
  genPreferenceDownloadQuality,
  usePreferenceQuery,
} from "@/src/storage/persistence";
import type { CourseName, FilePointer, Quality } from "@/src/types";
import { createAsyncStorage } from "@react-native-async-storage/async-storage";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ObjectPointer } from "../data/courseSchemas";
import { queryClient } from "../data/queryClient";

const downloadIntentAsyncStorage = createAsyncStorage("@download-intent");

const DOCUMENT_DIRECTORY = Paths.document?.uri ?? Paths.cache?.uri ?? "";
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

const invalidate = (filePointer: ObjectPointer) => {
  // console.log("Invalidating:", ["@local", "downloads", filePointer.object]);
  queryClient.invalidateQueries({
    queryKey: ["@local", "downloads", filePointer.object],
    refetchType: "all",
  });
};

const stagingPath = (filePointer: ObjectPointer) =>
  `${STAGING_DIR}/${filePointer.object}.download`;

// const snapshots = new Map<string, FileSystem.DownloadResumable>();

// TODO see if we can get away with just using staging for this
const inMemoryPendingDownloads = new Set<string>();
let stagingDirCleaned = false;

const cleanUpStagingDir = async () => {
  // delete all files inside staging dir at app start
  if (stagingDirCleaned) {
    return;
  }

  const directory = new Directory(STAGING_DIR);
  if (directory.exists) {
    directory.delete();
  }
  directory.create();
  stagingDirCleaned = true;
};

cleanUpStagingDir();

const isObjectDownloading = (filePointer: ObjectPointer): boolean => {
  return inMemoryPendingDownloads.has(filePointer.object);
};

const hasObject = (filePointer: ObjectPointer): boolean => {
  const localPath = getLocalObjectPath(filePointer);
  const file = new File(localPath);
  return file.exists;
};

const syncDownloadIntent = async () => {
  const allIntents = await downloadIntentAsyncStorage.getAllKeys();

  const needsStart = allIntents
    .filter((object) => {
      // hm, possible race condition here? not async though. mv should be atomic
      return !hasObject({ object }) && !isObjectDownloading({ object });
    })
    .map((object) => {
      try {
        return CourseData.getLoadedObjectMetadata(object);
      } catch (e) {
        console.warn("Error loading metadata for object", object, e);
        return null;
      }
    })
    .filter((object) => object !== null);

  // console.log({ needsStart });

  await Promise.all(
    needsStart.map((metadata) => {
      return _enqueueDownload(metadata.pointer);
    })
  );

  await scrubDownloads();
};

// scrub downloads that are known (i.e., in the local index) but not
// in the download intent list
const scrubDownloads = async () => {
  const allLoadedObjectIds = CourseData.getAllLoadedObjectIds();
  await Promise.all(
    allLoadedObjectIds.map(async (objectId) => {
      try {
        const intended = await downloadIntentAsyncStorage.getItem(objectId);
        if (intended) return;

        const pointer: ObjectPointer = { object: objectId };
        const has = hasObject(pointer);
        if (!has) return;

        const localPath = getLocalObjectPath(pointer);
        const file = new File(localPath);
        file.delete();
        invalidate(pointer);
      } catch (e) {
        console.warn("Error scrubbing download for object", objectId, e);
      }
    })
  );
};

// TODO: scrub objects that are *not* known: they are not mentioned
// anywhere, recursively in the metadata hierarchy from all-courses.json
// and are orphans
// TODO also scrub intent entries that don't correspond to known objects
const scrubObjects = async () => {};

// todo check what happens if cleanup happens while downloading

// todo -- for now we just download right away. enqueue instead!
const _enqueueDownload = async (filePointer: FilePointer) => {
  inMemoryPendingDownloads.add(filePointer.object);

  invalidate(filePointer);

  const stagingDestination = stagingPath(filePointer);
  const url = await getCASObjectURL(filePointer);
  const destinationDir = new Directory(
    getLocalObjectContainingDir(filePointer)
  );

  const filePromise = File.downloadFileAsync(
    url,
    new File(stagingDestination),
    {
      // idempotent: true, // nah we should probably throw
    }
  )
    .catch((err) => {
      // TODO
      console.warn("Download failed for", filePointer.object, err);
      const stagingFile = new File(stagingDestination);
      if (stagingFile.exists) {
        stagingFile.delete();
      }
      inMemoryPendingDownloads.delete(filePointer.object);
      invalidate(filePointer);
      throw err;
    })
    .then(() => {
      const stagingFile = new File(stagingDestination);
      // console.log("Download complete for", filePointer.object);

      destinationDir.create({ intermediates: true, idempotent: true });
      stagingFile.move(new File(getLocalObjectPath(filePointer)));
      inMemoryPendingDownloads.delete(filePointer.object);
      invalidate(filePointer);
    });
  // , (progress) => {
  //   const total = progress.totalBytesExpectedToWrite ?? 0;
  //   trackProgress(downloadId, total, progress.totalBytesWritten);
  // });

  return filePromise;
};

const getLocalObjectContainingDir = (pointer: ObjectPointer): string => {
  const objectHash = pointer.object;
  const prefix = objectHash.substring(0, 2);
  return `${OBJECT_STORAGE_DIR}/${prefix}`;
};

export const getLocalObjectPath = (pointer: ObjectPointer): string => {
  const objectHash = pointer.object;
  const containingDir = getLocalObjectContainingDir(pointer);
  const rest = objectHash.substring(2);

  return `${containingDir}/${rest}`;
};

export const ensureRootObjectDir = async () => {
  const dir = new Directory(OBJECT_STORAGE_DIR);
  dir.create({ idempotent: true, intermediates: true });
};

export const ensureObjectDir = async (pointer: FilePointer): Promise<void> => {
  await ensureRootObjectDir();
  const dirPath = getLocalObjectContainingDir(pointer);
  const dir = new Directory(dirPath);
  dir.create({ idempotent: true, intermediates: true });
};

const DownloadManager = {
  async requestDownload(filePointer: FilePointer) {
    // console.log("Requesting download for", filePointer.object);

    // TODO: move this logic to the enqueue
    const wifiOnly = await genPreferenceDownloadOnlyOnWifi();

    if (wifiOnly) {
      const net = await Network.getNetworkStateAsync();
      if (net.type !== Network.NetworkStateType.WIFI) {
        throw new Error("Wi-Fi connection required to download");
      }
    }

    // TODO: avoid n^2
    await downloadIntentAsyncStorage.setItem(filePointer.object, "1");
    await syncDownloadIntent();
  },

  async unrequestDownload(filePointer: FilePointer) {
    await downloadIntentAsyncStorage.removeItem(filePointer.object);
    await syncDownloadIntent();
  },

  async downloadStatus(
    filePointer: FilePointer
  ): Promise<"not-downloaded" | "downloading" | "downloaded"> {
    const isDownloading = isObjectDownloading(filePointer);
    const has = hasObject(filePointer);

    if (has) {
      return "downloaded";
    } else if (isDownloading) {
      return "downloading";
    } else {
      return "not-downloaded";
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
  const downloadQuality = downloadQualityQuery.data;

  return useQuery({
    queryKey: [
      "@local",
      "downloads",
      course,
      "lesson-pointers",
      downloadQuality,
    ],
    queryFn: async () => {
      if (!downloadQuality) {
        return null;
      }

      // TODO possibly extract this into a hook
      const lessonIndices = await getLessonIndicesAsync(course);

      return await Promise.all(
        lessonIndices.map((lesson) =>
          getLessonPointerAsync(course, lesson, downloadQuality)
        )
      );
    },
  });
};

const useLessonObjectPointer = (course: CourseName, lesson: number) => {
  const downloadQualityQuery = usePreferenceQuery<"high" | "low">(
    "download-quality",
    "high"
  );
  const downloadQuality = downloadQualityQuery.data;

  return useQuery({
    queryKey: [
      "@local",
      "downloads",
      course,
      lesson,
      "lesson-pointer",
      downloadQuality,
    ],
    queryFn: async () => {
      if (!downloadQuality) {
        return null;
      }

      return await getLessonPointerAsync(course, lesson, downloadQuality);
    },
  });
};

// todo verify that this is working offline
export function useLessonDownloadStatus(course: CourseName, lesson: number) {
  const { data: objectPointer } = useLessonObjectPointer(course, lesson);
  // console.log("useLessonDownloadStatus for", course, lesson, objectPointer, [
  //   "@local",
  //   "downloads",
  //   objectPointer?.object,
  //   "status",
  // ]);
  const query = useQuery({
    queryKey: ["@local", "downloads", objectPointer?.object, "status"],
    queryFn: async () => {
      // console.log("Fetching download status for", course, lesson);
      if (!objectPointer) {
        return "not-downloaded";
      }
      // console.log("Fetching download status for pointer", objectPointer);
      return await DownloadManager.downloadStatus(objectPointer);
    },
  });
  return query.data;
}

export function useDownloadCount(course: CourseName) {
  const lessonPointers = useLessonObjectPointersForCourse(course);
  const queries = useQueries({
    queries: (lessonPointers.data ?? []).map((pointer) => ({
      queryKey: ["@local", "downloads", pointer.object, "is-downloaded"],
      queryFn: async () => {
        const status = await DownloadManager.downloadStatus(pointer);
        return status === "downloaded";
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
  async requestDownload(course: CourseName, lesson: number) {
    const quality = await genPreferenceDownloadQuality();
    const pointer = CourseData.getLessonPointer(course, lesson, quality);

    return await DownloadManager.requestDownload(pointer);
  },

  async unrequestDownload(course: CourseName, lesson: number) {
    const quality = await genPreferenceDownloadQuality();
    // TODO: all quality? TODO: what do when change request quality? maybe keep the old intents?
    const pointer = CourseData.getLessonPointer(course, lesson, quality);

    return await DownloadManager.unrequestDownload(pointer);
  },

  async getDownloadStatus(
    course: CourseName,
    lesson: number
  ): Promise<"not-downloaded" | "downloading" | "downloaded"> {
    const quality = await genPreferenceDownloadQuality();
    const pointer = CourseData.getLessonPointer(course, lesson, quality);

    return await DownloadManager.downloadStatus(pointer);
  },
};

export default DownloadManager;
