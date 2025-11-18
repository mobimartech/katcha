import { InterstitialAd, AdEventType } from "react-native-google-mobile-ads";
import { variables } from "../../constants";
import { Platform } from "react-native";

const INTERSTITIAL_AD_UNIT_ID = "YOUR_INTERSTITIAL_AD_UNIT_ID";

const adUnitId =
  Platform.OS === "android"
    ? variables.APP.admobInterstitialAndroid
    : variables.APP.admobInterstitialIOS;

export const showInterstitial = async () => {};

const interstitial = InterstitialAd.createForAdRequest(
  adUnitId,
  {
    requestNonPersonalizedAdsOnly: true,
    keywords: ["fashion", "clothing"],
  }
);

export const showInterstitialAd = async () => {
  const unsubscribe = interstitial.addAdEventListener(
    AdEventType.LOADED,
    () => {
      interstitial.show();
    }
  );

  // Start loading the interstitial straight away
  interstitial.load();

  // Unsubscribe from events on unmount
  return unsubscribe;
};
