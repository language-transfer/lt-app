import {NavigationState} from '@react-navigation/native';
import {log} from '../metrics';
import {useCallback} from 'react';

// this will return an object the route's params,
// along with any params set in nested routes
export function getNestedParams(state: Maybe<NavigationState>): KeyValMap {
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
  return useCallback((state: Maybe<NavigationState>) => {
    const route = state?.routes[state.index];
    if (!route) {
      return;
    }

    // Try to find {course, lesson} in the navigation
    // params. since <Lesson/> is a nested screen inside LangNav,
    // we'll need to recursively check route params.
    // You might wonder why we don't just use the {Course,Lesson}Context
    // objects? -- because their respective providers are nested in the NavigationContainer,
    // and thus are inaccessible to NavigationContainer's onStateChange
    const params = getNestedParams(state);

    log({
      action: 'navigate',
      surface: route.name,
      course: params.course,
      lesson: params.lesson,
    });
  }, []);
}
