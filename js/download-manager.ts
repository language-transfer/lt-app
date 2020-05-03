import {useState, useEffect} from 'react';
import type {Course} from '../languageData';
import languageData from '../languageData';
import Downloader from 'react-native-background-downloader';

const DownloadManager = {
  _subscriptions: {},
  _downloads: {},

  getLessonData: (course: Course, lesson: number): {url: string; id: string} =>
    languageData[course].meta.lessons[lesson],

  getDownloadId: (course: Course, lesson: number): string =>
    DownloadManager.getLessonData(course, lesson).id,

  getDownloadSaveLocation: (course: Course, lesson: number): string => {
    return `${Downloader.directories.documents}/${DownloadManager.getDownloadId(
      course,
      lesson,
    )}.mp3`; // TODO: hardcode mp3?
  },

  startDownload: (course: Course, lesson: number) => {
    const id = DownloadManager.getDownloadId(course, lesson);

    Downloader.download({
      id,
      url: DownloadManager.getLessonData(course, lesson).url,
      destination: DownloadManager.getDownloadSaveLocation(course, lesson),
      network: Downloader.Network.WIFI_ONLY, // TODO
    })
      .begin((totalBytes) => {
        DownloadManager._downloads[id] = {
          totalBytes,
          bytesWritten: 0,
          finished: false,
        };
        DownloadManager._broadcast(id);
      })
      .progress((_, bytesWritten, totalBytes) => {
        DownloadManager._downloads[id].bytesWritten = bytesWritten;
        DownloadManager._downloads[id].totalBytes = totalBytes;
        DownloadManager._broadcast(id);
      })
      .done(() => {
        DownloadManager._downloads[id].finished = true;
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
};

export const useDownloadStatus = (course, lesson) => {
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
