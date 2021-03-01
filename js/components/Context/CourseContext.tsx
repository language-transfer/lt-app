import React, {createContext, useContext} from 'react';
import {ViewProps} from 'react-native';

interface ICourseContextShape {
  course: Course;
  courseData: ICourseData;
}
const CourseContext = createContext<ICourseContextShape>(
  {} as ICourseContextShape,
);

export const useCourseContext = () => useContext(CourseContext);

interface CourseProviderProps extends ViewProps {
  course: Course;
  courseData: ICourseData;
  children?: React.ReactNode;
}

export function CourseProvider({
  course,
  courseData,
  children,
}: CourseProviderProps) {
  return (
    <CourseContext.Provider value={{course, courseData}}>
      {children}
    </CourseContext.Provider>
  );
}
