import { variables } from '.';

export default {
  APP: {
    // SPLASH
    app_name: 'Katcha',
    packageName: 'com.mni.katcha.social.follower.tracker',
    app_title: 'Katcha',
    app_sub: 'Katcha',
    email: '',
    SplashName: 'Splash',
    slogan: '@2026',
    version: '1.0',

    // Ad Configuration
    USE_TEST_ADS: false, // Set to false for production

    admobBanner: 'ca-app-pub-9723484343254667/80749306860',
    admobInterstitial: 'ca-app-pub-9723484343254667/4187656745',

    // AdMob Production IDs - Same for both Android and iOS
    admobBannerAndroid: 'ca-app-pub-9723484343245567/8074930860', // Production Banner ID
    admobBannerIOS: 'ca-app-pub-9723484343245567/8074930860', // Production Banner ID (same as Android)

    admobInterstitialAndroid: 'ca-app-pub-9723484343245567/4187656745', // Production Interstitial ID
    admobInterstitialIOS: 'ca-app-pub-9723484343245567/4187656745', // Production Interstitial ID (same as Android)

    admobRewardAndroid: 'ca-app-pub-3144169908690020/307881871', // Production Reward ID
    admobRewardIOS: 'ca-app-pub-3144169908690020/307881871', // Production Reward ID (same as Android)

    // Ad Helper Functions
    getAdId: function (adType, platform) {
      const adIds = {
        banner: {
          android: this.USE_TEST_ADS
            ? 'ca-app-pub-3940256099942544/6300978111'
            : this.admobBannerAndroid,
          ios: this.USE_TEST_ADS
            ? 'ca-app-pub-3940256099942544/2934735716'
            : this.admobBannerIOS,
        },
        interstitial: {
          android: this.USE_TEST_ADS
            ? 'ca-app-pub-3940256099942544/1033173712'
            : this.admobInterstitialAndroid,
          ios: this.USE_TEST_ADS
            ? 'ca-app-pub-3940256099942544/4411468910'
            : this.admobInterstitialIOS,
        },
        reward: {
          android: this.USE_TEST_ADS
            ? 'ca-app-pub-3940256099942544/5224354917'
            : this.admobRewardAndroid,
          ios: this.USE_TEST_ADS
            ? 'ca-app-pub-3940256099942544/5224354917'
            : this.admobRewardIOS,
        },
      };
      return adIds[adType] && adIds[adType][platform]
        ? adIds[adType][platform]
        : null;
    },

    // Reward Ad Configuration
    REWARD_AD_CONFIG: {
      ADS_REQUIRED: 2, // Number of ads user needs to watch
      GENERATIONS_REWARD: 1, // Number of generations given as reward
      FREE_GENERATIONS_LIMIT: 0, // Number of free generations before paywall
      AD_RETRY_DELAY: 30000, // Retry delay in milliseconds (30 seconds)
      MAX_DAILY_AD_REWARDS: 0, // Maximum reward points from ads per day
      ENABLE_AD_DEBUG: true, // Enable detailed ad debugging logs
      CONFIGURABLE_ADS: true, // Allow changing ads required via config
    },

    // Test Ad Configuration
    TEST_AD_CONFIG: {
      SHOW_TEST_SUITE: false, // Show Google Ad Manager test suite
      FORCE_TEST_LABELS: true, // Force test ad labels to appear
      LOG_AD_EVENTS: true, // Log all ad events for debugging
    },

    // Post-Purchase Reward Configuration
    PURCHASE_REWARD_CONFIG: {
      ENABLED: true, // Enable/disable post-purchase rewards
      GENERATIONS_REWARD: 20, // Number of free generations given after purchase
      EXPIRES_WITH_SUBSCRIPTION: true, // Whether rewards expire when subscription ends
    },

    // Legal Links
    TERMS_URL: 'https://katchaapp.org/terms.html',
    PRIVACY_URL: 'https://katchaapp.org/privacy.html',
  },
  URL: {},
};
