import React from 'react';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import {CompositeNavigationProp} from '@react-navigation/native';
import {AppParamList} from '../App.react';
import {DrawerNavigationProp} from '@react-navigation/drawer';

import {CourseProvider} from '../Context/CourseContext';
import DrawerMenuButton from './DrawerMenuButton.react';
import LanguageHome from '../LanguageHome/LanguageHome.react';
import Listen from '../Listen/Listen.react';
import AllLessons from '../AllLessons/AllLessons.react';
import DataManagement from '../DataManagement/DataManagement.react';

import CourseData from '../../course-data';

export type LanguageStackParamList = {
  'Language Home': undefined;
  Listen: {
    lesson: number;
  };
  'All Lessons': undefined;
  'Data Management': undefined;
};
export type LanguageStackScreenProps = CompositeNavigationProp<
  DrawerNavigationProp<AppParamList, 'Language'>,
  StackNavigationProp<LanguageStackParamList>
>;

const Stack = createStackNavigator<LanguageStackParamList>();

// @todo: create types for navigators
const LanguageNav = (props: any) => {
  const params = props.route.params;
  const {course} = params;

  if (!course) {
    return null;
  }
  const courseData = CourseData.getCourseData(course as Course);
  if (!courseData) {
    return null;
  }

  return (
    <CourseProvider course={course} courseData={courseData}>
      <Stack.Navigator initialRouteName={'Language Home'}>
        <Stack.Screen
          name="Language Home"
          component={LanguageHome}
          options={() => ({
            headerLeft: () => <DrawerMenuButton />,
            headerTitle: `${courseData.shortTitle}: All Lessons`,
          })}
        />
        <Stack.Screen
          name="Listen"
          component={Listen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="All Lessons"
          component={AllLessons}
          options={() => ({
            headerTitle: `${courseData.shortTitle}: All Lessons`,
            headerBackTitleVisible: false,
          })}
        />
        <Stack.Screen
          name="Data Management"
          component={DataManagement}
          options={() => ({
            headerTitle: `${courseData.shortTitle}: Data Management`,
            headerBackTitleVisible: false,
          })}
        />
      </Stack.Navigator>
    </CourseProvider>
  );
};

export default LanguageNav;
