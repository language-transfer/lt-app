import React from 'react';

export const navigationRef = React.createRef();

export const navigate = (route, params) => {
  navigationRef.current?.navigate(route, params);
};

export const pop = () => {
  // gotta call goBack like a dummy since pop only exists on stacknavigator and this is a level up
  navigationRef.current?.goBack();
};
