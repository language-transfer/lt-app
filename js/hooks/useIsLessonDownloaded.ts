import {useState, useEffect} from 'react';
import {useCourseContext} from '../components/Context/CourseContext';
import {useLessonContext} from '../components/Context/LessonContext';
import DownloadManager from '../download-manager';

export default function useIsLessonDownloaded() {
  const {course} = useCourseContext();
  const {lesson} = useLessonContext();

  const [downloaded, setDownloaded] = useState<Maybe<boolean>>(null);
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
