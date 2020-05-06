import {useState, useEffect} from 'react';
import fs from 'react-native-fs';

import type {Course} from './course-data';
import CourseData from './course-data';
import Downloader from 'react-native-background-downloader';
import DownloadTask from 'react-native-background-downloader/lib/downloadTask';

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
    if (
      !(await fs.exists(DownloadManager.getDownloadFolderForCourse(course)))
    ) {
      await fs.mkdir(DownloadManager.getDownloadFolderForCourse(course));
    }

    DownloadManager.attachCallbacks(
      Downloader.download({
        id: DownloadManager.getDownloadId(course, lesson),
        url: CourseData.getLessonUrl(course, lesson),
        destination: DownloadManager.getDownloadStagingLocation(
          DownloadManager.getDownloadId(course, lesson),
        ),
        network: Downloader.Network.WIFI_ONLY, // TODO
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
        DownloadManager._downloads[downloadId].finished = true;
        await fs.moveFile(
          DownloadManager.getDownloadStagingLocation(downloadId),
          DownloadManager.getDownloadSaveLocation(downloadId),
        );
        DownloadManager._broadcast(downloadId);
      })
      .error((error) => {
        DownloadManager._downloads[downloadId].error = error;
        DownloadManager._broadcast(downloadId);
      });
  },

  _broadcast: (downloadId: string) => {
    // clone the object so it's not == old versions
    DownloadManager._downloads[downloadId] = {
      ...DownloadManager._downloads[downloadId],
    };
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
      DownloadManager.attachCallbacks(task);
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
