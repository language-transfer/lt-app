import {NavigationState} from '@react-navigation/native';
import {log} from '../metrics';
import {useCallback} from 'react';

// this will return an object with the route's params,
// along with any params set in nested routes
export function getNestedParams(state: any): {[key: string]: any} {
  if (!state) {
    return {};
  }

  const route = state?.routes[state.index];

  // recursively visit nested navigators
  if (route.state) {
    return {
      ...route.params,
      ...getNestedParams(route.state as NavigationState),
    };
  }

  return {...route.params};
}

export default function useNavStateLogger() {
  // todo: this type signature is messed up
  return useCallback((state: any) => {
    const route = state?.routes[state.index];
    if (!route) {
      return;
    }

    // Try to find {course, lesson} in the navigation
    // params. since <Lesson/> is a nested screen inside LangNav,
    // we'll need to recursively check route params.
    const params = getNestedParams(state);

    log({
      action: 'navigate',
      surface: route.name,
      course: params.course,
      lesson: params.lesson,
    });
  }, []);
}
