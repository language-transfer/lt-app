import {useState, useEffect} from 'react';
import fs from 'react-native-fs';

import type {Course} from './course-data';
import CourseData from './course-data';
import Downloader from 'react-native-background-downloader';
import DownloadTask from 'react-native-background-downloader/lib/downloadTask';
import {
  genProgressForLesson,
  genPreferenceDownloadQuality,
  genPreferenceDownloadOnlyOnWifi,
} from './persistence';
import {log} from './metrics';

export type DownloadProgress = {
  requested: boolean;
  totalBytes: number | null;
  bytesWritten: number;
  error: any;
  finished: boolean;
};

const DownloadManager = {
  _subscriptions: {},
  _downloads: {},

  // I know this is just a roundabout way of putting a slash back in but go with me here
  getCourseIdForDownloadId: (id: string): Course => {
    return id.split('/')[0] as Course;
  },

  getLessonIdForDownloadId: (id: string): string => {
    return id.split('/')[1];
  },

  getDownloadFolderForCourse: (course: Course): string => {
    return `${Downloader.directories.documents}/${course}`;
  },

  getDownloadSaveLocation: (downloadId: string): string => {
    return `${DownloadManager.getDownloadFolderForCourse(
      DownloadManager.getCourseIdForDownloadId(downloadId),
    )}/${DownloadManager.getLessonIdForDownloadId(downloadId)}.mp3`; // TODO: hardcode mp3?
  },

  getDownloadStagingLocation: (downloadId: string): string => {
    return DownloadManager.getDownloadSaveLocation(downloadId) + '.download';
  },

  getDownloadId: (course: Course, lesson: number): string => {
    return `${course}/${CourseData.getLessonId(course, lesson)}`;
  },

  startDownload: async (course: Course, lesson: number) => {
    log({
      action: 'start_download',
      surface: 'download_manager',
      course,
      lesson,
    });

    const [quality, wifiOnly] = await Promise.all([
      genPreferenceDownloadQuality(),
      genPreferenceDownloadOnlyOnWifi(),
    ]);

    // directory should exist, since the metadata is in there. if not, you really
    // need to have been creative to have screwed it up, so you deserve the app crashing
    DownloadManager.attachCallbacks(
      Downloader.download({
        id: DownloadManager.getDownloadId(course, lesson),
        url: CourseData.getLessonUrl(course, lesson, quality),
        destination: DownloadManager.getDownloadStagingLocation(
          DownloadManager.getDownloadId(course, lesson),
        ),
        network: wifiOnly
          ? Downloader.Network.WIFI_ONLY
          : Downloader.Network.ALL,
      }),
    );
  },

  attachCallbacks: (downloadTask: DownloadTask) => {
    const downloadId = downloadTask.id;

    DownloadManager._downloads[downloadId] = {
      requested: true,
      totalBytes: null,
      bytesWritten: 0,
      error: null,
      finished: false,
      downloadTask,
    };
    DownloadManager._broadcast(downloadId);

    downloadTask
      .begin((totalBytes) => {
        DownloadManager._downloads[downloadId].totalBytes = totalBytes;
        DownloadManager._broadcast(downloadId);
      })
      .progress((_, bytesWritten, totalBytes) => {
        DownloadManager._downloads[downloadId].bytesWritten = bytesWritten;
        DownloadManager._downloads[downloadId].totalBytes = totalBytes;
        DownloadManager._broadcast(downloadId);
      })
      .done(async () => {
        log({
          action: 'finish_download',
          surface: 'download_manager',
          course: DownloadManager.getCourseIdForDownloadId(downloadId),
          lesson: DownloadManager.getLessonIdForDownloadId(downloadId),
        });

        DownloadManager._downloads[downloadId].finished = true;
        await fs.moveFile(
          DownloadManager.getDownloadStagingLocation(downloadId),
          DownloadManager.getDownloadSaveLocation(downloadId),
        );
        DownloadManager._broadcast(downloadId);
      })
      .error((error) => {
        log({
          action: 'fail_download',
          surface: 'download_manager',
          course: DownloadManager.getCourseIdForDownloadId(downloadId),
          lesson: DownloadManager.getLessonIdForDownloadId(downloadId),
        });

        DownloadManager._downloads[downloadId].error = error;
        DownloadManager._broadcast(downloadId);
      });
  },

  _broadcast: (downloadId: string) => {
    // clone the object so it's not == old versions
    if (DownloadManager._downloads[downloadId]) {
      DownloadManager._downloads[downloadId] = {
        ...DownloadManager._downloads[downloadId],
      };
    }
    const subscriptions = DownloadManager._subscriptions[downloadId] || [];
    subscriptions.forEach((callback) =>
      callback(DownloadManager._downloads[downloadId]),
    );
  },

  subscribeToDownloadUpdates: (
    downloadId: string,
    callback /*: (number => any) */,
  ) => {
    if (!(downloadId in DownloadManager._subscriptions)) {
      DownloadManager._subscriptions[downloadId] = [];
    }

    DownloadManager._subscriptions[downloadId].push(callback);
  },

  unsubscribeFromDownloadUpdates: (downloadId: string, callback) => {
    const subscriptionArray = DownloadManager._subscriptions[downloadId];
    subscriptionArray.splice(subscriptionArray.indexOf(callback), 1);
  },

  genIsDownloaded: async (course: Course, lesson: number): Promise<boolean> => {
    return await fs.exists(
      DownloadManager.getDownloadSaveLocation(
        DownloadManager.getDownloadId(course, lesson),
      ),
    );
  },

  genDeleteDownload: async (course: Course, lesson: number): Promise<void> => {
    await fs.unlink(
      DownloadManager.getDownloadSaveLocation(
        DownloadManager.getDownloadId(course, lesson),
      ),
    );
  },

  resumeDownloads: async () => {
    const interrupted = await Downloader.checkForExistingDownloads();
    interrupted.forEach((task) => {
      log({
        action: 'resume_download',
        surface: 'download_manager',
        course: DownloadManager.getCourseIdForDownloadId(task.id),
        lesson: DownloadManager.getLessonIdForDownloadId(task.id),
      });
      DownloadManager.attachCallbacks(task);
    });
  },

  genDeleteAllDownloadsForCourse: async (course: Course): Promise<void> => {
    await Promise.all(
      CourseData.getLessonIndices(course).map((lesson) =>
        (async (lesson) => {
          if (await DownloadManager.genIsDownloaded(course, lesson)) {
            await DownloadManager.genDeleteDownload(course, lesson);
          }
        })(lesson),
      ),
    );
  },

  genDeleteFinishedDownloadsForCourse: async (
    course: Course,
  ): Promise<void> => {
    await Promise.all(
      CourseData.getLessonIndices(course).map((lesson) =>
        (async (lesson) => {
          if (
            (await genProgressForLesson(course, lesson)).finished &&
            (await DownloadManager.genIsDownloaded(course, lesson))
          ) {
            await DownloadManager.genDeleteDownload(course, lesson);
          }
        })(lesson),
      ),
    );
  },

  genDeleteFullCourseFolder: async (course: Course): Promise<void> => {
    await fs.unlink(DownloadManager.getDownloadFolderForCourse(course));
  },

  stopDownload: (downloadId: string): void => {
    DownloadManager._downloads[downloadId].downloadTask.stop();
    delete DownloadManager._downloads[downloadId];
    DownloadManager._broadcast(downloadId);
  },

  stopAllDownloadsForCourse: (course: Course): void => {
    Object.keys(DownloadManager._downloads).forEach((downloadId) => {
      if (DownloadManager.getCourseIdForDownloadId(downloadId) === course) {
        DownloadManager.stopDownload(downloadId);
      }
    });
  },
};

export const useDownloadStatus = (course, lesson): DownloadProgress => {
  const downloadId = DownloadManager.getDownloadId(course, lesson);

  const [downloadProgress, setDownloadProgress] = useState(
    DownloadManager._downloads[downloadId] || null,
  );

  useEffect(() => {
    // not sure, but I think I need to make a new function inside useEffect
    const update = (progress) => {
      setDownloadProgress(progress);
    };

    DownloadManager.subscribeToDownloadUpdates(downloadId, update);
    return () => {
      DownloadManager.unsubscribeFromDownloadUpdates(downloadId, update);
    };
  }, [downloadProgress]);

  return downloadProgress;
};

export default DownloadManager;
