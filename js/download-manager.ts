import {useState, useEffect} from 'react';
import {Alert, Image} from 'react-native';
import fs from 'react-native-fs';
import CourseData from './course-data';
import DeviceInfo from 'react-native-device-info';
import Downloader, {DownloadTask} from 'react-native-background-downloader';
import {
  genProgressForLesson,
  genPreferenceDownloadQuality,
  genPreferenceDownloadOnlyOnWifi,
  genPreferenceIsFirstLoad,
  genSetPreferenceIsFirstLoad,
} from './persistence';
import {log} from './metrics';

const DownloadManager = {
  _subscriptions: {} as {[key: string]: ((download: Download) => any)[]},
  _downloads: {} as {[key: string]: Download},

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
        // `network` really is a property, as per docs
        // @ts-ignore
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

        // doesn't check in-progress downloads, but hey, it's a start
        DeviceInfo.getFreeDiskStorage().then((freeDiskStorage) => {
          if (totalBytes > freeDiskStorage) {
            Alert.alert(
              "You don't have enough storage space on your phone to download this lesson.",
            );
            DownloadManager.stopDownload(downloadId);
          }
        });
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
    callback: (download: Download) => any,
  ) => {
    if (!(downloadId in DownloadManager._subscriptions)) {
      DownloadManager._subscriptions[downloadId] = [];
    }

    DownloadManager._subscriptions[downloadId].push(callback);
  },

  unsubscribeFromDownloadUpdates: (downloadId: string, callback: (download: Download) => any) => {
    const subscriptionArray = DownloadManager._subscriptions[downloadId];
    subscriptionArray.splice(subscriptionArray.indexOf(callback), 1);
  },

  genIsDownloadedForDownloadId: async (
    downloadId: string,
  ): Promise<boolean> => {
    return await fs.exists(DownloadManager.getDownloadSaveLocation(downloadId));
  },

  genIsDownloaded: async (course: Course, lesson: number): Promise<boolean> => {
    return await DownloadManager.genIsDownloadedForDownloadId(
      DownloadManager.getDownloadId(course, lesson),
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
        (async (lessonInput) => {
          if (await DownloadManager.genIsDownloaded(course, lessonInput)) {
            await DownloadManager.genDeleteDownload(course, lessonInput);
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
        (async (lessonInput) => {
          if (
            (await genProgressForLesson(course, lessonInput))!.finished &&
            (await DownloadManager.genIsDownloaded(course, lessonInput))
          ) {
            await DownloadManager.genDeleteDownload(course, lessonInput);
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

  copyBundledTracksIfNotPresent: async (): Promise<void> => {
    // this code runs every time on startup and copies the bundled tracks in iOS
    // into the course downloads.
    // this is so rntp can load bundled tracks from the local filesystem like other tracks
    // instead of having to load them from within the app bundle
    for (const course of CourseData.getCourseList()) {
      // first, check to see if the lesson is bundled
      // this will always return false on Android since courses are not bundled
      if (CourseData.getBundledFirstLesson(course) === null) continue;
      // if it is, check to see if it's already downloaded
      if (await DownloadManager.genIsDownloadedForDownloadId(CourseData.getBundledFirstLessonId(course))) continue;

      // if the course isn't downloaded yet, download it
      const localUrl = Image.resolveAssetSource(CourseData.getBundledFirstLesson(course)).uri;
      DownloadManager.attachCallbacks(Downloader.download({
        id: CourseData.getBundledFirstLessonId(course),
        url: localUrl,
        destination: DownloadManager.getDownloadStagingLocation(
          CourseData.getBundledFirstLessonId(course),
        ),
        // @ts-ignore
        network: Downloader.Network.ALL,
      }));
    }
  }
};

export const useDownloadStatus = (
  course: Course,
  lesson: number,
): Download => {
  const downloadId = DownloadManager.getDownloadId(course, lesson);

  const [downloadProgress, setDownloadProgress] = useState(
    DownloadManager._downloads[downloadId] || null,
  );

  useEffect(() => {
    // not sure, but I think I need to make a new function inside useEffect
    const update = (progress: any) => {
      setDownloadProgress(progress);
    };

    DownloadManager.subscribeToDownloadUpdates(downloadId, update);
    return () => {
      DownloadManager.unsubscribeFromDownloadUpdates(downloadId, update);
    };
  }, [downloadId, downloadProgress]);

  return downloadProgress;
};

export default DownloadManager;
