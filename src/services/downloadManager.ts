// import * as FileSystem from "expo-file-system/legacy";
import { Directory, File, Paths } from "expo-file-system";
import * as Network from "expo-network";

import CourseData, {
  getCASObjectURL,
  LoadedObjectMetadata,
} from "@/src/data/courseData";
import {
  getPreferenceDownloadOnlyOnWifi,
  getPreferenceDownloadQuality,
  getProgressForLesson,
  usePreferenceDownloadQuality,
} from "@/src/storage/persistence";
import type { CourseName, FilePointer, Quality } from "@/src/types";
import { log } from "@/src/utils/log";
import { createAsyncStorage } from "@react-native-async-storage/async-storage";
import { useQueries, useQuery } from "@tanstack/react-query";
import PQueue from "p-queue";
import { ObjectPointer } from "../data/courseSchemas";
import { queryClient } from "../data/queryClient";

const downloadIntentAsyncStorage = createAsyncStorage("@download-intent");

const DOCUMENT_DIRECTORY = Paths.document?.uri ?? Paths.cache?.uri ?? "";
export const OBJECT_STORAGE_DIR = `${DOCUMENT_DIRECTORY}objects`;
const STAGING_DIR = `${DOCUMENT_DIRECTORY}staging`;

// sweep: remove STAGING_DIR if saved async not found
// remove all objects not referenced recursively by the index

const resolvedDownloadPaths: Record<string, string | undefined> = {};

const downloadQueue = new PQueue({ concurrency: 3 });
const pendingSet = new Set<string>();

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
  });
};

const stagingPath = (filePointer: ObjectPointer) =>
  `${STAGING_DIR}/${filePointer.object}.download`;

// const snapshots = new Map<string, FileSystem.DownloadResumable>();

// TODO see if we can get away with just using staging for this
const inMemoryInProgressDownloads = new Set<string>();
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
  return inMemoryInProgressDownloads.has(filePointer.object);
};

const hasObject = (filePointer: ObjectPointer): boolean => {
  const localPath = getLocalObjectPath(filePointer);
  const file = new File(localPath);
  return file.exists;
};

// this has to happen after we've filtered down to loaded objects
// -- we can't just return 0 for non-loaded objects because the comparator
// would be intransitive
const sortFilteredIntents = async (objects: LoadedObjectMetadata[]) => {
  return objects.sort((a, b) => {
    try {
      // sigh, i dunno, this is a little awkward. the idea was to avoid requiring course meta info in this file
      // which is why we use object pointers everywhere. but here it seems to make sense..
      // ultimately the sorting is a convenience feature, not a correctness feature, so maybe breaking the abstraction
      // boundary is fine.
      return a.lessonIndex - b.lessonIndex;
    } catch (e) {
      console.warn("Error sorting download intents", a, b, e);
      return 0;
    }
  });
};

const syncDownloadIntent = async () => {
  const allObjectIds = await downloadIntentAsyncStorage.getAllKeys();

  const needsStart = allObjectIds
    .filter((objectId) => {
      // hm, possible race condition here? not async though. mv should be atomic
      return (
        !hasObject({ object: objectId }) &&
        !isObjectDownloading({ object: objectId })
      );
    })
    .map((objectId) => {
      try {
        return CourseData.getLoadedObjectMetadata(objectId);
      } catch (e) {
        console.warn("Error loading metadata for object", objectId, e);
        return null;
      }
    })
    .filter((object) => object !== null);

  sortFilteredIntents(needsStart);

  // console.log({ needsStart });

  for (const metadata of needsStart) {
    // only enqueue if we haven't already..!
    if (!pendingSet.has(metadata.pointer.object)) {
      pendingSet.add(metadata.pointer.object);
      downloadQueue.add(() => _download(metadata.pointer));
    }
  }

  needsStart.forEach((metadata) => {
    // status is now enqueued (or possibly just immediately downloading?)
    invalidate(metadata.pointer);
  });

  downloadQueue.onIdle().then(async () => {
    // TODO - schedule this idempotently? maybe a race if it's running while a new track gets enqueued?
    await scrubDownloads();
  });
};

CourseData.loadAllLocallyDownloadedCourseMetadata()
  .then(() => syncDownloadIntent())
  .then();

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

const isObjectRequested = async (filePointer: FilePointer) => {
  const intended = await downloadIntentAsyncStorage.getItem(filePointer.object);
  return Boolean(intended);
};

// todo check what happens if cleanup happens while downloading

