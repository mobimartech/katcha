// import appsFlyer from 'react-native-appsflyer';

// class AppsFlyerService {
//   // Track subscription purchase
//   static trackSubscriptionPurchase(
//     revenue: number,
//     currency: string,
//     productId: string,
//     transactionId: string,
//     subscriptionType: 'weekly' | 'yearly'
//   ) {
//     const eventName = 'af_subscribe';
//     const eventValues = {
//       af_revenue: revenue,
//       af_currency: currency,
//       af_content_id: productId,
//       af_receipt_id: transactionId,
//       subscription_type: subscriptionType,
//       af_content_type: 'premium_subscription',
//     };

//     appsFlyer.logEvent(
//       eventName,
//       eventValues,
//       (res) => {
//         console.log('✅ Subscription tracked in AppsFlyer:', res);
//       },
//       (err) => {
//         console.error('❌ Failed to track subscription:', err);
//       }
//     );
//   }

//   // Track subscription renewal
//   static trackSubscriptionRenewal(
//     revenue: number,
//     currency: string,
//     productId: string
//   ) {
//     appsFlyer.logEvent('af_subscribe_renewal', {
//       af_revenue: revenue,
//       af_currency: currency,
//       af_content_id: productId,
//     });
//   }

//   // Track subscription cancellation
//   static trackSubscriptionCancellation(productId: string, reason?: string) {
//     appsFlyer.logEvent('af_subscription_cancel', {
//       af_content_id: productId,
//       cancellation_reason: reason || 'user_initiated',
//     });
//   }

//   // Track trial start
//   static trackTrialStart(productId: string) {
//     appsFlyer.logEvent('af_trial_start', {
//       af_content_id: productId,
//     });
//   }

//   // Track user registration/signup
//   static trackUserSignup(method: string) {
//     appsFlyer.logEvent('af_complete_registration', {
//       af_registration_method: method,
//     });
//   }

//   // Track custom in-app events
//   static trackCustomEvent(eventName: string, eventValues?: any) {
//     appsFlyer.logEvent(eventName, eventValues || {});
//   }

//   // Set user ID (for cross-device tracking)
//   static setCustomerUserId(userId: string) {
//     appsFlyer.setCustomerUserId(userId, (res) => {
//       console.log('✅ Customer User ID set:', res);
//     });
//   }

//   // Get AppsFlyer UID
//   static async getAppsFlyerUID(): Promise<string> {
//     return new Promise((resolve, reject) => {
//       appsFlyer.getAppsFlyerUID((err, uid) => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(uid);
//         }
//       });
//     });
//   }
// }

// export default AppsFlyerService;
