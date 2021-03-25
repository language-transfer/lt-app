import {useState, useEffect} from 'react';
import DownloadManager from '../download-manager';

export default function useIsLessonDownloaded(course: Course, lesson: number) {
  const [downloaded, setDownloaded] = useState<boolean | null>(null);
  useEffect(() => {
    async function checkIfDownloaded() {
      const resp = await DownloadManager.genIsDownloaded(course, lesson);
      setDownloaded(resp);
    }

    setDownloaded(null);
    checkIfDownloaded();
  }, [course, lesson]);

  return downloaded;
}
