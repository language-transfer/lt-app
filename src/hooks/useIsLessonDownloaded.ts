import { useEffect, useState } from 'react';

import DownloadManager from '@/src/services/downloadManager';
import type { Course, DownloadSnapshot } from '@/src/types';

export default function useIsLessonDownloaded(course: Course, lesson: number) {
  const [downloaded, setDownloaded] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const downloadId = DownloadManager.getDownloadId(course, lesson);

    const refresh = async () => {
      const result = await DownloadManager.genIsDownloaded(course, lesson);
      if (mounted) {
        setDownloaded(result);
      }
    };

    setDownloaded(null);
    refresh();

    const listener = (_snapshot: DownloadSnapshot | null) => {
      refresh();
    };

    DownloadManager.subscribeToDownloadUpdates(downloadId, listener);

    return () => {
      mounted = false;
      DownloadManager.unsubscribeFromDownloadUpdates(downloadId, listener);
    };
  }, [course, lesson]);

  return downloaded;
}
