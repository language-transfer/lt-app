import React from 'react';
import useStatusBarStyle from '../../hooks/useStatusBarStyle';
import LanguageHomeBody from './LanguageHomeBody.react';

const LanguageHome = () => {
  useStatusBarStyle('white', 'dark-content');

  return <LanguageHomeBody />;
};

export default LanguageHome;
