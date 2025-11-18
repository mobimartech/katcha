import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import TSBackgroundFetch
import UserNotifications
import RNCPushNotificationIOS

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Initialize Firebase first
    FirebaseApp.configure()
    print("Firebase configured successfully")
    
    // Configure notifications
    configureNotifications()
    
    // ✅ [REQUIRED] Register BackgroundFetch
    TSBackgroundFetch.sharedInstance().didFinishLaunching()

    
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "MyMNIProject",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
  
  // MARK: - Notification Configuration
  private func configureNotifications() {
    print("============================================")
    print("Configuring notifications for iOS device...")
    print("============================================")
    
    // Set delegate BEFORE requesting permissions
    UNUserNotificationCenter.current().delegate = self
    
    // Request notification permissions
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
      DispatchQueue.main.async {
        if let error = error {
          print("❌ Notification permission error: \(error)")
        } else {
          print("✅ Notification permission granted: \(granted)")
          if granted {
            print("✅ User granted notification permissions")
            // Optionally register for remote notifications if enabled in Info.plist
            let enableRemote = Bundle.main.object(forInfoDictionaryKey: "EnableRemoteNotifications") as? Bool ?? false
            if enableRemote {
              print("🔔 Registering for APNs (EnableRemoteNotifications=true)")
              UIApplication.shared.registerForRemoteNotifications()
            } else {
              print("ℹ️ Skipping APNs registration (EnableRemoteNotifications=false). Local notifications will still work.")
            }
          } else {
            print("❌ User denied notification permissions")
          }
        }
      }
    }
    
    // Check current notification settings
    UNUserNotificationCenter.current().getNotificationSettings { settings in
      print("📱 Current notification settings:")
      print("   - Authorization Status: \(settings.authorizationStatus.rawValue)")
      print("   - Alert Setting: \(settings.alertSetting.rawValue)")
      print("   - Badge Setting: \(settings.badgeSetting.rawValue)")
      print("   - Sound Setting: \(settings.soundSetting.rawValue)")
      print("   - Notification Center Setting: \(settings.notificationCenterSetting.rawValue)")
    }
  }
}

// MARK: - UNUserNotificationCenterDelegate
extension AppDelegate: UNUserNotificationCenterDelegate {
  // Handle notification when app is in foreground
  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    print("Notification received in foreground: \(notification.request.content.title)")
    completionHandler([.alert, .badge, .sound])
  }
  
  // Handle notification tap
  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    print("📲 Notification tapped: \(response.notification.request.content.title)")
    RNCPushNotificationIOS.didReceive(response)
    completionHandler()
  }
  
  // MARK: - Remote Notification Registration (Required for real devices)
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    print("✅ Successfully registered for remote notifications")
    let tokenParts = deviceToken.map { data in String(format: "%02.2hhx", data) }
    let token = tokenParts.joined()
    print("📱 Device Token: \(token)")
  }
  
  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("❌ Failed to register for remote notifications: \(error)")
    print("⚠️  This is normal for simulators, but on real devices check:")
    print("   - Notification permissions in Settings")
    print("   - Code signing and provisioning profile")
    print("   - Push notification capability is enabled")
  }
}


class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
