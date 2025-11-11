import { useEffect, useState } from 'react';

import DownloadManager from '@/src/services/downloadManager';
import type { Course } from '@/src/types';

export default function useIsLessonDownloaded(course: Course, lesson: number) {
  const [downloaded, setDownloaded] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    setDownloaded(null);
    const check = async () => {
      const result = await DownloadManager.genIsDownloaded(course, lesson);
      if (mounted) {
        setDownloaded(result);
      }
    };

    check();
    return () => {
      mounted = false;
    };
  }, [course, lesson]);

  return downloaded;
}
