import React, {useState, useEffect} from 'react';
import SideMenu from 'react-native-side-menu';

import LanguageHomeHeader from './LanguageHomeHeader.react';
import LanguageHomeBody from './LanguageHomeBody.react';
import LeftDrawer from './LeftDrawer.react';
import changeNavigationBarColor from 'react-native-navigation-bar-color';

const LanguageHome = (props) => {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    return props.navigation.addListener('focus', () => {
      changeNavigationBarColor('transparent', true);
    });
  }, [props.navigation]);

  return (
    <SideMenu
      menu={<LeftDrawer navigation={props.navigation} />}
      isOpen={menuOpen}
      onChange={(open) => setMenuOpen(open)}>
      <LanguageHomeHeader
        onOpenMenu={() => setMenuOpen(true)}
        route={props.route}
      />
      <LanguageHomeBody navigation={props.navigation} route={props.route} />
    </SideMenu>
  );
};

export default LanguageHome;
