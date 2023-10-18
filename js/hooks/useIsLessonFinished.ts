import {useState, useEffect} from 'react';
import {genProgressForLesson} from '../persistence';

export default function useIsLessonFinished(course: Course, lesson: number) {
  const [finished, setFinished] = useState<boolean | null>(null);
  useEffect(() => {
    async function checkIfFinished() {
      const resp = await genProgressForLesson(course, lesson);
      setFinished(resp?.finished || null);
    }

    setFinished(null);
    checkIfFinished();
  }, [course, lesson]);

  return finished;
}
