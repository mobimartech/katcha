import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { InterstitialAd, AdEventType } from "react-native-google-mobile-ads";
import variables from "../variables";
const adUnitId =
  Platform.OS === "android"
    ? variables.APP.admobInterstitialAndroid
    : variables.APP.admobInterstitialIOS;
const interstitial = InterstitialAd.createForAdRequest(adUnitId, {});

export default () => {
  const navigation = useNavigation<CreateAccountNavigationProp>();
  const wordsArray = ["Hello", "World", "React", "Native"];
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setLoaded(true);
      }
    );

    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      interstitial.load();
      console.log("closed");
    });
    // Start loading the interstitial straight away
    interstitial.load();
    // Unsubscribe from events on unmount
    return unsubscribe;
  }, []);

  const showInterstitialAd = () => {
    if (interstitial.loaded === true) {
      interstitial.show();
      interstitial.load();
    }
  };
  const navigateTo = (route: keyof AuthStackParamList) => {
    navigation.navigate(route);
  };

  return {
    navigateTo,
    wordsArray,
    showInterstitialAd,
  };
};
