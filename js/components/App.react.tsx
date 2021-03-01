import 'react-native-gesture-handler';

import React, {useEffect, useState, useMemo} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import DrawerContent from './Nav/DrawerContent.react';
import HomeNav from './Nav/HomeNav.react';
import LanguageNav from './Nav/LanguageNav.react';
import Splash from './Nav/Splash.react';
import {genMostRecentListenedCourse} from '../persistence';
import useNavStateLogger from '../hooks/useNavStateLogger';
import CourseData from '../course-data';
import {navigationRef} from '../navigation-ref';
import {log} from '../metrics';

export type AppParamList = {
  Home: undefined;
  Language: {
    course: Maybe<Course>;
  };
};

const Drawer = createDrawerNavigator<AppParamList>();

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

  const onStateChange = useNavStateLogger();

  const initialRouteName = useMemo(
    () =>
      !recentCourse || !CourseData.courseExists(recentCourse)
        ? 'Home'
        : 'Language',
    [recentCourse],
  );

  if (!loaded) {
    return <Splash />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} onStateChange={onStateChange}>
        <Drawer.Navigator
          initialRouteName={initialRouteName}
          drawerContent={(props) => <DrawerContent {...props} />}>
          <Drawer.Screen
            name={'Home'}
            component={HomeNav}
            options={{gestureEnabled: false}}
          />
          <Drawer.Screen
            name={'Language'}
            component={LanguageNav}
            initialParams={{course: recentCourse}}
          />
        </Drawer.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
