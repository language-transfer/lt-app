import React, {createContext, useContext} from 'react';
import {ViewProps} from 'react-native';

interface ILessonContextShape {
  lesson: number;
  lessonData: ILessonData;
}
const LessonContext = createContext<ILessonContextShape>(
  {} as ILessonContextShape,
);

export const useLessonContext = () => useContext(LessonContext);

interface LessonProviderProps extends ViewProps {
  lesson: number;
  lessonData: ILessonData;
  children?: React.ReactNode;
}

export function LessonProvider({
  lesson,
  lessonData,
  children,
}: LessonProviderProps) {
  return (
    <LessonContext.Provider value={{lesson, lessonData}}>
      {children}
    </LessonContext.Provider>
  );
}
