let _navigationRef = null;
export const setNavigationRef = (ref) => _navigationRef = ref;

export const navigate = (route, params) => {
  _navigationRef?.navigate(route, params);
};

export const pop = () => {
  // gotta call goBack like a dummy since pop only exists on stacknavigator and this is a level up
  _navigationRef?.goBack();
};
