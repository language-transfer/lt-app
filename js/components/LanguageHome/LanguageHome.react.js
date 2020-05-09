import React, {useState, useEffect} from 'react';
import SideMenu from 'react-native-side-menu';
import {StatusBar} from 'react-native';

import LanguageHomeHeader from './LanguageHomeHeader.react';
import LanguageHomeBody from './LanguageHomeBody.react';
import LeftDrawer from './LeftDrawer.react';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {log} from '../../metrics';

const LanguageHome = (props) => {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribers = [
      props.navigation.addListener('focus', () => {
        StatusBar.setBackgroundColor('white');
        StatusBar.setBarStyle('dark-content', true);
        changeNavigationBarColor('transparent', true);
      }),
      props.navigation.addListener('blur', () => {
        setMenuOpen(false);
      }),
    ];

    return () => unsubscribers.forEach((x) => x());
  }, [props.navigation]);

  return (
    <SideMenu
      menu={<LeftDrawer navigation={props.navigation} />}
      isOpen={menuOpen}
      onChange={(open) => {
        log({
          action: (open ? 'open' : 'close') + '_menu_drawer',
          surface: 'language_home',
          course: props.route.params.course,
        });
        setMenuOpen(open);
      }}>
      <LanguageHomeHeader
        onOpenMenu={() => setMenuOpen(true)}
        route={props.route}
      />
      <LanguageHomeBody navigation={props.navigation} route={props.route} />
    </SideMenu>
  );
};

export default LanguageHome;
