// React Native Navigation Drawer
// https://aboutreact.com/react-native-navigation-drawer/
import React, { useEffect } from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";
import { variables } from "../../constants";
import Theme from "../../constants/Theme";
import { Ionicons } from "@expo/vector-icons";

const adUnitId =
  Platform.OS === "android"
    ? variables.APP.admobBannerAndroid
    : variables.APP.admobBannerIOS;

const BannerPage = ({ navigation, size }) => {
  useEffect(() => {}, []);

  return (
    <View
      style={{
        backgroundColor: Theme.COLORS.WHITE,
        alignSelf: "center",
      }}
    >
      <BannerAd
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.COLORS.WHITE,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 30,
    textAlign: "center",
    color: Theme.COLORS.PRIMARY,
  },
  button: {
    width: "90%",
    margin: 10,
    height: 100,
    borderRadius: 60,
    backgroundColor: Theme.COLORS.PRIMARY,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonTitle: {
    fontSize: 25,
    textAlign: "center",
    color: Theme.COLORS.WHITE,
    alignItems: "center",
    marginLeft: 10,
  },
});

export default BannerPage;
