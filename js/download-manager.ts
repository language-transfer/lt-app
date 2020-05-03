import {useState, useEffect} from 'react';
import fs from 'react-native-fs';

import type {Course} from '../languageData';
import languageData from '../languageData';
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

  getLessonData: (course: Course, lesson: number): {url: string; id: string} =>
    languageData[course].meta.lessons[lesson],

  getDownloadId: (course: Course, lesson: number): string =>
    DownloadManager.getLessonData(course, lesson).id,

  getDownloadStagingLocation: (id: string): string => {
    return `${Downloader.directories.documents}/${id}.wav.download`; // TODO: hardcode wav?
  },

  getDownloadSaveLocation: (course: Course, lesson: number): string => {
    return `${Downloader.directories.documents}/${DownloadManager.getDownloadId(
      course,
      lesson,
    )}.wav`; // TODO: hardcode wav?
  },

  startDownload: (course: Course, lesson: number) => {
    const id = DownloadManager.getDownloadId(course, lesson);

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
      url: DownloadManager.getLessonData(course, lesson).url,
      destination: DownloadManager.getDownloadStagingLocation(
        DownloadManager.getDownloadId(course, lesson),
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
            DownloadManager.getDownloadId(course, lesson),
          ),
          DownloadManager.getDownloadSaveLocation(course, lesson),
        );
        DownloadManager._broadcast(id);
      })
      .error((error) => {
        DownloadManager._downloads[id].error = error;
        console.log(error);
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
};

export const useDownloadStatus = (course, lesson): DownloadProgress => {
  const [downloadProgress, setDownloadProgress] = useState(null);

  useEffect(() => {
    const downloadId = DownloadManager.getDownloadId(course, lesson);
    // not sure, but I think I need to make a new function inside useEffect
    const update = (progress) => {
      setDownloadProgress(progress);
    };

    DownloadManager.subscribeToDownloadUpdates(downloadId, update);
    return () => {
      DownloadManager.unsubscribeFromDownloadUpdates(downloadId, update);
    };
  });

  return downloadProgress;
};

export default DownloadManager;
