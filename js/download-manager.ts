import {useState, useEffect} from 'react';
import fs from 'react-native-fs';

import type {Course} from './course-data';
import CourseData from './course-data';
import Downloader from 'react-native-background-downloader';

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

  getDownloadStagingLocation: (id: string): string => {
    return `${Downloader.directories.documents}/${id}.mp3.download`; // TODO: hardcode mp3?
  },

  getDownloadSaveLocation: (course: Course, lesson: number): string => {
    return `${Downloader.directories.documents}/${CourseData.getLessonId(
      course,
      lesson,
    )}.mp3`; // TODO: hardcode mp3?
  },

  startDownload: (course: Course, lesson: number) => {
    const id = CourseData.getLessonId(course, lesson);

    DownloadManager._downloads[id] = {
      requested: true,
      totalBytes: null,
      bytesWritten: 0,
      error: null,
      finished: false,
    };
    DownloadManager._broadcast(id);

    Downloader.download({
      id,
      url: CourseData.getLessonUrl(course, lesson),
      destination: DownloadManager.getDownloadStagingLocation(
        CourseData.getLessonId(course, lesson),
      ),
      network: Downloader.Network.WIFI_ONLY, // TODO
    })
      .begin((totalBytes) => {
        DownloadManager._downloads[id].totalBytes = totalBytes;
        DownloadManager._broadcast(id);
      })
      .progress((_, bytesWritten, totalBytes) => {
        DownloadManager._downloads[id].bytesWritten = bytesWritten;
        DownloadManager._downloads[id].totalBytes = totalBytes;
        DownloadManager._broadcast(id);
      })
      .done(async () => {
        DownloadManager._downloads[id].finished = true;
        await fs.moveFile(
          DownloadManager.getDownloadStagingLocation(
            CourseData.getLessonId(course, lesson),
          ),
          DownloadManager.getDownloadSaveLocation(course, lesson),
        );
        DownloadManager._broadcast(id);
      })
      .error((error) => {
        DownloadManager._downloads[id].error = error;
        DownloadManager._broadcast(id);
      });
  },

  _broadcast: (id: string) => {
    // clone the object so it's not == old versions
    DownloadManager._downloads[id] = {...DownloadManager._downloads[id]};
    const subscriptions = DownloadManager._subscriptions[id] || [];
    subscriptions.forEach((callback) =>
      callback(DownloadManager._downloads[id]),
    );
  },

  subscribeToDownloadUpdates: (id: string, callback /*: (number => any) */) => {
    if (!(id in DownloadManager._subscriptions)) {
      DownloadManager._subscriptions[id] = [];
    }

    DownloadManager._subscriptions[id].push(callback);
  },

  unsubscribeFromDownloadUpdates: (id: string, callback) => {
    const subscriptionArray = DownloadManager._subscriptions[id];
    subscriptionArray.splice(subscriptionArray.indexOf(callback), 1);
  },

  genIsDownloaded: async (course: Course, lesson: number): Promise<boolean> => {
    return await fs.exists(
      DownloadManager.getDownloadSaveLocation(course, lesson),
    );
  },

  genDeleteDownload: async (course: Course, lesson: number): Promise<void> => {
    await fs.unlink(DownloadManager.getDownloadSaveLocation(course, lesson));
  },
};

export const useDownloadStatus = (course, lesson): DownloadProgress => {
  const downloadId = CourseData.getLessonId(course, lesson);

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
