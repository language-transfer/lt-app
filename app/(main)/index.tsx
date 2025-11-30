import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import LanguageSelector from "@/src/components/language-selector/LanguageSelector";
import CourseData from "@/src/data/courseData";
import { genMostRecentListenedCourse } from "@/src/storage/persistence";

let hasHandledInitialRedirect = false;

export default function Index() {
  const [checkingRecentCourse, setCheckingRecentCourse] = useState(!hasHandledInitialRedirect);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    if (hasHandledInitialRedirect) {
      setCheckingRecentCourse(false);
      return () => {
        cancelled = true;
      };
    }

    const maybeRedirectToRecentCourse = async () => {
      try {
        const course = await genMostRecentListenedCourse();
        if (!cancelled && course && CourseData.courseExists(course)) {
          hasHandledInitialRedirect = true;
          router.replace({
            pathname: "/course/[course]",
            params: { course },
          });
          return;
        }
      } catch {
        // Ignore storage errors and fall back to selector.
      }

      if (!cancelled) {
        hasHandledInitialRedirect = true;
        setCheckingRecentCourse(false);
      }
    };

    void maybeRedirectToRecentCourse();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checkingRecentCourse) {
    return null;
  }

  return <LanguageSelector />;
}
