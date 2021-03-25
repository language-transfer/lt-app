import 'react-native-gesture-handler';

import React, {useEffect, useState, useMemo, useCallback} from 'react';
import {AppState, AppStateStatus, useWindowDimensions} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import DrawerContent from './Navigation/DrawerContent.react';
import {genMostRecentListenedCourse} from '../persistence';
import useNavStateLogger from '../hooks/useNavStateLogger';
import CourseData from '../course-data';
import {navigationRef} from '../navigation-ref';
import {log} from '../metrics';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import Listen from './Listen/Listen.react';
import AllLessons from './AllLessons/AllLessons.react';
import DataManagement from './DataManagement/DataManagement.react';
import LanguageSelector from './LanguageSelector/LanguageSelector.react';
import About from './About/About.react';
import Settings from './Settings/Settings.react';
import DrawerMenuButton from './Navigation/DrawerMenuButton.react';
import LanguageHomeBody from './LanguageHome/LanguageHome.react';
import SplashScreen from './SplashScreen.react';

type MainParamList = {
  'Language Home': {
    course: Course;
  };
  Listen: {
    lesson: number;
    course: Course;
  };
  'All Lessons': {
    course: Course;
  };
  'Data Management': {
    course: Course;
  };
  'Language Selector': undefined;
  About: undefined;
  Settings: undefined;
};

export type MainNavigationProp<T extends keyof MainParamList> = StackNavigationProp<MainParamList, T>;

const App = () => {
  // one day, the Suspense documentation page won't have a bunch of red warnings at the top
  const [loaded, setLoaded] = useState(false);
  const [recentCourse, setRecentCourse] = useState<Course | null>(null);

  useEffect(() => {
    const logAppStateChange = (newState: AppStateStatus) =>
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
    const loadRecentCourse = async () => {
      const course = await genMostRecentListenedCourse();
      setRecentCourse(course);
      setLoaded(true);
    };

    loadRecentCourse();
  }, []);

  const initialRouteName = useMemo(
    () =>
      !recentCourse || !CourseData.courseExists(recentCourse)
        ? 'Language Selector'
        : 'Language Home',
    [recentCourse],
  );

  const screensWithDisabledDrawer: Array<keyof MainParamList> = ['Language Selector', 'Listen'];

  const [gestureEnabled, setGestureEnabled] = useState(screensWithDisabledDrawer.includes(initialRouteName));

  const navStateLogger = useNavStateLogger();

  useEffect(() => {
    if (navigationRef.current) {
      // onStateChange won't work for some reason
      // https://stackoverflow.com/questions/60593474
      return navigationRef.current.addListener('state', e => {
        const state = e.data.state;
        navStateLogger(state);

        if (state.routes.length && screensWithDisabledDrawer.includes(state.routes[state.routes.length - 1].name)) {
          setGestureEnabled(false);
        } else {
          setGestureEnabled(true);
        }
      });
    }
  }, [navigationRef.current]);

  if (!loaded) {
    return <SplashScreen />;
  }

  const Drawer = createDrawerNavigator<{Main: undefined}>();
  const Stack = createStackNavigator<MainParamList>();

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Drawer.Navigator
          drawerContent={(props) => <DrawerContent {...props} />}>
          <Drawer.Screen name="Main" options={{ gestureEnabled }}>
            {() => // TODO(ios-merge): put this in another file probably
              <NavigationContainer ref={navigationRef} independent>
                <Stack.Navigator initialRouteName={initialRouteName}>
                  <Stack.Screen
                    name="Language Home"
                    component={LanguageHomeBody}
                    options={({ route }) => ({
                      headerLeft: () => <DrawerMenuButton />,
                      headerTitle: `${CourseData.getCourseFullTitle(route.params.course)}`,
                    })}
                    initialParams={{ course: recentCourse! }}
                  />
                  <Stack.Screen
                    name="Listen"
                    component={Listen}
                    options={{
                      headerShown: false,
                      gestureEnabled: false, // interferes with the scrubber, and there's no drawer icon so I don't mind
                    }}
                  />
                  <Stack.Screen
                    name="All Lessons"
                    component={AllLessons}
                    options={({ route }) => ({
                      headerTitle: `${CourseData.getCourseShortTitle(
                        route.params.course,
                      )}: All Lessons`,
                      headerBackTitleVisible: false,
                    })}
                  />
                  <Stack.Screen
                    name="Data Management"
                    component={DataManagement}
                    options={({ route }) => ({
                      headerTitle: `${CourseData.getCourseFullTitle(route.params.course)}: Data Management`,
                      headerBackTitleVisible: false,
                    })}
                  />
                  <Stack.Screen
                    name="Language Selector"
                    component={LanguageSelector}
                    options={({ route }) => ({
                      headerShown: false,
                      // disable drawer swipe in home screen
                      gestureEnabled: route.name !== 'Language Selector',
                    })}
                  />
                  <Stack.Screen
                    name="About"
                    component={About}
                    options={{
                      title: 'About',
                    }}
                  />
                  <Stack.Screen
                    name="Settings"
                    component={Settings}
                    options={{
                      title: 'Settings',
                    }}
                  />
                </Stack.Navigator>
              </NavigationContainer>
            }
          </Drawer.Screen>
        </Drawer.Navigator>
      </NavigationContainer>

    </SafeAreaProvider>
  );
};

export default App;
