import React, {createContext, useContext} from 'react';
import {ViewProps} from 'react-native';

interface LessonContextShape {
  lesson: number;
}
const LessonContext = createContext<LessonContextShape>(
  {} as LessonContextShape,
);

export const useLessonContext = () => useContext(LessonContext);

interface LessonProviderProps extends ViewProps {
  lesson: number;
  children?: React.ReactNode;
}

export function LessonProvider({
  lesson,
  children,
}: LessonProviderProps) {
  return (
    <LessonContext.Provider value={{lesson}}>
      {children}
    </LessonContext.Provider>
  );
}