const _download = async (filePointer: FilePointer) => {
  const deleted = pendingSet.delete(filePointer.object);
  inMemoryInProgressDownloads.add(filePointer.object);
  if (!(await isObjectRequested(filePointer))) {
    // we add before the async call to prevent a race with invalidation
    inMemoryInProgressDownloads.delete(filePointer.object);
    return;
  }

  console.log(filePointer, { deleted });

  invalidate(filePointer);

  const stagingDestination = stagingPath(filePointer);
  const url = await getCASObjectURL(filePointer);
  const destinationDir = new Directory(
    getLocalObjectContainingDir(filePointer)
  );

  // await new Promise((resolve) => setTimeout(resolve, 60_000));

  return await File.downloadFileAsync(url, new File(stagingDestination), {
    // idempotent: true, // nah we should probably throw
  })
    .catch(async (err) => {
      try {
        const metadata = CourseData.getLoadedObjectMetadata(filePointer.object);
        log({
          action: "fail_download",
          surface: "download_manager",
          course: metadata.course,
          lesson: metadata.lessonIndex,
        }).then();
      } catch {
        // ignore missing metadata
      }
      // TODO
      console.warn("Download failed for", filePointer.object, err);
      const stagingFile = new File(stagingDestination);
      if (stagingFile.exists) {
        stagingFile.delete();
      }
      inMemoryInProgressDownloads.delete(filePointer.object);
      await DownloadManager.unrequestDownload(filePointer);
      invalidate(filePointer);
      throw err;
    })
    .then(async () => {
      const stagingFile = new File(stagingDestination);
      // console.log("Download complete for", filePointer.object);

      destinationDir.create({ intermediates: true, idempotent: true });
      stagingFile.move(new File(getLocalObjectPath(filePointer)));
      inMemoryInProgressDownloads.delete(filePointer.object);
      invalidate(filePointer);

      try {
        const metadata = CourseData.getLoadedObjectMetadata(filePointer.object);
        log({
          action: "finish_download",
          surface: "download_manager",
          course: metadata.course,
          lesson: metadata.lessonIndex,
        }).then();
      } catch {
        // ignore missing metadata
      }

      if (!(await isObjectRequested(filePointer))) {
        // there's probably a race condition somewhere still, but this will
        // help sync in case the object was unrequested while downloading
        syncDownloadIntent().then();
      }
    });
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

export type DownloadStatus =
  | "not-downloaded"
  | "enqueued"
  | "downloading"
  | "downloaded";

const DownloadManager = {
  async requestDownloads(filePointers: FilePointer[]) {
    // console.log("Requesting download for", filePointer.object);

    // TODO: move this logic to the enqueue, add a warning if we have enqueued downloads
    // and this setting is blocking
    const wifiOnly = await getPreferenceDownloadOnlyOnWifi();

    if (wifiOnly) {
      const net = await Network.getNetworkStateAsync();
      if (net.type !== Network.NetworkStateType.WIFI) {
        throw new Error("Wi-Fi connection required to download");
      }
    }

    await Promise.all(
      filePointers.map(async (pointer) => {
        await downloadIntentAsyncStorage.setItem(pointer.object, "1");
      })
    );

    await syncDownloadIntent();
  },

  async requestDownload(filePointer: FilePointer) {
    return await DownloadManager.requestDownloads([filePointer]);
  },

  async unrequestDownload(filePointer: FilePointer) {
    await DownloadManager.unrequestDownloads([filePointer]);
  },

  async unrequestDownloads(filePointers: FilePointer[]) {
    await Promise.all(
      filePointers.map((pointer) =>
        downloadIntentAsyncStorage.removeItem(pointer.object)
      )
    );
    await syncDownloadIntent();
  },

  async getDownloadStatus(filePointer: FilePointer): Promise<DownloadStatus> {
    const isEnqueued = pendingSet.has(filePointer.object);
    const isDownloading = isObjectDownloading(filePointer);
    const has = hasObject(filePointer);

    if (has) {
      return "downloaded";
    } else if (isDownloading) {
      return "downloading";
    } else if (isEnqueued) {
      return "enqueued";
    } else {
      return "not-downloaded";
    }
  },
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
  const downloadQuality = usePreferenceDownloadQuality();

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
  const downloadQuality = usePreferenceDownloadQuality();

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
      return await DownloadManager.getDownloadStatus(objectPointer);
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
        const status = await DownloadManager.getDownloadStatus(pointer);
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
  async requestDownloads(course: CourseName, lessons: number[]) {
    const quality = await getPreferenceDownloadQuality();
    const pointers = lessons.map((lesson) =>
      CourseData.getLessonPointer(course, lesson, quality)
    );

    lessons.forEach((lesson) => {
      log({
        action: "start_download",
        surface: "download_manager",
        course,
        lesson,
      }).then();
    });

    return await DownloadManager.requestDownloads(pointers);
  },

  async requestDownload(course: CourseName, lesson: number) {
    return await CourseDownloadManager.requestDownloads(course, [lesson]);
  },

  async unrequestDownload(course: CourseName, lesson: number) {
    const quality = await getPreferenceDownloadQuality();
    // TODO: all quality? TODO: what do when change request quality? maybe keep the old intents?
    const pointer = CourseData.getLessonPointer(course, lesson, quality);

    return await DownloadManager.unrequestDownload(pointer);
  },

  async getDownloadStatus(
    course: CourseName,
    lesson: number
  ): Promise<DownloadStatus> {
    const quality = await getPreferenceDownloadQuality();
    const pointer = CourseData.getLessonPointer(course, lesson, quality);

    return await DownloadManager.getDownloadStatus(pointer);
  },

  async getLessonPointer(
    course: CourseName,
    lesson: number
  ): Promise<FilePointer> {
    const quality = await getPreferenceDownloadQuality();
    return CourseData.getLessonPointer(course, lesson, quality);
  },

  async unrequestAllDownloadsForCourse(course: CourseName) {
    const lessonIndices = CourseData.getLessonIndices(course);

    const allPointers = lessonIndices.flatMap((lesson) =>
      CourseData.getLessonPointersAllVariants(course, lesson)
    );
    if (allPointers.length > 0) {
      await DownloadManager.unrequestDownloads(allPointers);
    }
  },

  async unrequestAllFinishedDownloadsForCourse(course: CourseName) {
    await CourseData.loadCourseMetadata(course);
    const lessons = CourseData.getLessonIndices(course);
    const finishedPointers: FilePointer[] = [];
    await Promise.all(
      lessons.map(async (lesson) => {
        const progress = await getProgressForLesson(course, lesson);
        if (progress?.finished) {
          const pointers = CourseData.getLessonPointersAllVariants(
            course,
            lesson
          );
          finishedPointers.push(...pointers);
        }
      })
    );
    if (finishedPointers.length > 0) {
      await DownloadManager.unrequestDownloads(finishedPointers);
    }
  },
};

export default DownloadManager;
