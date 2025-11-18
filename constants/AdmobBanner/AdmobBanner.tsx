import React, { useState } from "react";
import { Platform, TouchableOpacity, View } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";
import variables from "../variables";

const AdmobBanner = ({ type }: any) => {
  const [adUnitId, setAdUnitId] = useState(
    Platform.OS === "android"
      ? variables.APP.admobBannerAndroid
      : variables.APP.admobBannerIOS
  );

  return (
    <View style={{ alignSelf: "center", marginBottom: 5 }}>
      <BannerAd
        unitId={adUnitId}
        size={type}
        // requestOptions={{
        //   requestNonPersonalizedAdsOnly: true,
        // }}
      />
    </View>
  );
};

export default React.memo(AdmobBanner);
