import React, { useCallback } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";
import { DrawerActions } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import logo from "../../../legacy/resources/LT-logo-text.png";

const DrawerContent = (props: DrawerContentComponentProps) => {
  const router = useRouter();

  type NavTarget = "/" | "/settings" | "/about";

  const navigateTo = useCallback(
    (pathname: NavTarget) => {
      props.navigation.dispatch(DrawerActions.closeDrawer());
      router.navigate(pathname);
    },
    [props.navigation, router]
  );

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.container}
    >
      <View style={styles.headerContainer}>
        <Image
          source={logo}
          style={styles.headerImage}
          resizeMode="contain"
          accessibilityLabel="Language Transfer"
        />
      </View>

      <DrawerItem
        label={() => (
          <View style={styles.menuItemContainer}>
            <FontAwesome5
              name="home"
              size={18}
              color="#555"
              style={styles.menuItemIcon}
            />
            <Text style={styles.menuItemText}>All Languages</Text>
          </View>
        )}
        onPress={() => navigateTo("/")}
      />
      <DrawerItem
        label={() => (
          <View style={styles.menuItemContainer}>
            <FontAwesome5
              name="cog"
              size={18}
              color="#555"
              style={styles.menuItemIcon}
            />
            <Text style={styles.menuItemText}>Settings</Text>
          </View>
        )}
        onPress={() => navigateTo("/settings")}
      />
      <DrawerItem
        label={() => (
          <View style={styles.menuItemContainer}>
            <FontAwesome5
              name="info-circle"
              size={18}
              color="#555"
              style={styles.menuItemIcon}
            />
            <Text style={styles.menuItemText}>About</Text>
          </View>
        )}
        onPress={() => navigateTo("/about")}
      />
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
  },
  headerContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderBottomColor: "#e5e5e5",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 20,
    marginBottom: 16,
  },
  headerImage: {
    marginTop: 12,
    width: 140,
    height: 160,
  },
  menuItemContainer: {
    padding: 0,
    margin: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemIcon: {
    paddingRight: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
});

export default DrawerContent;
