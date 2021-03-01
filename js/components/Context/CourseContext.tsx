import React, {createContext, useContext} from 'react';
import {ViewProps} from 'react-native';

interface ICourseContextShape {
  course: Course;
}
const CourseContext = createContext<ICourseContextShape>(
  {} as ICourseContextShape,
);

export const useCourseContext = () => useContext(CourseContext);

interface CourseProviderProps extends ViewProps {
  course: Course;
  children?: React.ReactNode;
}

export function CourseProvider({
  course,
  children,
}: CourseProviderProps) {
  return (
    <CourseContext.Provider value={{course}}>
      {children}
    </CourseContext.Provider>
  );
}
