import 'react-native-gesture-handler';

import React, {useEffect, useState} from 'react';
import {AppState} from 'react-native';

import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import LanguageSelector from './LanguageSelector/LanguageSelector.react';
import LanguageHome from './LanguageHome/LanguageHome.react';
import Listen from './Listen/Listen.react';
import AllLessons from './AllLessons/AllLessons.react';
import {genMostRecentListenedCourse} from '../persistence';

import CourseData from '../course-data';
import {navigationRef} from '../navigation-ref';
import About from './About/About.react';
import Settings from './Settings/Settings.react';
import DataManagement from './DataManagement/DataManagement.react';
import {log} from '../metrics';

const Stack = createStackNavigator();

const App = () => {
  // one day, the Suspense documentation page won't have a bunch of red warnings at the top
  const [recentCourse, setRecentCourse] = useState(null);

  useEffect(() => {
    const logAppStateChange = (newState) =>
      log({
        action: 'app_state_change',
        surface: newState, // 'surface' is a little weird but prefer to new column
      });

    AppState.addEventListener('change', logAppStateChange);

    return () => {
      AppState.removeEventListener('change', logAppStateChange);
    };
  }, []);

  useEffect(() => {
    (async () => {
      const course = await genMostRecentListenedCourse();
      setRecentCourse({course});
    })();
  }, []);

  if (recentCourse === null) {
    return null;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={(state) => {
        const route = state.routes[state.index];

        log({
          action: 'navigate',
          surface: route.name,
          course: route.params?.course,
          lesson: route.params?.lesson,
        });
      }}>
      <Stack.Navigator
        initialRouteName={
          // look at this FORESIGHT to check for it in course data
          !recentCourse.course || !CourseData.courseExists(recentCourse.course)
            ? 'Language Selector'
            : 'Language Home'
        }>
        <Stack.Screen
          name="Language Selector"
          component={LanguageSelector}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Language Home"
          component={LanguageHome}
          options={{
            headerShown: false,
          }}
          initialParams={{course: recentCourse.course}}
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
          options={({route}) => ({
            headerTitle: `${CourseData.getCourseShortTitle(
              route.params.course,
            )}: All Lessons`,
          })}
        />
        <Stack.Screen
          name="About"
          component={About}
          options={{
            headerTitle: 'About',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={Settings}
          options={{
            headerTitle: 'Settings',
          }}
        />
        <Stack.Screen
          name="Data Management"
          component={DataManagement}
          options={({route}) => ({
            headerTitle: `${CourseData.getCourseShortTitle(
              route.params.course,
            )}: Data Management`,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
